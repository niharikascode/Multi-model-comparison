from fastapi import FastAPI
from pydantic import BaseModel
import requests
import os
import sqlite3
import json
import re
from datetime import datetime
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── SQLite setup ──────────────────────────────────────────────
DB_PATH = "/tmp/battles.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS battles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            prompt TEXT NOT NULL,
            models TEXT NOT NULL,
            responses TEXT NOT NULL,
            ratings TEXT NOT NULL,
            avg_scores TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

# ── Schemas ───────────────────────────────────────────────────
class PromptRequest(BaseModel):
    prompt: str
    models: list[str]

# ── Helpers ───────────────────────────────────────────────────
def call_groq(model: str, messages: list) -> str:
    data = {"messages": messages, "model": model}
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        r = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers, json=data, timeout=60
        )
        result = r.json()
        # Surface the actual Groq error message instead of hiding it
        if "error" in result:
            error_msg = result["error"].get("message", str(result["error"]))
            return f"[groq error] {error_msg}"
        return result["choices"][0]["message"]["content"]
    except Exception as e:
        return f"[request error] {str(e)}"

def get_model_rating(prompt: str, model: str, response: str) -> str:
    # Skip rating if the response itself was an error
    if response.startswith("[groq error]") or response.startswith("[request error]"):
        return "[rating: 0] Could not rate — model returned an error."
    rating_prompt = (
        f"Please rate the following response on a scale of 1 to 10 based on how well it answers the prompt. "
        f"Your response should be in 50 words. In the end just mention [rating: ] "
        f"for this prompt: '{prompt}'\nResponse: {response}\nRating for this response:"
    )
    return call_groq(model, [{"role": "user", "content": rating_prompt}])

def parse_score(text: str) -> float | None:
    m = re.search(r'\[rating:\s*(\d+(?:\.\d+)?)\]', str(text), re.IGNORECASE)
    if m:
        return float(m.group(1))
    m = re.search(r'\b(10|[1-9])\b', str(text))
    return float(m.group(1)) if m else None

# ── Routes ────────────────────────────────────────────────────
@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "ok", "message": "AI Battle API is running"}


@app.get("/models")
def list_models():
    """Fetch live model list directly from Groq so frontend always has valid models."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    try:
        r = requests.get("https://api.groq.com/openai/v1/models", headers=headers, timeout=10)
        data = r.json()
        models = [
            {"id": m["id"], "owned_by": m.get("owned_by", "")}
            for m in data.get("data", [])
            # Only chat models — exclude whisper/tts/guard/safeguard
            if not any(x in m["id"] for x in ["whisper", "tts", "guard", "safeguard", "distil"])
        ]
        return {"models": sorted(models, key=lambda x: x["id"])}
    except Exception as e:
        return {"models": [], "error": str(e)}


@app.post("/ask")
def call_multiple_models(request: PromptRequest):
    # Step 1: Get responses
    responses = {}
    for model in request.models:
        responses[model] = call_groq(model, [{"role": "user", "content": request.prompt}])

    # Step 2: Peer ratings
    ratings = {model: {} for model in request.models}
    for model in request.models:
        for other_model in request.models:
            ratings[model][other_model] = get_model_rating(
                request.prompt, model, responses[other_model]
            )

    # Step 3: Calculate avg scores
    avg_scores = {}
    for model in request.models:
        scores = [
            parse_score(ratings[rater][model])
            for rater in request.models if rater != model
        ]
        scores = [s for s in scores if s is not None]
        avg_scores[model] = round(sum(scores) / len(scores), 2) if scores else 0.0

    # Step 4: Save to SQLite
    conn = get_db()
    conn.execute(
        "INSERT INTO battles (prompt, models, responses, ratings, avg_scores, created_at) VALUES (?,?,?,?,?,?)",
        (
            request.prompt,
            json.dumps(request.models),
            json.dumps(responses),
            json.dumps(ratings),
            json.dumps(avg_scores),
            datetime.utcnow().isoformat()
        )
    )
    conn.commit()
    conn.close()

    return {
        "prompt": request.prompt,
        "responses": responses,
        "ratings": ratings,
        "avg_scores": avg_scores,
    }


@app.get("/stats")
def get_stats():
    conn = get_db()
    rows = conn.execute("SELECT * FROM battles ORDER BY created_at DESC").fetchall()
    conn.close()

    battles = []
    model_totals = {}

    for row in rows:
        avg_scores = json.loads(row["avg_scores"])
        battles.append({
            "id": row["id"],
            "prompt": row["prompt"],
            "models": json.loads(row["models"]),
            "avg_scores": avg_scores,
            "created_at": row["created_at"],
        })
        for model, score in avg_scores.items():
            model_totals.setdefault(model, []).append(score)

    leaderboard = [
        {"model": model, "avg": round(sum(scores) / len(scores), 2), "battles": len(scores)}
        for model, scores in model_totals.items()
    ]
    leaderboard.sort(key=lambda x: x["avg"], reverse=True)

    return {
        "battles": battles,
        "leaderboard": leaderboard,
        "total_battles": len(battles),
    }


@app.delete("/stats/clear")
def clear_stats():
    conn = get_db()
    conn.execute("DELETE FROM battles")
    conn.commit()
    conn.close()
    return {"message": "All battles cleared"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)