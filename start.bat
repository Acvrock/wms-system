@echo off
echo WMS System Starting...

node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo Download from: https://nodejs.org/
    pause
    exit
)

echo Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo Testing sql.js...
node -e "require('sql.js')" >nul 2>&1
if errorlevel 1 (
    echo Database library error detected. Please run: npm install
    pause
    exit
)

echo Checking frontend build...
if not exist server\public\index.html (
    echo Building frontend...
    cd client
    if not exist node_modules npm install
    npm run build
    cd ..
)

echo Starting server...
echo Access: http://localhost:3000
echo Login: boss/123456aa or manager/123456aa
echo.

npm start