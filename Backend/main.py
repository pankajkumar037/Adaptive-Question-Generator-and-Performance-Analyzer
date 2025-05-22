import json
import uvicorn
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from Question_generation.question_gemini import generate_Question


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MCQRequest(BaseModel):
    subject: str
    class_level: str
    board: str
    difficulty: int

@app.websocket("/generate_mcq")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted.")

    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received data: {data}")

            try:
                request_data = json.loads(data)
                subject = request_data.get("subject")
                class_level = request_data.get("class_level")
                board = request_data.get("board")
                difficulty = request_data.get("difficulty")

                if not all([subject, class_level, board, difficulty is not None]):
                     logger.warning("Missing required fields in request data.")
                     await websocket.send_json({"error": "Missing required fields (subject, class_level, board, difficulty)."})
                     continue

            except json.JSONDecodeError:
                logger.error("Failed to decode JSON from received data.")
                await websocket.send_json({"error": "Invalid JSON format."})
                continue
            except Exception as e:
                 logger.error(f"Error processing received data: {e}")
                 await websocket.send_json({"error": f"Error processing request: {e}"})
                 continue


            try:
                mcq_response = generate_Question(
                    subject=subject,
                    class_level=class_level,
                    board=board,
                    difficulty=difficulty
                )
                logger.info("Question generated successfully.")

                await websocket.send_json(mcq_response)

            except NotImplementedError:
                 logger.error("Question generation function is not implemented or available.")
                 await websocket.send_json({"error": "Question generation service is not available."})
            except Exception as e:
                logger.error(f"Error during question generation: {e}")
                await websocket.send_json({"error": "An error occurred during question generation."})

    except WebSocketDisconnect as e:
        logger.info(f"WebSocket client disconnected: {e.code} - {e.reason}")
    except Exception as e:
        logger.error(f"An unexpected error occurred in the websocket connection: {e}")
    finally:
        pass

if __name__ == "__main__":
    logger.info("Running Uvicorn in development mode.")
    uvicorn.run(app, host="0.0.0.0", port=8000)

