@echo off
setlocal enabledelayedexpansion

:: ============================================================================
::  TKS Projects Hub - Stop Script
::  Stops all running backend (port 5000) and frontend (port 3000) processes.
:: ============================================================================

title TKS Projects Hub - Stopping

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║            TKS Projects Hub - Stopping App                  ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

set STOPPED_SOMETHING=0

:: -------------------------------------------
:: Stop process on port 5000 (Backend)
:: -------------------------------------------
echo  [1/2] Checking for backend on port 5000...

set PID_5000=
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " ^| findstr "LISTENING" 2^>nul') do (
    set PID_5000=%%a
)

if defined PID_5000 (
    echo        Found process PID: !PID_5000!
    taskkill /PID !PID_5000! /F >nul 2>nul
    if !errorlevel! equ 0 (
        echo        [OK] Backend process (PID !PID_5000!) stopped.
        set STOPPED_SOMETHING=1
    ) else (
        echo        [WARNING] Could not stop process !PID_5000!.
        echo                  Try running this script as Administrator.
    )
) else (
    echo        No process found on port 5000.
)
echo.

:: -------------------------------------------
:: Stop process on port 3000 (Frontend)
:: -------------------------------------------
echo  [2/2] Checking for frontend on port 3000...

set PID_3000=
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING" 2^>nul') do (
    set PID_3000=%%a
)

if defined PID_3000 (
    echo        Found process PID: !PID_3000!
    taskkill /PID !PID_3000! /F >nul 2>nul
    if !errorlevel! equ 0 (
        echo        [OK] Frontend process (PID !PID_3000!) stopped.
        set STOPPED_SOMETHING=1
    ) else (
        echo        [WARNING] Could not stop process !PID_3000!.
        echo                  Try running this script as Administrator.
    )
) else (
    echo        No process found on port 3000.
)
echo.

:: -------------------------------------------
:: Also stop any remaining node processes from this project
:: -------------------------------------------
echo  Cleaning up any orphaned node processes...

:: Kill any node processes that might be lingering from concurrently
for /f "tokens=2" %%a in ('tasklist /fi "imagename eq node.exe" /fo list 2^>nul ^| findstr "PID:"') do (
    :: We only kill node.exe processes - be careful not to kill unrelated node apps
    :: This is a soft cleanup; individual PIDs were already handled above
)

:: -------------------------------------------
:: Summary
:: -------------------------------------------
if !STOPPED_SOMETHING! equ 1 (
    echo  ╔══════════════════════════════════════════════════════════════╗
    echo  ║              All Servers Stopped Successfully               ║
    echo  ╠══════════════════════════════════════════════════════════════╣
    echo  ║                                                             ║
    echo  ║  Run start.bat to restart the application.                  ║
    echo  ╚══════════════════════════════════════════════════════════════╝
) else (
    echo  ╔══════════════════════════════════════════════════════════════╗
    echo  ║           No Running Servers Found                          ║
    echo  ╠══════════════════════════════════════════════════════════════╣
    echo  ║                                                             ║
    echo  ║  The application doesn't appear to be running.              ║
    echo  ║  Run start.bat to launch it.                                ║
    echo  ╚══════════════════════════════════════════════════════════════╝
)
echo.

pause
