@echo off
REM ========================================
REM Hvar Hub - Local MySQL Database Setup
REM ========================================

echo [1/4] Checking MySQL Service status...
sc query MySQL80 | find "RUNNING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] MySQL80 service is already running
) else (
    echo [INFO] MySQL80 service is not running
    echo [ACTION] Please run this script as Administrator to start MySQL
    echo [INFO] Or manually start MySQL from services.msc
    pause
    exit /b 1
)

echo.
echo [2/4] Creating database and user...
mysql -u root -p << EOF
-- Create database if not exists
CREATE DATABASE IF NOT EXISTS mcrm_hvar_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'mcrm_hvar_user'@'localhost' IDENTIFIED BY '1618';

-- Grant all privileges
GRANT ALL PRIVILEGES ON mcrm_hvar_hub.* TO 'mcrm_hvar_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'mcrm_hvar_user';
EOF

if %ERRORLEVEL% EQU 0 (
    echo [OK] Database and user created successfully
) else (
    echo [ERROR] Failed to create database. Please check your MySQL root password.
    pause
    exit /b 1
)

echo.
echo [3/4] Testing connection with app credentials...
mysql -u mcrm_hvar_user -p1618 -e "USE mcrm_hvar_hub; SELECT 'Connection successful!' AS Status;"

if %ERRORLEVEL% EQU 0 (
    echo [OK] Database connection test passed
) else (
    echo [ERROR] Connection test failed
    pause
    exit /b 1
)

echo.
echo [4/4] Setting up development environment...
echo [INFO] Starting Flask backend on port 5050...

REM Set development environment
set FLASK_ENV=development

REM Start Flask backend
start cmd /k "python run.py"

echo.
echo ========================================
echo [SUCCESS] Local development setup complete!
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5050
echo.
echo Database: mcrm_hvar_hub
echo User: mcrm_hvar_user
echo Password: 1618
echo.
echo Press any key to exit...
pause >nul
