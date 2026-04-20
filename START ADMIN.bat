@echo off
title Gulf Studio — Admin CMS
echo.
echo  ===========================================
echo   Gulf Studio FZE LLC — Admin CMS
echo  ===========================================
echo.
echo  Starting server...
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
  echo  ERROR: Node.js is not installed.
  echo  Download it from: https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo  Installing dependencies (first run only)...
  npm install
  echo.
)

echo  Server running at: http://localhost:3000
echo  Admin panel:       http://localhost:3000/admin
echo  Password:          gulfstudio2026
echo.
echo  Press Ctrl+C to stop the server.
echo.

start "" http://localhost:3000/admin
node server.js

pause
