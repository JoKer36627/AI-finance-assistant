# Entry point for uvicorn - imports the FastAPI app from app.main
from app.main import app

# Re-export for uvicorn
__all__ = ['app']
