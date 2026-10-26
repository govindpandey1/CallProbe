import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = BASE_DIR.parent
ENV_FILE = PROJECT_DIR / ".env"

# Load .env manually if present
if ENV_FILE.exists():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip("'\""))

SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "").strip()
DATABASE_URL = os.environ.get("CALLPROBE_DATABASE_URL", f"sqlite:///{BASE_DIR / 'callprobe.db'}")
ENABLE_AUDIO_PREVIEW = os.environ.get("ENABLE_AUDIO_PREVIEW", "true").lower() in ("true", "1", "yes")
DEFAULT_MAX_TURNS = int(os.environ.get("DEFAULT_MAX_TURNS", "8"))
DEFAULT_CONCURRENCY = int(os.environ.get("DEFAULT_CONCURRENCY", "5"))
