@echo off
echo Fixing Database for Windows...

echo Step 1: Remove node_modules
if exist node_modules rmdir /s /q node_modules
if exist client\node_modules rmdir /s /q client\node_modules

echo Step 2: Clear npm cache
npm cache clean --force

echo Step 3: Fresh install
npm install

echo Step 4: Test sql.js
node -e "console.log('Testing sql.js...'); require('sql.js'); console.log('Database library OK!');"

echo Step 5: Setup frontend
cd client
npm install
npm run build
cd ..

echo Fix completed! Run start.bat now.
pause