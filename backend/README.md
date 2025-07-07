# Backend API - SAT Question & Answer Explanation

This backend provides a FastAPI server with an endpoint for SAT question and answer explanations using OpenAI's API.

## Prerequisites
- Python 3.8+
- A virtual environment (recommended: `venv` in the `backend` folder)
- An OpenAI API key (add to `.env` as `OPENAI_API_KEY`)

## Setup

1. **Create and activate your virtual environment:**
   ```bash
   cd backend
   python3 -m venv venv
   source .venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure your OpenAI API key:**
   - Create a `.env` file in the `backend` folder with this content:
     ```
     OPENAI_API_KEY="your_openai_api_key_here"
     ```

## Running the Server


Start the FastAPI server with Uvicorn on port 8079:

```bash
./venv/bin/uvicorn main:app --reload --port 8079
```

- The API will be available at: http://127.0.0.1:8079
- The `/dialog` endpoint accepts POST requests with a JSON body:
  ```json
  { "question": "Your SAT question here" }
  ```

## Example Request

```bash
curl -X POST http://127.0.0.1:8079/dialog \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the value of x if 2x + 3 = 7?"}'
```

## Notes
- The model is instructed to answer only SAT questions, with the simplest, most direct answer and no extra reasoning or emotion.
