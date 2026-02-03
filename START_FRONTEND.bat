@echo off
echo ========================================
echo   CABLE BILL MANAGER - FRONTEND STARTUP
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo     Node.js: OK

echo.
echo [2/3] Checking dependencies...
if not exist "node_modules\" (
    echo     Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)
echo     Dependencies: OK

echo.
echo [3/3] Starting frontend dev server...
echo.
echo ========================================
echo   Frontend will start on port 8080
echo   Open http://localhost:8080 in browser
echo ========================================
echo.

npm run dev
