from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/pricegenie"
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "PriceGenie"
    VERSION: str = "0.1.0"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Scraping
    BRIGHT_DATA_USERNAME: str = ""
    BRIGHT_DATA_PASSWORD: str = ""
    TWOCAPTCHA_API_KEY: str = ""
    
    # AI
    ANTHROPIC_API_KEY: str = ""
    
    # Affiliates
    AMAZON_AFFILIATE_TAG: str = "pricegenie-21"
    NOON_AFFILIATE_ID: str = "pricegenie_ref"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
