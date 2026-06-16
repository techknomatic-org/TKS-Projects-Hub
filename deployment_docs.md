# TKS Product Development Tracking - Deployment & Operations Guide

This guide details the steps to deploy, run, and operate the TKS Product Development Tracking application in a production-ready environment.

---

## 1. System Architecture Overview

The application comprises three core tiers orchestrated for security, performance, and real-time updates:
1. **Frontend Tier (React + Vite + Tailwind v4)**: Served via Nginx as static assets. Configured for client-side routing.
2. **Backend Tier (Node.js + Express + Socket.IO)**: Managed via PM2 or Docker, runs security filters (Helmet, CORS, rate limiting), Winston logging, and triggers real-time events.
3. **Database Tier (MySQL 8.0)**: Holds relational project tracking models. Managed by Prisma ORM.
4. **Ingress/Proxy Layer (Nginx)**: Standard single-port reverse proxy mapping HTTP APIs (`/api`), WebSockets (`/socket.io/`), and client page queries (`/`).

---

## 2. Environment Variables Configuration

Both backend and frontend require `.env` configurations.

### Backend Environment Variables (`backend/.env`)
Create a file at `backend/.env` with:
```ini
PORT=5000
DATABASE_URL="mysql://root:Sai@1234@localhost:3306/tks_tracking"
JWT_SECRET="tks_jwt_secret_key_change_me_in_prod"
AZURE_CLIENT_ID="a667ed28-9786-4ada-964e-604da9fdcccd"
AZURE_TENANT_ID="e27ea0e3-d544-492a-bdfc-778865bdeeae"
BYPASS_MICROSOFT_AUTH="false"
```

### Frontend Environment Variables (`frontend/.env`)
Create a file at `frontend/.env` with:
```ini
VITE_API_URL="http://localhost:5000/api"
VITE_AZURE_CLIENT_ID="a667ed28-9786-4ada-964e-604da9fdcccd"
VITE_AZURE_TENANT_ID="e27ea0e3-d544-492a-bdfc-778865bdeeae"
VITE_AZURE_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"
VITE_BYPASS_MICROSOFT_AUTH="false"
```
*Note: In Dockerized container setups, Nginx reverse-proxies requests through relative paths (`/api` and `/`), so Vite utilizes environment variables passed through Docker build arguments automatically.*

---

## 3. Option A: Deployment Using Docker Compose (Recommended)

Docker Compose containerizes the database, backend node server, static frontend build, and Nginx ingress router in a single command.

### Prerequisites
- Docker Desktop and Docker Compose installed and running.

### Installation & Run Steps
1. Navigate to the project root directory.
2. Build and start the containers in detached mode:
   ```bash
   docker-compose up --build -d
   ```
3. Run the database migrations and seed default data:
   ```bash
   # Run Prisma migrations inside the backend container
   docker exec -it tks-backend npx prisma migrate deploy
   
   # Run the seed script to load products and statuses
   docker exec -it tks-backend npm run db:seed
   ```
4. Access the web app at `http://localhost`.

### Useful Commands
- **Check logs**: `docker-compose logs -f`
- **Stop services**: `docker-compose down`
- **Rebuild after updates**: `docker-compose up --build -d`

---

## 4. Option B: Deployment Using PM2 (Local Process Manager)

For deployments on target Windows/Linux VM environments without Docker.

### Prerequisites
- Node.js (v18 or v20) installed.
- MySQL Server (v8) running on port 3306.
- PM2 installed globally: `npm install -g pm2`

### Setup Steps
1. **Database Setup**: Create a schema named `tks_tracking` inside your MySQL database.
2. **Install Root Packages**:
   ```bash
   npm run install:all
   ```
3. **Run Migrations & Seed**:
   ```bash
   cd backend
   npx prisma migrate dev --name init_database
   npm run db:seed
   cd ..
   ```
4. **Compile Frontend**:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```
5. **Start Backend with PM2**:
   ```bash
   pm2 start ecosystem.config.js
   ```
6. **Serve Frontend**:
   - The compiled static directory `frontend/dist` can be served via a local web server (IIS, Apache, or static Nginx install).

### PM2 Process Control Commands
- **View process list**: `pm2 list`
- **Monitor metrics**: `pm2 monit`
- **View logs**: `pm2 logs tks-backend`
- **Restart application**: `pm2 restart tks-backend`
- **Stop application**: `pm2 stop tks-backend`

---

## 5. Backup and Recovery Operations

We have created cross-platform utility scripts in the [backups/](file:///c:/Users/krish/OneDrive/Desktop/TKS%20Project%20Tracking/backups/) directory.

### Running Backups
The backup script checks if MySQL is running locally or inside a Docker container, dumps the schema + data, and rotates backups by deleting items older than 7 days.

- **On Unix/Linux/macOS**:
  ```bash
  chmod +x backups/backup.sh
  ./backups/backup.sh
  ```
- **On Windows (PowerShell)**:
  ```powershell
  .\backups\backup.ps1
  ```

### Restoring Backups
Restore a snapshot SQL file back into the active tracking database:

- **On Unix/Linux/macOS**:
  ```bash
  chmod +x backups/restore.sh
  ./backups/restore.sh backups/tks_backup_YYYYMMDD_HHMMSS.sql
  ```
- **On Windows (PowerShell)**:
  ```powershell
  .\backups\restore.ps1 backups\tks_backup_YYYYMMDD_HHMMSS.sql
  ```

---

## 6. Logs & Monitoring

- **Application Logs**: Winston handles server logging. File outputs are saved under `backend/logs/combined.log` (all runtime requests and sockets connections) and `backend/logs/error.log` (uncaught warnings and stack traces).
- **PM2 logs**: PM2 logs are saved to `backend/logs/pm2-error.log` and `backend/logs/pm2-out.log`.
- **Nginx Access & Error logs**: Standard logs are redirected to docker stdout/stderr or stored in `/var/log/nginx/`.

---

## 7. Operational Troubleshooting

- **Database Connection Refused**:
  - Verify your password does not contain unescaped special characters in `DATABASE_URL`. If using `@` in a password inside the URL string, url-encode it as `%40`.
  - Ensure the MySQL database service is running and accessible from the server host.
- **Port Conflicts (Port 3000 / 5000 in use)**:
  - Find the process lock using:
    - **Windows (PowerShell)**: `Get-NetTCPConnection -LocalPort 5000 | Format-List` or `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force`
    - **Linux**: `fuser -k 5000/tcp`
- **Docker Compose Startup Race Conditions**:
  - If backend starts before database initialization, Docker Compose utilizes a `healthcheck` on the database service and blocks backend boot until the MySQL ping responds successfully.
