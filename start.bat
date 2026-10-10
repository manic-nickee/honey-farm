@echo off
setlocal

if not "%~3"=="" (
    echo Usage: start.bat [local^|production] [backend^|api^|frontend^|web^|both] 1>&2
    echo        start.bat [backend^|api^|frontend^|web^|both] [local^|production] 1>&2
    exit /b 2
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-windows.ps1" -FirstArgument "%~1" -SecondArgument "%~2"
exit /b %ERRORLEVEL%