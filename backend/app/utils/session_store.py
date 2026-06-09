from __future__ import annotations

import os
import json
import pickle
import threading
import tempfile
from pathlib import Path
from typing import Any

_LOCK = threading.Lock()
_sessions: dict[str, dict[str, Any]] = {}

SESSION_DIR = Path(os.getenv("SESSION_DIR", "./sessions"))
SESSION_DIR.mkdir(parents=True, exist_ok=True)


def _session_path(session_id: str) -> Path:
    return SESSION_DIR / f"{session_id}.pkl"


def _save_to_disk(session_id: str) -> None:
    if session_id not in _sessions:
        return
    data = _sessions[session_id]
    df_dict = data.get("dataframes", {})
    store = {k: v for k, v in data.items() if k != "dataframes"}
    store["_has_dataframes"] = list(df_dict.keys())
    p = _session_path(session_id)
    with tempfile.NamedTemporaryFile(dir=str(SESSION_DIR), delete=False, suffix=".pkl") as tmp:
        tmppath = tmp.name
        pickle.dump(store, tmp)
    os.replace(tmppath, p)
    for filename, df in df_dict.items():
        df_dir = SESSION_DIR / session_id / "dataframes"
        df_dir.mkdir(parents=True, exist_ok=True)
        df_path = df_dir / f"{filename}.pkl"
        with tempfile.NamedTemporaryFile(dir=str(df_dir), delete=False, suffix=".pkl") as tmp:
            tmppath = tmp.name
            pickle.dump(df, tmp)
        os.replace(tmppath, df_path)


def _load_from_disk(session_id: str) -> dict[str, Any] | None:
    p = _session_path(session_id)
    if not p.exists():
        return None
    with open(p, "rb") as f:
        store = pickle.load(f)
    df_names = store.pop("_has_dataframes", [])
    df_dict = {}
    for name in df_names:
        df_path = SESSION_DIR / session_id / "dataframes" / f"{name}.pkl"
        if df_path.exists():
            with open(df_path, "rb") as f:
                df_dict[name] = pickle.load(f)
    store["dataframes"] = df_dict
    return store


def _load_all_from_disk() -> None:
    for p in SESSION_DIR.glob("*.pkl"):
        sid = p.stem
        data = _load_from_disk(sid)
        if data is not None:
            _sessions[sid] = data


def create_session(session_id: str, data: dict[str, Any]) -> None:
    with _LOCK:
        _sessions[session_id] = data
    _save_to_disk(session_id)


def get_session(session_id: str) -> dict[str, Any] | None:
    with _LOCK:
        if session_id not in _sessions:
            data = _load_from_disk(session_id)
            if data is not None:
                _sessions[session_id] = data
        return _sessions.get(session_id)


def update_session(session_id: str, updates: dict[str, Any]) -> None:
    with _LOCK:
        if session_id in _sessions:
            _sessions[session_id].update(updates)
        else:
            data = _load_from_disk(session_id)
            if data is not None:
                data.update(updates)
                _sessions[session_id] = data
    _save_to_disk(session_id)


def delete_session(session_id: str) -> None:
    with _LOCK:
        _sessions.pop(session_id, None)
    p = _session_path(session_id)
    if p.exists():
        p.unlink()
    df_dir = SESSION_DIR / session_id / "dataframes"
    if df_dir.exists():
        import shutil
        shutil.rmtree(str(df_dir.parent), ignore_errors=True)


def list_sessions() -> list[str]:
    with _LOCK:
        return list(_sessions.keys())


_load_all_from_disk()
