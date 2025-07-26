@echo off
echo WMS Windows Environment Check
echo ==============================

echo.
echo [1] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js NOT found
    echo Please install Node.js from: https://nodejs.org/
    set MISSING_TOOLS=1
) else (
    echo ✅ Node.js found:
    node --version
)

echo.
echo [2] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm NOT found
    set MISSING_TOOLS=1
) else (
    echo ✅ npm found:
    npm --version
)

echo.
echo [3] Checking Python (needed for native modules)...
python --version >nul 2>&1
if errorlevel 1 (
    python3 --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python NOT found
        echo Install Python from: https://www.python.org/downloads/
        echo Or run: npm install -g windows-build-tools (as Administrator)
        set MISSING_TOOLS=1
    ) else (
        echo ✅ Python3 found:
        python3 --version
    )
) else (
    echo ✅ Python found:
    python --version
)

echo.
echo [4] Checking Visual Studio Build Tools...
where cl.exe >nul 2>&1
if errorlevel 1 (
    echo ❌ Visual Studio Build Tools NOT found
    echo Install one of:
    echo - Visual Studio 2019/2022 with C++ workload
    echo - Visual Studio Build Tools
    echo - Or run: npm install -g windows-build-tools (as Administrator)
    set MISSING_TOOLS=1
) else (
    echo ✅ Visual Studio Build Tools found
    cl.exe 2>&1 | findstr /C:"Microsoft (R) C/C++" | head -1
)

echo.
echo [5] Testing npm compilation capability...
echo Testing with a simple native module...
cd %TEMP%
mkdir npm-test 2>nul
cd npm-test
echo {"name": "test", "version": "1.0.0"} > package.json
npm install node-gyp >nul 2>&1
if errorlevel 1 (
    echo ❌ npm native compilation test FAILED
    echo Missing build tools or configuration issue
    set MISSING_TOOLS=1
) else (
    echo ✅ npm native compilation test PASSED
)
cd /d "%~dp0"
rmdir /s /q %TEMP%\npm-test 2>nul

echo.
echo ==============================
if defined MISSING_TOOLS (
    echo ❌ ENVIRONMENT CHECK FAILED
    echo.
    echo Missing tools detected. Please install missing components first.
    echo.
    echo Quick fix for Windows:
    echo 1. Install Node.js from https://nodejs.org/
    echo 2. Install Python from https://www.python.org/downloads/
    echo 3. Run as Administrator: npm install -g windows-build-tools
    echo.
    echo Then run install-windows.bat
) else (
    echo ✅ ENVIRONMENT CHECK PASSED
    echo.
    echo Your system is ready for WMS installation!
    echo Run install-windows.bat to proceed.
)

echo.
pause