@echo off
echo WMS Setup - Installing dependencies

echo [1/4] Removing old files...
if exist node_modules rmdir /s /q node_modules
if exist client\node_modules rmdir /s /q client\node_modules

echo [2/4] Installing backend...
npm install

echo [3/4] Installing frontend...
cd client
npm install
cd ..

echo [4/4] Building frontend...
cd client
npm run build
cd ..

echo Setup complete! Run RUN.bat to start.
pause