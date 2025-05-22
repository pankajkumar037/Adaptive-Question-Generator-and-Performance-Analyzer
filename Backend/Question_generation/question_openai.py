import openai
import os
from dotenv import load_dotenv


load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

with open("NEP_adaptive_data.txt", "r", encoding="utf-8") as f:
    Adaptive_data = f.read()



def generate_Question(subject: str, class_level: str, board: str, difficulty: int) -> dict:
    prompt = f"""
    Generate one Multiple Choice Question (MCQ) based on the following parameters:
    - Subject: {subject}
    - Class: {class_level}
    - Board: {board}
    - Difficulty Level: {difficulty}

    Generates an adaptive multiple-choice question based on subject, class, and board and current difficulty.
    learning_outcome : Specific learning outcome according to subject, class_level, board
    make sure every Question you ask from diffrent difficulty level is from diffrent chapters and diificulty of Question Increses by level means if Level 1 most Basic Queston Level 10 hard Question
    Your all Qn should be NEP of India data {Adaptive_data}

    Parameters:
    Difficulty has a Scale of 10
    subject (str): The subject of the question (e.g., 'Mathematics').
    class_level (str): The grade or class level (e.g., 'Class 8').
    board (str): The educational board (e.g., 'CBSE').
    difficulty (int): Current Difficulty level of the question on scale of 10 to be generated .

    The format should be JSON:
    {{
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Correct Option",
    "Explanation": "Short explanation of the correct answer."
    }}
    Only return the JSON object.
    """

    
    client = openai.OpenAI(api_key=openai.api_key)

   
    response = client.chat.completions.create(
        model="gpt-4",  
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    

    result = response.choices[0].message.content.strip()

    try:
        
        import json
        mcq = json.loads(result)
        return mcq
    except Exception as e:
        print("Failed to parse response:", e)
        return {"error": "Could not parse response", "raw": result}
    


