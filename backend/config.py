"""
Configuration and database connection for LocaTrack API
"""
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from fastapi.security import HTTPBearer
from pathlib import Path
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory for file storage
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)
(UPLOADS_DIR / 'licenses').mkdir(exist_ok=True)

# GPS API Configuration
GPS_API_URL = os.environ.get('GPS_API_URL', 'https://tracking.gps-14.net/api/api.php')
GPS_API_KEY = os.environ.get('GPS_API_KEY', '')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()
