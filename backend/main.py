

from fastapi import FastAPI, Request
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow CORS for local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class DialogRequest(BaseModel):
    passage: str
    question: str
    answer_explanation: str
    user_message: str


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/dialog")
async def dialog(req: DialogRequest):
    prompt = (
        "You are an expert SAT tutor. Use the reading passage, the question, and the official answer explanation to answer the user's follow-up question. "
        "Be concise, factual, and only answer within the context of the SAT material provided. If the user asks something off-topic, irrelevant, or not related to SAT, respond with: 'Focus on the task, stop crying.' Do not provide generic, evasive, or off-topic responses.\n"
        f"Reading Passage: {req.passage}\n"
        f"Question: {req.question}\n"
        f"Official Answer Explanation: {req.answer_explanation}\n"
        f"User: {req.user_message}\nAnswer:"
    )
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    response = model.generate_content(prompt, generation_config={"temperature": 1.0})
    answer = response.text.strip()
    return {"answer": answer}
