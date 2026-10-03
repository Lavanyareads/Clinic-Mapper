import os


class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./clinic_mapper.db")
    DEMO_DATA_PATH: str = os.getenv(
        "DEMO_DATA_PATH",
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "demo")
    )
    # Real processed data path (built by data/real/build_real_dataset.py)
    REAL_DATA_PATH: str = os.getenv(
        "REAL_DATA_PATH",
        os.path.join(os.path.dirname(__file__), "..", "..", "data", "real", "processed")
    )
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(__file__), "..", "uploads"))
    REPORTS_DIR: str = os.getenv("REPORTS_DIR", os.path.join(os.path.dirname(__file__), "..", "reports_output"))
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", "10485760"))  # 10MB
    CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "*"]


settings = Settings()
