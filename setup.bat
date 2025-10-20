@echo off
echo ========================================
echo Smart Network Monitor - Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo X Node.js is not installed. Please install Node.js v16 or higher.
    pause
    exit /b 1
)

echo √ Node.js version:
node --version

REM Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo X npm is not installed.
    pause
    exit /b 1
)

echo √ npm version:
npm --version

REM Check if MongoDB is installed
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo ! MongoDB not found. Please ensure MongoDB is installed and running.
    echo   Visit: https://www.mongodb.com/try/download/community
) else (
    echo √ MongoDB is installed
)

echo.
echo Installing dependencies...
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo X Failed to install backend dependencies
    pause
    exit /b 1
)
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo X Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..

REM Create .env file for backend if it doesn't exist
if not exist backend\.env (
    echo.
    echo Creating backend .env file...
    copy backend\.env.example backend\.env
    echo √ Created backend\.env - Please update it with your configuration
)

REM Create .env file for frontend if it doesn't exist
if not exist frontend\.env (
    echo.
    echo Creating frontend .env file...
    copy frontend\.env.example frontend\.env
    echo √ Created frontend\.env
)

echo.
echo ========================================
echo √ Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure MongoDB is running (net start MongoDB)
echo 2. Update backend\.env with your configuration (optional)
echo 3. Start the backend: cd backend ^&^& npm run dev
echo 4. Start the frontend: cd frontend ^&^& npm run dev
echo.
echo See QUICK_START.md for detailed instructions
echo.
pause
