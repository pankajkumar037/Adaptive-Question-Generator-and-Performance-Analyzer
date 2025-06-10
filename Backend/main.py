from fastapi import FastAPI, Query, Body, HTTPException, Request, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import tempfile
import shutil
import random
import logging
import time
import os
from dotenv import load_dotenv
import uvicorn
from contextlib import asynccontextmanager
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration





from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from db.models import User, UserLogin
from db.database import user_collection
from db.utils import hash_password, verify_password
from db.auth import create_access_token

# Load environment variables
load_dotenv()

# Configure Sentry for error tracking
if os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=os.getenv("SENTRY_DSN"),
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
        environment=os.getenv("ENVIRONMENT", "production")
    )

# Configure logging
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title="MCQ Generator API",
    description="API for generating multiple choice questions and analyzing performance",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/api/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=os.getenv("ALLOWED_HOSTS", "*").split(",")
)

# CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

from Question_generation.question_openai import generate_Question, improvements_in_subject
from reading_test.read import generate_reading_content_using_gpt
from reading_test.read import reading_pipeline


class MCQ(BaseModel):
    question: str = Field(..., min_length=10)
    options: List[str] = Field(..., min_items=4, max_items=4)
    answer: str
    Explanation: str = Field(..., min_length=20)

class ImprovementRequest(BaseModel):
    questions: Dict[str, List[Dict[str, Any]]]
    user_answers: Dict[str, List[Dict[str, Any]]]
    class_at_call: int = Field(..., ge=1, le=12)
    was_retake_attempt: bool = False

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error handler caught: {exc}", exc_info=True)
    if os.getenv("ENVIRONMENT") == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error. Please try again later."}
        )
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )


#loging register System
@app.get("/")
async def root():
    return "hello from databse backend"

@app.post("/register")
def register(user: User):
    # Check if email or phone already exists
    if user_collection.find_one({"$or": [{"email": user.email}, {"phone_number": user.phone_number}]}):
        raise HTTPException(status_code=400, detail="Email or phone number already registered")

    hashed_pwd = hash_password(user.password)
    user_data = {
        "username": user.username,
        "school": user.school,
        "email": user.email,
        "phone_number": user.phone_number,
        "class_name": user.class_name,
        "board": user.board,
        "password": hashed_pwd
    }
    user_collection.insert_one(user_data)
    return {"msg": "User registered successfully"}

@app.post("/login")
def login(user: UserLogin):
    try:
        # Validate input
        if not user.login or not user.password:
            raise HTTPException(status_code=400, detail="Login and password are required")

        # Find user by email or phone
        db_user = user_collection.find_one({
            "$or": [
                {"email": user.login},
                {"phone_number": user.login}
            ]
        })

        # Check if user exists
        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid login credentials")

        # Verify password
        if not verify_password(user.password, db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid password")

        # Create access token
        token = create_access_token(data={"sub": db_user["email"]})

        
        # Return user data and token
        info= {
            "access_token": token,
            "token_type": "bearer",
            "username": db_user["username"],
            "email": db_user["email"],
            "phone_number": db_user["phone_number"],
            "school": db_user["school"],
            "Board":db_user["board"],
            "Class": db_user["class_name"]
        }
        return info
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal server error during login: {e}")



@app.get("/generate_mcq")
async def generate_mcq(
    request: Request,
    board: str = Query(..., min_length=2, max_length=50),
    class_name: int = Query(..., ge=1, le=12),
    subjects: str = Query(..., min_length=2)
):
    try:
        logger.info(f"Generating MCQs for board: {board}, class: {class_name}, subjects: {subjects}")
        questions_data = generate_Question(subjects, board, class_name)
        
        if "error" in questions_data:
            logger.error(f"Error generating questions: {questions_data['error']}")
            raise HTTPException(status_code=500, detail=questions_data["error"])
            
        return questions_data

    except Exception as e:
        logger.error(f"Error in generate_mcq: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate questions")

@app.post("/improvement")
async def improvement(
    request: Request,
    payload: ImprovementRequest
):
    try:
        logger.info(f"Generating improvement suggestions")
        suggestions = improvements_in_subject(payload.dict())
        
        if "error" in suggestions:
            logger.error(f"Error generating suggestions: {suggestions['error']}")
            raise HTTPException(status_code=500, detail=suggestions["error"])
            
        return suggestions
    except Exception as e:
        logger.error(f"Error in improvement: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate improvement suggestions")
    



#Reading_section


@app.get("/generate_reading_content")
async def generate_reading_content(
    request: Request,
    board: str = Query(..., min_length=2, max_length=50),
    class_name: int = Query(..., ge=1, le=12),
    subject: str = Query(..., min_length=2)
):
    details = {"board": board, "class_name": class_name, "subject": subject}
    logger.info(f"Generating reading content")
    result = generate_reading_content_using_gpt(details)
    return JSONResponse(content={"text_content": result})




@app.post("/analyze_reading")
async def analyze_reading(
    audio_file: UploadFile = File(...),
    original_text: str = Form(...),
    subject: str = Form(...)
):
    logger.info(f"Analyzing reading")
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_audio:
            shutil.copyfileobj(audio_file.file, temp_audio)
            temp_audio_path = temp_audio.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded audio: {str(e)}")

    result = reading_pipeline(temp_audio_path, original_text, subject)
    print(result)
    return JSONResponse(content=result)
    


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    workers = int(os.getenv("WORKERS", 4))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development",
        workers=workers,
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
        proxy_headers=True,
        forwarded_allow_ips="*"
    )
