# wsgi.py
# WSGI entry point for LiteSpeed Web Server / CyberPanel
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root (where wsgi.py is located)
project_root = Path(__file__).parent
env_path = project_root / '.env'

# Debug: Print .env location
print(f"[WSGI] Loading .env from: {env_path.absolute()}")
print(f"[WSGI] .env exists: {env_path.exists()}")

# Load with override to ensure our values are used
load_dotenv(dotenv_path=env_path, override=True)

# Debug: Print loaded values (don't print password)
print(f"[WSGI] DATABASE_USER: {os.getenv('DATABASE_USER', 'NOT SET')}")
print(f"[WSGI] DATABASE_NAME: {os.getenv('DATABASE_NAME', 'NOT SET')}")

from app import create_app

# Create Flask application instance
app = create_app(os.getenv('FLASK_ENV', 'production'))

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5050)))

