@echo off
echo 正在检查端口3000的使用情况...

netstat -ano | findstr :3000
if errorlevel 1 (
    echo 端口3000未被占用
    pause
    exit
)

echo.
echo 发现端口3000被占用，正在查找进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo 进程ID: %%a
    echo 正在终止进程...
    taskkill /f /pid %%a
)

echo.
echo 端口释放完成！
pause