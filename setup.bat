@echo off
setlocal enabledelayedexpansion

:: ============================================================================
::  TKS Projects Hub - First-Time Setup Script
::  Run this ONCE when you clone the project for the first time.
:: ============================================================================

title TKS Projects Hub - Setup

echo.
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║          TKS Projects Hub - First-Time Setup                ║
echo  ║                                                             ║
echo  ║  This script will:                                          ║
echo  ║   1. Check prerequisites (Node.js, npm, MySQL)              ║
echo  ║   2. Install all dependencies                               ║
echo  ║   3. Create .env files (if missing)                         ║
echo  ║   4. Generate Prisma client                                 ║
echo  ║   5. Run database migrations                                ║
echo  ║   6. Seed the database with default data                    ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

:: -------------------------------------------
:: Step 1: Check Prerequisites
:: -------------------------------------------
echo [1/6] Checking prerequisites...
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js is NOT installed.
    echo          Download it from: https://nodejs.org/
    echo          Recommended version: v18 or v20
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo  [OK] Node.js found: %NODE_VERSION%

:: Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] npm is NOT installed.
    echo          It should come bundled with Node.js.
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('npm -v') do set NPM_VERSION=%%v
echo  [OK] npm found: v%NPM_VERSION%

:: Check MySQL
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo  [WARNING] MySQL client not found in PATH.
    echo           Make sure MySQL Server 8.0 is installed and running.
    echo           The setup will continue, but migrations may fail
    echo           if the database is not accessible.
    echo.
) else (
    for /f "tokens=*" %%v in ('mysql --version 2^>nul') do set MYSQL_VERSION=%%v
    echo  [OK] MySQL found: !MYSQL_VERSION!
)

echo.
echo  All core prerequisites checked.
echo.

:: -------------------------------------------
:: Step 2: Install Dependencies
:: -------------------------------------------
echo [2/6] Installing dependencies...
echo.

echo  Installing root dependencies...
call npm install
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to install root dependencies.
    pause
    exit /b 1
)
echo  [OK] Root dependencies installed.
echo.

echo  Installing backend dependencies...
call npm install --prefix backend
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
echo  [OK] Backend dependencies installed.
echo.

echo  Installing frontend dependencies...
call npm install --prefix frontend
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to install frontend dependencies.
    pause
    exit /b 1
)
echo  [OK] Frontend dependencies installed.
echo.

:: -------------------------------------------
:: Step 3: Create .env files (if missing)
:: -------------------------------------------
echo [3/6] Setting up environment files...
echo.

if not exist "backend\.env" (
    echo  Creating backend\.env with default values...
    (
        echo PORT=5000
        echo DATABASE_URL="mysql://root:Sai@1234@localhost:3306/tks_tracking"
        echo JWT_SECRET="tks_jwt_secret_key_change_me_in_prod"
        echo AZURE_CLIENT_ID="a667ed28-9786-4ada-964e-604da9fdcccd"
        echo AZURE_TENANT_ID="e27ea0e3-d544-492a-bdfc-778865bdeeae"
        echo BYPASS_MICROSOFT_AUTH="false"
    ) > "backend\.env"
    echo  [OK] backend\.env created.
    echo  [NOTE] Update DATABASE_URL if your MySQL credentials differ.
) else (
    echo  [SKIP] backend\.env already exists.
)
echo.

if not exist "frontend\.env" (
    echo  Creating frontend\.env with default values...
    (
        echo VITE_API_URL="http://localhost:5000/api"
        echo VITE_AZURE_CLIENT_ID="a667ed28-9786-4ada-964e-604da9fdcccd"
        echo VITE_AZURE_TENANT_ID="e27ea0e3-d544-492a-bdfc-778865bdeeae"
        echo VITE_AZURE_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"
        echo VITE_BYPASS_MICROSOFT_AUTH="false"
    ) > "frontend\.env"
    echo  [OK] frontend\.env created.
) else (
    echo  [SKIP] frontend\.env already exists.
)
echo.

:: -------------------------------------------
:: Step 4: Generate Prisma Client
:: -------------------------------------------
echo [4/6] Generating Prisma client...
echo.

cd backend
call npx prisma generate
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to generate Prisma client.
    cd ..
    pause
    exit /b 1
)
echo  [OK] Prisma client generated.
echo.

:: -------------------------------------------
:: Step 5: Run Database Migrations
:: -------------------------------------------
echo [5/6] Running database migrations...
echo.
echo  Make sure MySQL is running and the database "tks_tracking" exists.
echo  If migration fails, create the database manually:
echo    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS tks_tracking;"
echo.

call npx prisma migrate dev --name init_database
if %errorlevel% neq 0 (
    echo  [WARNING] Database migration failed.
    echo           This may be because:
    echo            - MySQL is not running
    echo            - Database "tks_tracking" doesn't exist
    echo            - DATABASE_URL in backend\.env has wrong credentials
    echo.
    echo  You can retry migrations later with:
    echo    cd backend ^&^& npx prisma migrate dev --name init_database
    echo.
) else (
    echo  [OK] Database migrations applied.
)
echo.

:: -------------------------------------------
:: Step 6: Seed the Database
:: -------------------------------------------
echo [6/6] Seeding the database with default data...
echo.

call npm run db:seed
if %errorlevel% neq 0 (
    echo  [WARNING] Database seeding failed.
    echo           You can retry later with:
    echo             cd backend ^&^& npm run db:seed
    echo.
) else (
    echo  [OK] Database seeded successfully.
)

cd ..
echo.

:: -------------------------------------------
:: Done
:: -------------------------------------------
echo  ╔══════════════════════════════════════════════════════════════╗
echo  ║                  Setup Complete!                            ║
echo  ╠══════════════════════════════════════════════════════════════╣
echo  ║                                                             ║
echo  ║  Next steps:                                                ║
echo  ║   1. Run start.bat to launch the application                ║
echo  ║   2. Frontend: http://localhost:3000                        ║
echo  ║   3. Backend API: http://localhost:5000                     ║
echo  ║                                                             ║
echo  ║  If you had migration errors, fix your MySQL setup          ║
echo  ║  and run this script again - it will skip completed steps.  ║
echo  ╚══════════════════════════════════════════════════════════════╝
echo.

pause
