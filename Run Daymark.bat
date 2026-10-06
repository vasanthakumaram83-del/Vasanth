@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run Daymark.ps1"
if errorlevel 1 pause
