@echo off
REM ========================================
REM Hvar Hub - Development Startup Script
REM ========================================

echo.
echo ========================================
echo   Hvar Hub - Development Environment
echo ========================================
echo.

REM Check if MySQL is running
echo [1/3] Checking MySQL service...
sc query MySQL80 | find "RUNNING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] MySQL is running
) else (
    echo [ERROR] MySQL is NOT running
    echo.
    echo Please start MySQL first:
    echo   1. Press Win+R, type services.msc
    echo   2. Find "MySQL80" and Start it
    echo.
    pause
    exit /b 1
)

REM Test MySQL connection
echo.
echo [2/3] Testing MySQL connection...
mysql -u mcrm_hvar_user -p1618 -e "SELECT 1" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Database connection successful
) else (
    echo [WARNING] Cannot connect to database
    echo [INFO] Run setup_local_db.sql in MySQL Workbench
)

REM Start Flask backend
echo.
echo [3/3] Starting Flask backend...
start "Flask Backend" cmd /k "python run.py"

echo.
echo ========================================
echo Services Started:
echo ========================================
echo.
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5050
echo   Database: mcrm_hvar_hub
echo.
echo Press Ctrl+C to stop the backend when done
echo.
pause
