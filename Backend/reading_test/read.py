

import openai
import os
from dotenv import load_dotenv
import json
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")



def generate_reading_content_using_gpt(detail: dict) -> dict:
    prompt = f"""
    You are an educational passage creator.

    Based on the following details, generate  engaging, and educational professional  reading passage for School:
    - Board: {detail['board']}
    - Class: {detail['class_name']}
    - Language: {detail['subject']}

    The content should:
    -generate craetive and new passage everytime.
    - Be suitable for students of class {detail['class_name']}.
    - Be based on common curriculum topics for the given subject and board.
    - if Language: {detail['subject']} is hindi then If u are using number in passage then use 1..3..etc not hindi numnbers
    - Be no more than 100 words.

    Your output should be only this Passage and Not a single word Extra.
  
    """

    client = openai.OpenAI(api_key=openai.api_key)

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )

    result = response.choices[0].message.content.strip()

    try:
        return result
    except Exception as e:
        return {"error": "Could not parse GPT response", "raw": result}
    



#getting Result for the reading section



from openai import OpenAI

client = OpenAI()

# Transcription with language support
def get_transcribed_text_from_audio(path):
    with open(path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-1",
            response_format="verbose_json",
            timestamp_granularities=["word"]
        )
    return transcription.text, transcription.words, int((transcription.duration) / 60)

# GPT-based output generation based on language
def get_output_from_openai(real_text,language,transcribed_text,words,wpm):
    prompt=f"""
    You are professional Language expert of {language} language.
    following are given
    orinal text:{real_text},
    trancribed_text:{transcribed_text},
    language:{language},
    words_with_timetstamp={words},
    words_per_minute={wpm}

    Now analyse the given things above and you have to give 
        {
            {
            "transcribed_text":"the given transcibed text",
            "wpm":"words per miniute",
            "accuracy": "accuarcy of Transcribed text with respect to original text",
            "fluency": "Fluecy score of Transcription in 1-100 acore",
            "recommendation":"recoemendation for impovement what user can improve in their reading in detail 'this should be in  given language' ",
            }
        }
    
    Your output should be only this Dictionay not a single charcter extra

    """

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]
    )
    result= response.choices[0].message.content.strip()

    try:
        import json
        result = json.loads(result)
        return result
    except Exception as e:
        print("Failed to parse response:", e)
        return {"error": "Could not parse response", "raw": result}

# Words per minute calculation
def get_wpm(words, minutes):
    if minutes == 0:
        return len(words)
    else:
        return round(len(words) / minutes, 2)


# Master pipeline function
def reading_pipeline(input_audio, real_text, language):
    transcribed_text, words, minutes = get_transcribed_text_from_audio(input_audio)
    wpm = get_wpm(words, minutes)
    result=get_output_from_openai(real_text,language,transcribed_text,words,wpm)

    return result





    

