from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from models import User, UserLogin
from database import user_collection
from utils import hash_password, verify_password
from auth import create_access_token


app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


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
        "board":user.board,
        "email": user.email,
        "phone_number": user.phone_number,
        "class_name": user.class_name,
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
            "Class": db_user["class_name"]
        }
        return info
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal server error during login: {e}")
