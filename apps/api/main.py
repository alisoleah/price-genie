from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="PriceGenie API",
    description="AI-powered shopping aggregator for GCC market",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware(
        allow_origins=["http://localhost:3000", "http://localhost:3001"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
)

@app.get("/")
async def root():
    return {
        "message": "PriceGenie API",
        "version": "0.1.0",
        "docs": "/docs",
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": os.getenv("DATABASE_URL", "not configured"),
    }

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
