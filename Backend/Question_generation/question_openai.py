

import openai
import os
from dotenv import load_dotenv


load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")



def generate_Question(subject: str,board: str, curr_class:int) -> dict:
    prompt = f"""
    Generate a JSON object containing 5 multiple-choice questions for each subject provided: {subject}. The subjects are: [Subject1, Subject2, ...] (comma-separated). The questions should be suitable for Board: {board}, Class: {curr_class}.

    Each subject must contain exactly 5 questions in the following format:
    Make sure every question follows NEP 2020 guidelines of India and is from a different chapter.
    Your question should be of midium to hard level of that class.
    your answer should striclty in given below example format.
    remeber this is just an sample.

    Only return the JSON object as output.
  {
      {
    "Physics": [
      {
        "question": "What is the SI unit of force?",
        "options": ["Joule", "Watt", "Newton", "Pascal"],
        "answer": "Newton",
        "Explanation": "The SI unit of force is the Newton (N), named after Sir Isaac Newton."
      },
      {
        "question": "Which of the following is a scalar quantity?",
        "options": ["Velocity", "Acceleration", "Mass", "Force"],
        "answer": "Mass",
        "Explanation": "Mass is a scalar quantity as it only has magnitude, while velocity, acceleration, and force are vector quantities."
      },
      {
        "question": "What is the formula for kinetic energy?",
        "options": ["E = mc^2", "KE = 1/2 mv^2", "F = ma", "P = VI"],
        "answer": "KE = 1/2 mv^2",
        "Explanation": "Kinetic energy (KE) is the energy possessed by an object due to its motion, calculated as half times mass times velocity squared."
      },
      {
        "question": "Sound travels fastest in which medium?",
        "options": ["Air", "Water", "Vacuum", "Steel"],
        "answer": "Steel",
        "Explanation": "Sound travels fastest in solids (like steel) because their particles are more closely packed, allowing vibrations to transmit more efficiently."
      },
      {
        "question": "What is the phenomenon of light bending as it passes from one medium to another?",
        "options": ["Reflection", "Refraction", "Diffraction", "Dispersion"],
        "answer": "Refraction",
        "Explanation": "Refraction is the bending of light as it passes from one transparent medium into another, caused by a change in speed."
      }
    ],
    "Chemistry": [
      {
        "question": "What is the chemical symbol for water?",
        "options": ["H2O", "CO2", "NaCl", "O2"],
        "answer": "H2O",
        "Explanation": "Water is a chemical compound with the chemical formula H2O, meaning one oxygen atom covalently bonded to two hydrogen atoms."
      },
      {
        "question": "Which element is known as the 'King of Chemicals'?",
        "options": ["Sulfur", "Nitrogen", "Oxygen", "Carbon"],
        "answer": "Sulfur",
        "Explanation": "Sulfuric acid (H2SO4), derived from sulfur, is often called the 'King of Chemicals' due to its widespread industrial use."
      },
      {
        "question": "What is the pH of a neutral solution at 25°C?",
        "options": ["0", "7", "14", "10"],
        "answer": "7",
        "Explanation": "A neutral solution has a pH of 7 at 25°C, indicating an equal concentration of hydrogen and hydroxide ions."
      },
      {
        "question": "Which gas is responsible for the green color in plants?",
        "options": ["Oxygen", "Carbon Dioxide", "Nitrogen", "Chlorophyll"],
        "answer": "Chlorophyll",
        "Explanation": "Chlorophyll is the green pigment found in chloroplasts of plants, essential for photosynthesis."
      },
      {
        "question": "What type of bond is formed when electrons are shared between atoms?",
        "options": ["Ionic bond", "Metallic bond", "Covalent bond", "Hydrogen bond"],
        "answer": "Covalent bond",
        "Explanation": "A covalent bond is a chemical bond that involves the sharing of electron pairs between atoms."
      }
    ]
  }
  }
    """

    
    client = openai.OpenAI(api_key=openai.api_key)

   
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",  
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
    

sample_improvement_json = {
    "Report": "You have  to focus on core concepts in chpetr thsere are you strong pints ....",
    "Subjects": {
        "Physics": [
            "Motion in a Straight Line",
            "Laws of Motion",
            "Work, Energy and Power",
            "Gravitation",
            "Properties of Bulk Matter"
        ],
        "Chemistry": [
            "Matter in Our Surroundings",
            "Is Matter Around Us Pure?",
            "Atoms and Molecules",
            "Structure of the Atom",
            "Chemical Reactions"
        ],
    }
  
}



def improvements_in_subject(detail: dict) -> dict:
    
    prompt = f"""
    Act as a teacher analyzing the performance of a student based on their performance data your tone should be of a teacher.

    You will be given a JSON-like dictionary called student_data: {detail}

    Your task is to:
    - Analyze the student's weak areas in each subject.
    - Suggest 3 to 5 chapters  they should focus on in each subject based on incorrect answers.
    - Provide an overall report as a short paragraph.

    Your response **must** be a valid JSON object in the following format and nothing else:

    {sample_improvement_json}

    Do NOT use single quotes. Only double quotes for JSON keys and string values.
    Do NOT add any explanation, markdown, or text outside the JSON.

    Return only the JSON object.
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
    
   


