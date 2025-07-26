@echo off
echo WMS Windows Installation Script
echo =================================

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo Download and install Node.js from: https://nodejs.org/
    echo Make sure to restart command prompt after installation
    pause
    exit /b 1
)

echo Node.js found: 
node --version

echo.
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found
    pause
    exit /b 1
)

echo npm found:
npm --version

echo.
echo Cleaning previous installation...
if exist node_modules (
    echo Removing backend node_modules...
    rmdir /s /q node_modules 2>nul
)
if exist client\node_modules (
    echo Removing frontend node_modules...
    rmdir /s /q client\node_modules 2>nul
)

echo.
echo Clearing npm cache...
npm cache clean --force

echo.
echo Installing backend dependencies...
echo This may take a few minutes on Windows...
npm install --build-from-source --verbose
if errorlevel 1 (
    echo.
    echo Backend installation failed. Trying alternative method...
    npm install --build-from-source --force
    if errorlevel 1 (
        echo.
        echo ERROR: Backend installation failed
        echo Please check error messages above
        pause
        exit /b 1
    )
)

echo.
echo Testing better-sqlite3...
node -e "console.log('Testing better-sqlite3...'); require('better-sqlite3'); console.log('SUCCESS: better-sqlite3 working!');" 2>nul
if errorlevel 1 (
    echo.
    echo WARNING: better-sqlite3 test failed, attempting rebuild...
    npm rebuild better-sqlite3 --build-from-source
    node -e "console.log('Retesting better-sqlite3...'); require('better-sqlite3'); console.log('SUCCESS: better-sqlite3 working!');" 2>nul
    if errorlevel 1 (
        echo.
        echo ERROR: better-sqlite3 still not working
        echo Try running as Administrator or check Windows build tools
        pause
        exit /b 1
    )
)

echo.
echo Installing frontend dependencies...
cd client
npm install
if errorlevel 1 (
    echo.
    echo ERROR: Frontend installation failed
    cd ..
    pause
    exit /b 1
)

echo.
echo Building frontend...
npm run build
if errorlevel 1 (
    echo.
    echo ERROR: Frontend build failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo =================================
echo Installation completed successfully!
echo =================================
echo.
echo To start the application:
echo 1. Double-click RUN.bat, or
echo 2. Run: npm start
echo 3. Open: http://localhost:3000
echo.
echo Login credentials:
echo - Boss: boss / 123456aa
echo - Manager: manager / 123456aa
echo.
pause