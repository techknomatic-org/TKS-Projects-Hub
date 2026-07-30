@echo off
setlocal enabledelayedexpansion

:: ============================================================================
::  TKS Projects Hub - Start Script
::  Launches the backend (port 5000) and frontend (port 3000) dev servers.
:: ============================================================================

title TKS Projects Hub - Running

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║            TKS Projects Hub - Starting App                  ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: -------------------------------------------
:: Pre-flight checks
:: -------------------------------------------

:: Check if node_modules exist
if not exist "node_modules" (
    echo  [ERROR] Dependencies not installed.
    echo          Run setup.bat first before starting the app.
    echo.
    pause
    exit /b 1
)
if not exist "backend\node_modules" (
    echo  [ERROR] Backend dependencies not installed.
    echo          Run setup.bat first before starting the app.
    echo.
    pause
    exit /b 1
)
if not exist "frontend\node_modules" (
    echo  [ERROR] Frontend dependencies not installed.
    echo          Run setup.bat first before starting the app.
    echo.
    pause
    exit /b 1
)

:: Check for .env files
if not exist "backend\.env" (
    echo  [ERROR] backend\.env not found.
    echo          Run setup.bat first to generate environment files.
    echo.
    pause
    exit /b 1
)

:: Check port availability
echo  Checking port availability...
echo.

set PORT_5000_BUSY=0
set PORT_3000_BUSY=0

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " ^| findstr "LISTENING" 2^>nul') do (
    set PORT_5000_BUSY=1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING" 2^>nul') do (
    set PORT_3000_BUSY=1
)

if !PORT_5000_BUSY! equ 1 (
    echo  [WARNING] Port 5000 is already in use!
    echo           The backend may fail to start.
    echo           Use stop.bat to free the ports, or manually close the process.
    echo.
)
if !PORT_3000_BUSY! equ 1 (
    echo  [WARNING] Port 3000 is already in use!
    echo           The frontend may fail to start.
    echo           Use stop.bat to free the ports, or manually close the process.
    echo.
)

:: -------------------------------------------
:: Start the application
:: -------------------------------------------
echo  Starting Backend (Express + Prisma) on port 5000...
echo  Starting Frontend (React + Vite) on port 3000...
echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║  App is starting up! Wait a few seconds, then open:        ║
echo  ║                                                             ║
echo  ║    Frontend:  http://localhost:3000                         ║
echo  ║    Backend:   http://localhost:5000                         ║
echo  ║                                                             ║
echo  ║  Press Ctrl+C in this window to stop both servers.          ║
echo  ║  Or run stop.bat from another terminal.                     ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: Use concurrently (installed as root devDependency) to run both servers
call npm run dev

:: If we get here, servers were stopped
echo.
echo  Servers stopped.
echo.
pause
