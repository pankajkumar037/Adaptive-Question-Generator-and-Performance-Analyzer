import json
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

app = FastAPI()
from Question_generation.question import generate_Question



class MCQRequest(BaseModel):
    subject: str
    class_level: str
    board: str
    difficulty: int

@app.websocket("/generate_mcq")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            
            data = await websocket.receive_text()
            request_data = json.loads(data)
            
            mcq_response = generate_Question(
                subject=request_data["subject"],
                class_level=request_data["class_level"],
                board=request_data["board"],
                difficulty=request_data["difficulty"]
            )
            
            await websocket.send_json(mcq_response)
    
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
