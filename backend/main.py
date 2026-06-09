import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.routers import upload, analysis, chat, report, visualizations, playground

load_dotenv()

app = FastAPI(
    title="Analyzr API",
    description="Enterprise-Grade Autonomous AI Data Analyst",
    version="0.1.0",
)

# CORS – allow React dev server and production frontend
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://analyzr-qcgtixqcn-uday-20102005s-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated chart images statically
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(UPLOAD_DIR)), name="static")

# Routers
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analysis.router, prefix="/api", tags=["Analysis"])
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(report.router, prefix="/api", tags=["Report"])
app.include_router(visualizations.router, prefix="/api", tags=["Visualizations"])
app.include_router(playground.router, prefix="/api", tags=["Playground"])


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "message": "Analyzr API is running"}


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy"}
