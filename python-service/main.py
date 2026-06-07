from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from textblob import TextBlob
import re

app = FastAPI(title="PixelPost AI Optimization API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str

class AnalysisResult(BaseModel):
    sentiment_polarity: float
    subjectivity: float
    virality_score: int

def calculate_virality(text: str, polarity: float, subjectivity: float) -> int:
    """
    Heuristic algorithm to estimate a virality score from 0-100.
    Considers length, sentiment strength, subjectivity, and hashtag count.
    """
    score = 50 # Base score

    # Length optimization (sweet spot between 100 and 400 chars)
    length = len(text)
    if 100 <= length <= 400:
        score += 15
    elif length > 400:
        score += 5
    else:
        score -= 5

    # Sentiment strength (highly positive or highly negative tends to get more engagement)
    if abs(polarity) > 0.5:
        score += 15
    elif abs(polarity) > 0.2:
        score += 5

    # Subjectivity (opinions drive more engagement than plain facts)
    if subjectivity > 0.6:
        score += 10
    
    # Hashtags bonus (up to a limit)
    hashtags = len(re.findall(r'#\w+', text))
    if 1 <= hashtags <= 5:
        score += 10
    elif hashtags > 5:
        score += 5 # Diminishing returns

    return min(max(score, 0), 100) # Clamp between 0-100

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/analyze", response_model=AnalysisResult)
def analyze_text(payload: TextPayload):
    if not payload.text:
        raise HTTPException(status_code=400, detail="Text is required")
        
    blob = TextBlob(payload.text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    virality = calculate_virality(payload.text, polarity, subjectivity)
    
    return AnalysisResult(
        sentiment_polarity=round(polarity, 2),
        subjectivity=round(subjectivity, 2),
        virality_score=virality
    )
