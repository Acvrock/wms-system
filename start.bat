@echo off
chcp 65001 >nul
title WMS Warehouse Management System

cls
echo.
echo ==========================================
echo    WMS Warehouse Management System
echo ==========================================
echo.

echo [1/4] Checking Node.js environment...
node --version
if %errorlevel% neq 0 (
    echo Error: Node.js not installed, please install from https://nodejs.org/
    pause
    exit
)

echo [2/4] Checking project dependencies...
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo [3/4] Creating necessary directories...
if not exist data mkdir data
if not exist uploads mkdir uploads

echo [4/4] Starting WMS system...
echo.
echo ==========================================
echo  WMS System Started Successfully
echo  Access URL: http://localhost:3000
echo  BOSS Account: boss /    
echo  Admin Account: admin /  
echo ==========================================
echo.
echo Press Ctrl+C to stop server
echo.

node server.js

echo.
echo Server stopped
pause