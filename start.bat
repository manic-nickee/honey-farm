@echo off
setlocal

if not "%~2"=="" (
    echo Usage: start.bat [backend^|api^|frontend^|web^|both] 1>&2
    exit /b 2
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-windows.ps1" -Mode "%~1"
exit /b %ERRORLEVEL%