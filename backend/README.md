# Analyzr Backend (Leela Engine)

The backend is a high-performance FastAPI service responsible for statistical computation, AI narrative orchestration, and report generation.

## 🛠️ Tech Stack
- **Framework**: FastAPI (Python 3.10+)
- **Dependency Management**: [uv](https://github.com/astral-sh/uv)
- **Data processing**: Pandas, NumPy, Scikit-learn
- **Visualization**: Matplotlib, Seaborn (Vibrant modern palette)
- **AI Engine**: Ollama (Mistral 7B)
- **Export**: ReportLab (PDF), Custom HTML templates

## 📂 Architecture
- `/routers`: API endpoints (Analysis, Ingest, Chat, Reports).
- `/services`: Core logic (Analytics layers, AI synthesis, Visualization).
- `/models`: Pydantic schemas for strict data validation.
- `/utils`: Session management and system helpers.

## ⚙️ Configuration
The backend uses a session-based storage approach:
- `uploads/`: Temporary storage for ingested files.
- `sessions/`: Generated visualizations and session-specific metadata.

## 🚀 Running Locally
```bash
uv run uvicorn main:app --reload --port 8000
```
Make sure **Ollama** is running locally with the `mistral` model active.
