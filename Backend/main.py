from fastapi import FastAPI, Query, Body, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import random
import logging
import time
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uvicorn
from contextlib import asynccontextmanager

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up application...")
    yield
    logger.info("Shutting down application...")

app = FastAPI(
    title="MCQ Generator API",
    description="API for generating multiple choice questions and analyzing performance",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

from Question_generation.question_openai import generate_Question, improvements_in_subject

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
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."}
    )

@app.get("/generate_mcq")
@limiter.limit("5/minute")
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
@limiter.limit("3/minute")
async def improvement(request: Request, payload: ImprovementRequest):
    try:
        logger.info("Generating improvement suggestions")
        suggestions = improvements_in_subject(payload.dict())
        
        if "error" in suggestions:
            logger.error(f"Error generating suggestions: {suggestions['error']}")
            raise HTTPException(status_code=500, detail=suggestions["error"])
            
        return suggestions
    except Exception as e:
        logger.error(f"Error in improvement: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate improvement suggestions")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        workers=4,
        log_level="info"
    )
