
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

load_dotenv()
google_api_key = os.getenv("GOOGLE_API_KEY")

MODEL_NAME = "gemini-2.0-flash"

model_available = False 
model = None 

if google_api_key:
    genai.configure(api_key=google_api_key)
    try:
        
        genai.get_model(MODEL_NAME)
        model = genai.GenerativeModel(MODEL_NAME)
        model_available = True
      
    except Exception as e:
        print(f"Error accessing model {MODEL_NAME}: {e}")
        print("Please check your API key and model name.")


# base_path = os.path.dirname(__file__)
# file_path = os.path.join(base_path, "NEP_adaptive_data.txt")

# print("file path--",file_path)

# with open(file_path, "r", encoding="utf-8") as f:
#     Adaptive_data = f.read()




def generate_Question(subject: str, class_level: str, board: str, difficulty: int) -> dict:
    
   
    if not model_available or model is None:
        print("Model is not available. Cannot generate content.")
        return None

    
    prompt = f"""
    Generate one Multiple Choice Question (MCQ) based on the following parameters:
    - Subject: {subject}
    - Class: {class_level}
    - Board: {board}
    - Difficulty Level: {difficulty}

    Generates an adaptive multiple-choice question based on subject, class, and board and current difficulty.
    learning_outcome : Specific learning outcome according to subject, class_level, board
    make sure every Question you ask from diffrent difficulty level is from diffrent chapters and diificulty of Question Increses by level means if Level 1 most Basic Queston Level 10 hard Question
    Your all Qn should be NEP 2020 of India data 

    Parameters:
    Difficulty has a Scale of 10
    subject (str): The subject of the question (e.g., 'Mathematics').
    class_level (str): The grade or class level (e.g., 'Class 8').
    board (str): The educational board (e.g., 'CBSE').
    difficulty (int): Current Difficulty level of the question on scale of 10 to be generated .

    The format should be JSON:
    not a sigle word aprt of json
    {{
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct Option",
    "Explanation": "Short explanation of the correct answer."
    }}
    Only return the JSON object.
    """



    try:
        
        response = model.generate_content(prompt)
        raw_response = response.text.strip() 

        
        if raw_response == "Ready for diagnosis":
            return raw_response 

        
        cleaned_res = raw_response
        if cleaned_res.startswith("```json"):
             cleaned_res = cleaned_res[len("```json"):].strip()
        if cleaned_res.endswith("```"):
             cleaned_res = cleaned_res[:-len("```")].strip()

        
        try:
            
            if cleaned_res.startswith('{') and cleaned_res.endswith('}'):
                parsed_json = json.loads(cleaned_res)
                
                return parsed_json
            else:
                 
                 print(f"Warning: Model returned unexpected format (not 'Ready for diagnosis' and not JSON-like): {raw_response}")
                 return None 

        except json.JSONDecodeError as e:
            
            print(f"JSONDecodeError: Could not parse response as JSON: {e}")
            print(f"Problematic string was:\n{raw_response}")
            return None 

    except Exception as e:
        
        print(f"An API error occurred during content generation: {e}")
        return None



