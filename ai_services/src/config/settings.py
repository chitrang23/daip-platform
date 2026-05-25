import os

class MLSettings:
    """
    Manages platform-wide analysis constants and system inference thresholds.
    """
    API_VERSION: str = "1.0.0"
    ENVIRONMENT: str = os.getenv("ENV", "production")
    COSINE_MATCH_THRESHOLD: float = 0.85

settings = MLSettings()