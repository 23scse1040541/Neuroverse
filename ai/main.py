import os
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

EMOTION_MODEL_NAME = os.getenv("MODEL_EMOTION", "joeddav/distilbert-base-uncased-go-emotions-student")
SENTIMENT_MODEL_NAME = os.getenv("MODEL_SENTIMENT", "cardiffnlp/twitter-roberta-base-sentiment")

app = FastAPI(title="Neuroverse AI Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    text: str

# Lazy load models
_emotion = None
_sentiment = None

EMOTION_MAP = {
    # Map GoEmotions labels (subset) to required categories
    "joy": "Happy",
    "sadness": "Sad",
    "anger": "Angry",
    "anxiety": "Anxious",
    "fear": "Anxious",
    "neutral": "Neutral",
}
FALLBACK = "Neutral"

@torch.no_grad()
def load_models():
    global _emotion, _sentiment
    if _emotion is None:
        tok_e = AutoTokenizer.from_pretrained(EMOTION_MODEL_NAME)
        mod_e = AutoModelForSequenceClassification.from_pretrained(EMOTION_MODEL_NAME)
        _emotion = (tok_e, mod_e)
    if _sentiment is None:
        tok_s = AutoTokenizer.from_pretrained(SENTIMENT_MODEL_NAME)
        mod_s = AutoModelForSequenceClassification.from_pretrained(SENTIMENT_MODEL_NAME)
        _sentiment = (tok_s, mod_s)

@torch.no_grad()
@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    text = (req.text or "").strip()
    if not text:
        return {"emotion": FALLBACK, "stress": 50, "scores": {}}

    load_models()
    tok_e, mod_e = _emotion
    tok_s, mod_s = _sentiment

    # Emotion logits
    enc_e = tok_e(text, return_tensors="pt", truncation=True, max_length=256)
    out_e = mod_e(**enc_e)
    probs_e = torch.softmax(out_e.logits, dim=-1)[0]

    # Find model label names if available; otherwise fallback to indices
    labels_e = getattr(mod_e.config, "id2label", None) or {i: str(i) for i in range(probs_e.shape[-1])}

    # Aggregate to target categories
    scores = {"Happy": 0.0, "Sad": 0.0, "Angry": 0.0, "Anxious": 0.0, "Neutral": 0.0}
    for i, p in enumerate(probs_e.tolist()):
        name = labels_e.get(i, str(i)).lower()
        mapped = EMOTION_MAP.get(name)
        if not mapped:
            # heuristics
            if any(k in name for k in ["joy", "love", "amuse", "gratitude", "excit","Glad"]):
                mapped = "Happy"
            elif any(k in name for k in ["sad", "grief", "disappoint"]):
                mapped = "Sad"
            elif any(k in name for k in ["anger", "annoy", "resent"]):
                mapped = "Angry"
            elif any(k in name for k in ["anx", "worr", "fear", "stress", "nervous"]):
                mapped = "Anxious"
            elif "neutral" in name:
                mapped = "Neutral"
            else:
                mapped = None
        if mapped:
            scores[mapped] += float(p)

    # Choose max
    emotion = max(scores.items(), key=lambda x: x[1])[0]

    # Sentiment-based stress inverse of positivity
    enc_s = tok_s(text, return_tensors="pt", truncation=True, max_length=256)
    out_s = mod_s(**enc_s)
    probs_s = torch.softmax(out_s.logits, dim=-1)[0].tolist()
    # Assume 0=negative,1=neutral,2=positive for cardiffnlp twitter-roberta-base-sentiment
    neg, neu, pos = probs_s[0], probs_s[1], probs_s[2]
    stress = int(round(min(100, max(0, 70*neg + 40*neu + 10*(1-pos)))))

    return {"emotion": emotion, "stress": stress, "scores": scores}

@app.get("/health")
async def health():
    return {"ok": True}
