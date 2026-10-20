@echo off
setlocal
echo ====================================================
echo Starting PawBrief Final Prototype...
echo ====================================================

:: Check and install root dependencies if missing
if not exist "%~dp0node_modules" (
    echo [PawBrief] First-time run detected. Installing dependencies...
    cd /d "%~dp0"
    call npm install
)

:: Check and install backend dependencies if missing
if not exist "%~dp0backend\node_modules" (
    echo [PawBrief] Installing backend dependencies...
    cd /d "%~dp0backend"
    call npm install
)

cd /d "%~dp0"
echo [PawBrief] Launching API Server on http://localhost:8085...
start "PawBrief API Server" node server.js
timeout /t 3 /nobreak >nul
start http://localhost:8085
echo.
echo ====================================================
echo 🐾 PawBrief is now running at: http://localhost:8085
echo (Keep this terminal open while using PawBrief)
echo ====================================================
echo.
pause
