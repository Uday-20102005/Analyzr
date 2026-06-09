from __future__ import annotations

import os
import shutil
import uuid
from pathlib import Path

import aiofiles
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.models.schemas import UploadResponse
from app.services.ingest import ingest_files
from app.utils.session_store import create_session

router = APIRouter()

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./uploads"))
MAX_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "100"))


@router.post("/upload", response_model=UploadResponse)
async def upload_files(files: list[UploadFile] = File(...)):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    session_id = uuid.uuid4().hex
    session_dir = UPLOAD_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    saved_paths: list[tuple[str, Path]] = []
    for upload in files:
        if not upload.filename or not upload.filename.endswith(".csv"):
            raise HTTPException(status_code=400, detail=f"Only CSV files are accepted. Got: {upload.filename}")

        dest = session_dir / upload.filename
        async with aiofiles.open(dest, "wb") as f:
            content = await upload.read()
            if len(content) > MAX_SIZE_MB * 1024 * 1024:
                shutil.rmtree(session_dir, ignore_errors=True)
                raise HTTPException(status_code=413, detail=f"{upload.filename} exceeds {MAX_SIZE_MB}MB limit")
            await f.write(content)
        saved_paths.append((upload.filename, dest))

    try:
        dataframes, profiles = await ingest_files(saved_paths)
    except Exception as e:
        shutil.rmtree(session_dir, ignore_errors=True)
        raise HTTPException(status_code=422, detail=f"Failed to parse CSV(s): {str(e)}")

    create_session(session_id, {
        "dataframes": dataframes,
        "profiles": profiles,
        "analysis": None,
        "charts": [],
        "chat_history": [],
        "upload_dir": session_dir,
    })

    return UploadResponse(session_id=session_id, datasets=profiles)
