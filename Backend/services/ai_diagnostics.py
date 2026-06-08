"""Simple AI response diagnostics logger.
Writes JSON lines to Backend/logs/ai_responses.log with metadata for monitoring.
"""
import json
import os
from datetime import datetime
from typing import Optional, Dict, Any

LOG_DIR = os.path.join(os.path.dirname(__file__), '..', 'logs')
LOG_PATH = os.path.join(LOG_DIR, 'ai_responses.log')

os.makedirs(LOG_DIR, exist_ok=True)


def _write_line(obj: Dict[str, Any]):
    try:
        with open(LOG_PATH, 'a', encoding='utf-8') as f:
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")
    except Exception:
        # Best-effort logging; don't raise
        pass


def log_ai_response(service: Optional[str] = None,
                    model: Optional[str] = None,
                    parse_attempt: Optional[int] = None,
                    parse_success: bool = False,
                    response_length: Optional[int] = None,
                    preview: Optional[str] = None,
                    extra: Optional[Dict[str, Any]] = None):
    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "service": service,
        "model": model,
        "parse_attempt": parse_attempt,
        "parse_success": parse_success,
        "response_length": response_length,
        "preview": preview[:1000] if preview else None,
        "extra": extra or {}
    }
    _write_line(entry)
