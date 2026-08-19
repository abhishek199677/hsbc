import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (parent of backend/)
root_env = Path(__file__).parent.parent / ".env"
backend_env = Path(__file__).parent / ".env"

if root_env.exists():
    load_dotenv(root_env)
elif backend_env.exists():
    load_dotenv(backend_env)
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
# Convert postgresql:// to postgresql+asyncpg:// for SQLAlchemy async
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# Strip sslmode parameter (asyncpg handles SSL via connect_args, not URL params)
if "sslmode=" in DATABASE_URL:
    import re
    DATABASE_URL = re.sub(r'[?&]sslmode=[^&]*', '', DATABASE_URL)
    DATABASE_URL = re.sub(r'\?sslmode=[^&]*', '?', DATABASE_URL)
    DATABASE_URL = DATABASE_URL.rstrip('?&')
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
JWT_SECRET = os.getenv("JWT_SECRET", "techcitta-secret-key-change-in-production")

R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID", "")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID", "")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY", "")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "")
R2_ENDPOINT = os.getenv("R2_ENDPOINT", "")

SCREENING_SERVICE_URL = os.getenv("SCREENING_SERVICE_URL", "http://localhost:8001")

SESSION_TTL_HOURS = 12
SESSION_COOKIE = "techcitta_session"
