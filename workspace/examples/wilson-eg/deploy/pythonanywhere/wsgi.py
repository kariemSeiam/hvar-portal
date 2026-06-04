# WSGI entry point for PythonAnywhere (and other WSGI servers).
# On PythonAnywhere: Web tab points to this file (or paste this into the WSGI file PA created).

import sys
import os

# Project root on PythonAnywhere
path = '/home/wilsoneg/wilson-eg/deploy/pythonanywhere'
if path not in sys.path:
    sys.path.insert(0, path)
os.chdir(path)

from app import app as application

# Optional: run once to create DB and admin user (or run from Bash console):
# workon wilson-venv && cd ~/wilson-eg/deploy/pythonanywhere && python -c "from app import init_db; init_db()"
