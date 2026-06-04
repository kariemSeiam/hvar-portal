# app/config.py
"""Flask configuration variables."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root (parent of app directory)
project_root = Path(__file__).parent.parent
env_path = project_root / '.env'
load_dotenv(dotenv_path=env_path, override=True)


def _required(key: str) -> str:
    """Raise on missing required env var."""
    val = os.environ.get(key)
    if not val:
        raise ValueError(
            f"Missing required env var: {key}\n"
            f"Copy .env.example → .env and fill values."
        )
    return val


class Config:
    """Base configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-change-in-production'
    STATIC_FOLDER = 'static'
    TEMPLATES_FOLDER = 'templates'

    # JWT authentication
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_EXPIRY_HOURS = int(os.environ.get('JWT_EXPIRY_HOURS', '24'))

    # Database — required, no hardcoded fallbacks
    DATABASE_HOST = _required('DATABASE_HOST')
    DATABASE_PORT = int(os.environ.get('DATABASE_PORT', '3306'))
    DATABASE_USER = _required('DATABASE_USER')
    DATABASE_PASSWORD = _required('DATABASE_PASSWORD')
    DATABASE_NAME = _required('DATABASE_NAME')

    # Bosta API
    BOSTA_API_KEY = os.environ.get('BOSTA_API_KEY')
    BOSTA_TOKEN = os.environ.get('BOSTA_TOKEN')
    BOSTA_BASE_URL = os.environ.get('BOSTA_BASE_URL', 'https://app.bosta.co/api/v2')


class DevelopmentConfig(Config):
    """Development configuration."""
    FLASK_ENV = 'development'
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """Testing configuration."""
    FLASK_ENV = 'testing'
    DEBUG = True
    TESTING = True
    DATABASE_NAME = os.environ.get('TEST_DATABASE_NAME', 'mcrm_hvar_hub_test')

class ProductionConfig(Config):
    """Production configuration."""
    FLASK_ENV = 'production'
    DEBUG = False
    TESTING = False

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}
