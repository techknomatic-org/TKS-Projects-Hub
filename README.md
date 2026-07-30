<p align="center">
  <img src="tks.png" alt="TKS Logo" width="120" />
</p>

<h1 align="center">TKS Projects Hub</h1>

<p align="center">
  <strong>Centralized workspace to track, manage, and collaborate across all TKS product initiatives.</strong>
</p>

<p align="center">
  <em>Built by the TKS (Techknomatic Solutions) team for internal product development tracking.</em>
</p>

---

## Table of Contents

- [What Is This Project?](#what-is-this-project)
- [Key Features](#key-features)
- [Screenshots & Modules](#screenshots--modules)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start (Windows)](#quick-start-windows)
- [Manual Setup (Step by Step)](#manual-setup-step-by-step)
- [Docker Deployment](#docker-deployment)
- [Project Folder Structure](#project-folder-structure)
- [Environment Variables](#environment-variables)
- [User Roles & Permissions](#user-roles--permissions)
- [Application Modules Guide](#application-modules-guide)
- [API Reference](#api-reference)
- [Database Schema Overview](#database-schema-overview)
- [Real-Time Features (Socket.IO)](#real-time-features-socketio)
- [Backup & Recovery](#backup--recovery)
- [Logs & Monitoring](#logs--monitoring)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## What Is This Project?

**TKS Projects Hub** is an internal web application used by the Techknomatic Solutions team to:

- **Track product development progress** across multiple products (Nexora, InsightSM, DataPulse IQ, TicketIQ, MaintainIQ, etc.)
- **Manage features and user stories** with priorities, statuses, owners, and sprint assignments
- **Visualize work** using a Kanban board with drag-and-drop capabilities
- **Map functional requirements** to user stories for traceability
- **Generate reports and analytics** — status distribution, feature overviews, sprint velocity, employee workload, and release readiness
- **Manage team members** — assign roles, tag users to products, activate/deactivate accounts
- **Track all changes** via a full audit log system
- **Receive real-time notifications** via WebSocket-powered live alerts

> **In simple terms**: Think of it as a "project management dashboard" — like Jira or Trello — built specifically for TKS products, with Microsoft login integration.

---

## Key Features

| Feature | Description |
|---------|-------------|
| 🔐 **Microsoft SSO Login** | Authenticate using your `@techknomatic.com` Microsoft account (Azure AD). Also supports a bypass mode for local development. |
| 📋 **Kanban Board** | Drag-and-drop task cards across status columns: `TODO` → `IN PROGRESS` → `IN REVIEW` → `TESTING` → `BLOCKED` → `READY FOR RELEASE` → `DONE` |
| 🧩 **Feature Management** | Create, edit, filter, and track features per product with priority levels (`Low`, `Medium`, `High`, `Critical`) and statuses (`Planned`, `In Progress`, `Completed`, `On Hold`) |
| 📖 **User Stories** | Manage user stories with story points, sprint assignments, and full lifecycle tracking (`Backlog` → `Ready` → `In Progress` → `Testing` → `Done`) |
| 🔗 **Requirements Mapping** | Link functional requirements to user stories for traceability matrix reporting |
| 📊 **Reports & Analytics** | Interactive charts: Status Distribution (pie), Feature Overview (bar), Story Overview (bar), Sprint Velocity (line), Employee Workload (bar), Release Readiness (progress) |
| 👥 **Members Management** | Admin panel to create/edit/deactivate users, assign roles, and tag team members to specific products |
| 📜 **Audit Logs** | Complete history of every CREATE, UPDATE, and DELETE action with old/new value diffs |
| 🔔 **Real-Time Notifications** | Live toast alerts and notification feed powered by Socket.IO WebSockets |
| 🌐 **Offline Indicator** | Detects when you lose internet connectivity and shows a warning banner |
| 📤 **Excel Export** | Export data to Excel spreadsheets using the XLSX library |

---

## Screenshots & Modules

The application is organized into the following main sections, accessible from the sidebar:

| # | Module | What It Does |
|---|--------|-------------|
| 1 | **Status (Kanban Board)** | Visual board showing all tasks for the selected product organized by status columns. Drag cards between columns to update status. |
| 2 | **Feature List** | Table/list view of all features for the selected product. Create, edit, delete, and filter features. |
| 3 | **User Stories** | Table/list of user stories for the selected product. Manage stories with sprint tracking and story points. |
| 4 | **Requirements Mapping** | Map functional requirements (FR-001, FR-002, etc.) to user stories for traceability. |
| 5 | **Members** | Admin-only panel to manage team members: add users, change roles, activate/deactivate accounts, tag members to products. |
| 6 | **Reports** | Charts and analytics dashboard with multiple visualizations for the selected product. |
| 7 | **Audit Logs** | Searchable log of all system changes with details showing who changed what and when. |
| 8 | **Notifications** | List of all real-time notifications received (status changes, feature updates, etc.). |

---

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework — component-based user interface |
| **Vite 8** | Build tool & dev server — fast hot module replacement |
| **Tailwind CSS 4** | Utility-first CSS framework for styling |
| **React Router 7** | Client-side routing & navigation |
| **Recharts** | Chart library for reports & analytics |
| **@hello-pangea/dnd** | Drag-and-drop library for the Kanban board |
| **MSAL React** | Microsoft Authentication Library for Azure AD SSO |
| **Socket.IO Client** | Real-time WebSocket communication |
| **Lucide React** | Icon library |
| **XLSX** | Excel file generation for data export |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js** | Server runtime environment |
| **Express.js** | Web framework for REST API |
| **Prisma ORM** | Database toolkit & query builder |
| **MySQL 8.0** | Relational database |
| **Socket.IO** | Real-time bidirectional WebSocket communication |
| **JSON Web Tokens (JWT)** | Session authentication tokens |
| **JWKS-RSA** | Microsoft token signature verification |
| **Helmet** | HTTP security headers |
| **Express Rate Limit** | API rate limiting protection |
| **Winston** | Application logging framework |
| **Morgan** | HTTP request logging |
| **Zod** | Request data validation |

### DevOps & Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Docker & Docker Compose** | Containerized deployment |
| **Nginx** | Reverse proxy & static file serving |
| **PM2** | Node.js process manager for production |
| **Nodemon** | Auto-restart during development |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (User)                              │
│                                                                     │
│   React + Vite + Tailwind v4        Port 3000 (dev) / Port 80 (prod)│
│   ┌─────────────────────────────────────────────────┐               │
│   │  Login ──► Dashboard ──► Sidebar Navigation     │               │
│   │    │          │                                  │               │
│   │    │    ┌─────┴──────────────────────────┐       │               │
│   │    │    │  Kanban │ Features │ Stories    │       │               │
│   │    │    │  Reports│ Members │ Audit Logs │       │               │
│   │    │    │  Notifications │ Req. Mapping  │       │               │
│   │    │    └────────────────────────────────┘       │               │
│   │    │                                             │               │
│   │  MSAL ──► Microsoft Azure AD (SSO)               │               │
│   └─────────────────────────────────────────────────┘               │
│                          │ REST API + WebSocket                      │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │   Nginx Reverse Proxy       │
            │   (Docker only, Port 80)    │
            │   /     ──► Frontend        │
            │   /api  ──► Backend         │
            │   /socket.io ──► Backend    │
            └──────────────┼──────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────┐
│                    BACKEND SERVER                                    │
│                    Node.js + Express       Port 5000                 │
│                                                                     │
│  ┌──────────────────────────────────────────────┐                   │
│  │  Security Layer                               │                   │
│  │  Helmet │ CORS │ Rate Limiting │ JWT Auth     │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                     │
│  ┌──────────────────────────────────────────────┐                   │
│  │  API Routes                                   │                   │
│  │  /api/auth        - Authentication            │                   │
│  │  /api/products    - Products & Task Statuses  │                   │
│  │  /api/features    - Features CRUD             │                   │
│  │  /api/user-stories - User Stories CRUD        │                   │
│  │  /api/reports     - Analytics & Charts         │                   │
│  │  /api/users       - Members Management         │                   │
│  │  /api/audit-logs  - Audit Trail                │                   │
│  │  /api/notifications - Notification Feed        │                   │
│  │  /api/requirements-mapping - FR Mapping        │                   │
│  └──────────────────────────────────────────────┘                   │
│                                                                     │
│  ┌──────────────────────────────────────────────┐                   │
│  │  Services                                     │                   │
│  │  Audit Service │ Notification Service         │                   │
│  │  Socket.IO (real-time events)                 │                   │
│  │  Winston Logger                               │                   │
│  └──────────────────────────────────────────────┘                   │
│                          │ Prisma ORM                                │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────────┐
│                    MySQL 8.0 DATABASE                                │
│                    Schema: tks_tracking        Port 3306             │
│                                                                     │
│  Tables: users, products, product_statuses, features,               │
│          user_stories, functional_requirements,                      │
│          user_story_requirement_mappings, audit_logs,                │
│          notifications                                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

Before running the project, make sure you have these installed on your computer:

| Software | Version | Download Link | What It's For |
|----------|---------|--------------|---------------|
| **Node.js** | v18 or v20 | [nodejs.org](https://nodejs.org/) | Runs the backend server and builds the frontend |
| **npm** | Comes with Node.js | Included with Node.js | Installs JavaScript packages/dependencies |
| **MySQL Server** | v8.0 | [dev.mysql.com/downloads](https://dev.mysql.com/downloads/mysql/) | Stores all application data |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) | Clone the repository |

> **Optional (for Docker deployment):**
> - [Docker Desktop](https://www.docker.com/products/docker-desktop/) — for containerized deployment

### How to verify you have the prerequisites:

Open a terminal (Command Prompt or PowerShell) and run:

```bash
node -v        # Should print v18.x.x or v20.x.x
npm -v         # Should print 9.x.x or 10.x.x
mysql --version  # Should print mysql  Ver 8.x.x
git --version  # Should print git version 2.x.x
```

---

## Quick Start (Windows)

> **For first-time users, this is the easiest way to get started.**

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd TKS-Projects-Hub
```

### Step 2: Run the Setup Script

Double-click **`setup.bat`** or run it from the command line:

```bash
setup.bat
```

This automatically:
- ✅ Checks if Node.js, npm, and MySQL are installed
- ✅ Installs all project dependencies (root, backend, frontend)
- ✅ Creates `.env` files with default configurations
- ✅ Generates the Prisma database client
- ✅ Runs database migrations (creates tables in MySQL)
- ✅ Seeds the database with default products and users

### Step 3: Start the Application

Double-click **`start.bat`** or run:

```bash
start.bat
```

This starts both servers:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Step 4: Stop the Application

Double-click **`stop.bat`** or run:

```bash
stop.bat
```

This safely stops all running servers on ports 3000 and 5000.

---

### Summary of Batch Scripts

| Script | When to Use | What It Does |
|--------|-------------|--------------|
| `setup.bat` | **Once** — first time after cloning | Installs dependencies, creates configs, sets up database |
| `start.bat` | **Every time** you want to work | Starts frontend + backend dev servers |
| `stop.bat` | **When done** working | Kills running servers cleanly |

---

## Manual Setup (Step by Step)

If you prefer to set things up manually (or are on macOS/Linux), follow these steps:

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd TKS-Projects-Hub
```

### 2. Install All Dependencies

```bash
npm run install:all
```

This installs dependencies for the root workspace, backend, and frontend in one command.

### 3. Create Environment Files

**Backend** — create `backend/.env`:

```ini
PORT=5000
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/tks_tracking"
JWT_SECRET="tks_jwt_secret_key_change_me_in_prod"
AZURE_CLIENT_ID="a667ed28-9786-4ada-964e-604da9fdcccd"
AZURE_TENANT_ID="e27ea0e3-d544-492a-bdfc-778865bdeeae"
BYPASS_MICROSOFT_AUTH="false"
```

**Frontend** — create `frontend/.env`:

```ini
VITE_API_URL="http://localhost:5000/api"
VITE_AZURE_CLIENT_ID="a667ed28-9786-4ada-964e-604da9fdcccd"
VITE_AZURE_TENANT_ID="e27ea0e3-d544-492a-bdfc-778865bdeeae"
VITE_AZURE_REDIRECT_URI="http://localhost:3000/auth/microsoft/callback"
VITE_BYPASS_MICROSOFT_AUTH="false"
```

> **💡 Tip**: Set `BYPASS_MICROSOFT_AUTH="true"` in both files if you want to skip Microsoft login during local development. This lets you log in with any email from the database directly.

### 4. Set Up the Database

Make sure MySQL is running, then create the database:

```sql
CREATE DATABASE IF NOT EXISTS tks_tracking;
```

### 5. Run Migrations & Seed

```bash
cd backend
npx prisma generate        # Generate the Prisma client
npx prisma migrate dev --name init_database  # Create tables
npm run db:seed             # Populate default data
cd ..
```

### 6. Start the Development Servers

```bash
npm run dev
```

This starts both the backend and frontend concurrently. Open http://localhost:3000 in your browser.

---

## Docker Deployment

For production or team environments, Docker Compose handles everything automatically.

### Prerequisites
- Docker Desktop installed and running

### Deploy

```bash
# Build and start all containers
docker-compose up --build -d

# Run database migrations inside the backend container
docker exec -it tks-backend npx prisma migrate deploy

# Seed the database
docker exec -it tks-backend npm run db:seed
```

### Access
- **Application**: http://localhost (port 80, through Nginx)

### Manage

```bash
docker-compose logs -f           # View live logs
docker-compose down              # Stop all containers
docker-compose up --build -d     # Rebuild after code changes
```

### Docker Services

| Service | Container Name | Description | Port |
|---------|---------------|-------------|------|
| **db** | `tks-mysql` | MySQL 8.0 database | 3306 |
| **backend** | `tks-backend` | Node.js API server | 5000 (internal) |
| **frontend** | `tks-frontend` | React static build via Nginx | 80 (internal) |
| **nginx** | `tks-nginx` | Reverse proxy | 80 (exposed) |

---

## Project Folder Structure

```
TKS-Projects-Hub/
│
├── 📄 setup.bat                    # First-time setup script (Windows)
├── 📄 start.bat                    # Start dev servers (Windows)
├── 📄 stop.bat                     # Stop running servers (Windows)
├── 📄 package.json                 # Root workspace — scripts & concurrently
├── 📄 docker-compose.yml           # Docker multi-container orchestration
├── 📄 ecosystem.config.js          # PM2 process manager configuration
├── 📄 nginx.conf                   # Nginx reverse proxy configuration
├── 📄 deployment_docs.md           # Deployment & operations guide
├── 📄 README.md                    # ← You are here
├── 🖼️ tks.png                      # TKS logo image
│
├── 📁 backend/                     # Backend API Server
│   ├── 📄 package.json             # Backend dependencies & scripts
│   ├── 📄 Dockerfile               # Docker build instructions
│   ├── 📄 nodemon.json             # Nodemon dev config
│   ├── 📄 check_db.js              # Database connection check utility
│   │
│   ├── 📁 prisma/                  # Database Layer
│   │   ├── 📄 schema.prisma        # Database models/tables definition
│   │   ├── 📄 seed.js              # Default data seeder (users, products)
│   │   └── 📁 migrations/          # SQL migration history
│   │
│   ├── 📁 src/                     # Application Source Code
│   │   ├── 📄 server.js            # Express app entry point
│   │   │
│   │   ├── 📁 routes/              # API Route Handlers
│   │   │   ├── 📄 auth.js          # Microsoft SSO & JWT auth
│   │   │   ├── 📄 products.js      # Products & task status CRUD
│   │   │   ├── 📄 features.js      # Features CRUD
│   │   │   ├── 📄 userStories.js   # User stories CRUD
│   │   │   ├── 📄 reports.js       # Analytics & reporting endpoints
│   │   │   ├── 📄 users.js         # User/member management
│   │   │   ├── 📄 auditLogs.js     # Audit log queries
│   │   │   ├── 📄 notifications.js # Notification CRUD
│   │   │   └── 📄 requirementsMapping.js # FR-to-story mapping
│   │   │
│   │   ├── 📁 services/            # Business Logic Services
│   │   │   ├── 📄 auditService.js       # Audit logging service
│   │   │   └── 📄 notificationService.js # Notification dispatch
│   │   │
│   │   ├── 📁 middlewares/         # Express Middleware
│   │   │   ├── 📄 auth.js          # JWT verification middleware
│   │   │   └── 📄 errorMiddleware.js # Global error handler
│   │   │
│   │   └── 📁 lib/                 # Shared Utilities
│   │       ├── 📄 prisma.js        # Prisma client instance
│   │       ├── 📄 socket.js        # Socket.IO server setup
│   │       ├── 📄 logger.js        # Winston logger configuration
│   │       └── 📄 schemas.js       # Zod validation schemas
│   │
│   └── 📁 logs/                    # Runtime log files
│       ├── 📄 combined.log         # All application logs
│       ├── 📄 error.log            # Error-only logs
│       ├── 📄 pm2-out.log          # PM2 stdout logs
│       └── 📄 pm2-error.log        # PM2 error logs
│
├── 📁 frontend/                    # Frontend React Application
│   ├── 📄 package.json             # Frontend dependencies & scripts
│   ├── 📄 vite.config.js           # Vite build configuration
│   ├── 📄 index.html               # HTML entry point
│   ├── 📄 eslint.config.js         # Linter configuration
│   ├── 📄 Dockerfile               # Docker build for frontend
│   ├── 📄 nginx.conf               # In-container Nginx config
│   ├── 📄 netlify.toml             # Netlify deployment config
│   │
│   ├── 📁 public/                  # Static assets (copied as-is)
│   │
│   └── 📁 src/                     # React Source Code
│       ├── 📄 main.jsx             # App entry — MSAL + BrowserRouter
│       ├── 📄 App.jsx              # Root routes (Login, Dashboard)
│       ├── 📄 index.css            # Global styles
│       ├── 📄 App.css              # App-level styles
│       │
│       ├── 📁 pages/               # Full Page Components
│       │   ├── 📄 Login.jsx        # Login page with Microsoft SSO
│       │   └── 📄 Dashboard.jsx    # Main dashboard (all tabs)
│       │
│       ├── 📁 components/          # Reusable UI Components (40 files)
│       │   ├── 📄 Sidebar.jsx           # Navigation sidebar
│       │   ├── 📄 Header.jsx            # Top header with user menu
│       │   ├── 📄 ProductSelector.jsx   # Product dropdown selector
│       │   ├── 📄 ProtectedRoute.jsx    # Auth guard wrapper
│       │   ├── 📄 KanbanBoard.jsx       # Kanban board container
│       │   ├── 📄 KanbanColumn.jsx      # Single kanban column
│       │   ├── 📄 StatusCard.jsx        # Task card on kanban
│       │   ├── 📄 EditStatusModal.jsx   # Create/edit task modal
│       │   ├── 📄 FeatureList.jsx       # Features list view
│       │   ├── 📄 FeatureTable.jsx      # Features table view
│       │   ├── 📄 FeatureModal.jsx      # Create/edit feature modal
│       │   ├── 📄 FeatureFilters.jsx    # Feature filter controls
│       │   ├── 📄 FeatureBadge.jsx      # Feature status badge
│       │   ├── 📄 UserStoryList.jsx     # User stories list view
│       │   ├── 📄 UserStoryTable.jsx    # User stories table view
│       │   ├── 📄 UserStoryModal.jsx    # Create/edit story modal
│       │   ├── 📄 UserStoryFilters.jsx  # Story filter controls
│       │   ├── 📄 StoryBadge.jsx        # Story status badge
│       │   ├── 📄 RequirementsMappingList.jsx  # FR mapping view
│       │   ├── 📄 MembersList.jsx       # Team members management
│       │   ├── 📄 MemberModal.jsx       # Create/edit member modal
│       │   ├── 📄 ReportsDashboard.jsx  # Reports & analytics
│       │   ├── 📄 StatusDistributionChart.jsx  # Pie chart
│       │   ├── 📄 FeatureOverviewChart.jsx     # Bar chart
│       │   ├── 📄 StoryOverviewChart.jsx       # Bar chart
│       │   ├── 📄 SprintVelocityChart.jsx      # Line chart
│       │   ├── 📄 EmployeeWorkloadChart.jsx    # Bar chart
│       │   ├── 📄 ReleaseReadinessCard.jsx     # Progress card
│       │   ├── 📄 AuditLogList.jsx      # Audit logs view
│       │   ├── 📄 AuditLogTable.jsx     # Audit logs table
│       │   ├── 📄 AuditLogFilters.jsx   # Audit log filters
│       │   ├── 📄 AuditLogDetailsModal.jsx  # Audit detail popup
│       │   ├── 📄 NotificationsList.jsx # Notifications feed
│       │   ├── 📄 NotificationCard.jsx  # Single notification
│       │   ├── 📄 NotificationFilters.jsx # Notification filters
│       │   ├── 📄 Toast.jsx             # Toast alert popup
│       │   ├── 📄 OfflineIndicator.jsx  # Offline banner
│       │   ├── 📄 ErrorBoundary.jsx     # React error boundary
│       │   ├── 📄 DeleteConfirmationModal.jsx   # Delete confirm
│       │   └── 📄 DeleteStoryConfirmationModal.jsx # Delete story confirm
│       │
│       ├── 📁 services/             # API & Auth Services
│       │   ├── 📄 authService.js    # Auth token management
│       │   ├── 📄 msalService.js    # MSAL config instance
│       │   ├── 📄 productService.js # All API calls (600+ lines)
│       │   └── 📄 socketService.js  # Socket.IO client
│       │
│       └── 📁 assets/               # Images, icons, etc.
│
├── 📁 backups/                     # Database Backup Scripts
│   ├── 📄 backup.ps1               # Windows backup script
│   ├── 📄 backup.sh                # Linux/macOS backup script
│   ├── 📄 restore.ps1              # Windows restore script
│   └── 📄 restore.sh               # Linux/macOS restore script
│
├── 📁 UI Designs/                  # UI mockup reference files
│
├── 📄 Nexora_Feature_List.xlsx     # Feature tracking spreadsheet
├── 📄 Nexora_UserStory_Feature_Mapping.xlsx  # Story-to-feature mapping
├── 📄 Nexora_User_Stories.xlsx     # User stories spreadsheet
└── 📄 TKS Product Development Tracking Documentation.docx  # Full docs
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Port the backend server listens on |
| `DATABASE_URL` | **Yes** | — | MySQL connection string. Format: `mysql://USER:PASSWORD@HOST:PORT/DB_NAME` |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWT tokens. Change this in production! |
| `AZURE_CLIENT_ID` | **Yes** | — | Azure AD application (client) ID for Microsoft login |
| `AZURE_TENANT_ID` | **Yes** | — | Azure AD tenant ID for your organization |
| `BYPASS_MICROSOFT_AUTH` | No | `"false"` | Set to `"true"` to skip Microsoft login (for local dev). Lets you login with any email in the database. |
| `ALLOWED_ORIGINS` | No | — | Comma-separated list of additional CORS origins |
| `AUTH_DIAGNOSTICS` | No | `"false"` | Set to `"true"` to enable verbose authentication logging |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | **Yes** | `"http://localhost:5000/api"` | Backend API base URL |
| `VITE_AZURE_CLIENT_ID` | **Yes** | — | Same Azure AD client ID as backend |
| `VITE_AZURE_TENANT_ID` | **Yes** | — | Same Azure AD tenant ID as backend |
| `VITE_AZURE_REDIRECT_URI` | **Yes** | — | Where Microsoft redirects after login (e.g., `http://localhost:3000/auth/microsoft/callback`) |
| `VITE_BYPASS_MICROSOFT_AUTH` | No | `"false"` | Must match the backend setting |
| `VITE_SOCKET_URL` | No | — | Socket.IO server URL (for Docker: `/`) |

---

## User Roles & Permissions

The application has three user roles:

| Role | Label in UI | Can Access | Restrictions |
|------|------------|------------|-------------|
| **ADMIN** | Admin | All modules, member management, create/delete products | Full access |
| **EMPLOYEE** | Developer | Status board, features, user stories, reports, requirements mapping | Cannot manage members, create products, or see admin-only features |
| **BOTH** | Admin & Developer | Everything | Combination of Admin + Employee privileges |

### How Users Are Added

Users are **not self-registered**. They must be:
1. **Pre-seeded** in the database via `seed.js`, OR
2. **Created by an Admin** through the Members panel in the UI

When a user logs in via Microsoft SSO, the system checks if their email exists in the database. If not, access is denied with an error message.

---

## Application Modules Guide

### 1. Login Page

- Users authenticate using their **Microsoft (Azure AD)** account
- The system verifies the Microsoft token, checks the email against the database, and issues a local JWT (valid for 8 hours)
- Profile pictures are automatically fetched from Microsoft Graph API
- **Bypass Mode**: When `BYPASS_MICROSOFT_AUTH=true`, you can log in by typing any email that exists in the database (useful for development)

### 2. Dashboard & Product Selector

- The **Product Selector** dropdown at the top lets you switch between products (Nexora, InsightSM, etc.)
- All modules below show data **filtered for the selected product**
- Your last selected product is remembered in the browser

### 3. Status (Kanban Board)

- Displays task cards organized in columns: `TODO`, `IN PROGRESS`, `IN REVIEW`, `TESTING`, `BLOCKED`, `READY FOR RELEASE`, `DONE`
- **Drag & drop** cards between columns to update their status
- Click a card to view/edit details (title, description, priority, owner)
- Create new status cards with the "Add" button
- Each card shows priority level (colored badge) and assigned owner

### 4. Feature List

- Lists all features for the selected product
- Toggle between **List view** and **Table view**
- Filter features by status, priority, or owner
- Create, edit, and delete features
- Each feature has: title, description, priority, status, owner, and release version

### 5. User Stories

- Lists all user stories for the selected product
- Toggle between **List view** and **Table view**
- Filter stories by status, priority, sprint, or owner
- Each story includes: title, description, priority, status, story points, sprint name, and owner
- Story points help estimate effort for sprint planning

### 6. Requirements Mapping

- View and manage **Functional Requirements** (FR-001, FR-002, etc.)
- Link user stories to functional requirements for **traceability**
- Useful for compliance and tracking which requirements are covered by which stories

### 7. Members Management (Admin Only)

- View all team members with their roles and assigned products
- **Create** new members (add email, name, role)
- **Edit** existing members (change role, update info)
- **Activate/Deactivate** accounts (deactivated users cannot log in)
- **Tag members to products** — controls which products a member is assigned to

### 8. Reports & Analytics

Visual charts for the selected product:

| Chart | Type | What It Shows |
|-------|------|--------------|
| **Status Distribution** | Pie chart | Breakdown of tasks by status (TODO, In Progress, Testing, Done) |
| **Feature Overview** | Bar chart | Count of features by status (Planned, In Progress, Completed, On Hold) |
| **Story Overview** | Bar chart | Count of user stories by status (Backlog, Ready, In Progress, Testing, Done) |
| **Sprint Velocity** | Line chart | Story points completed per sprint |
| **Employee Workload** | Bar chart | Tasks, features, and stories assigned per developer |
| **Release Readiness** | Progress card | Percentage of features completed per product |

### 9. Audit Logs

- Complete history of all **CREATE**, **UPDATE**, and **DELETE** actions
- Shows: who did what, when, and which entity was affected
- Click any log entry to see the **detailed diff** (old value → new value)
- Filterable by entity type, action, user, and date range

### 10. Notifications

- Real-time alerts for important events (status changes, new features, assignments)
- Notifications appear as **toast popups** in real-time and are stored in the notification feed
- Mark individual notifications as read
- Filter by type (Status, Feature, User Story, Release, System)

---

## API Reference

All API endpoints are prefixed with `/api` and require JWT authentication (except the auth endpoint itself).

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/microsoft` | Login with Microsoft token or bypass email |
| `GET` | `/api/auth/me` | Get current logged-in user info |

### Products & Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get single product |
| `POST` | `/api/products` | Create a new product |
| `DELETE` | `/api/products/:id` | Delete a product |
| `GET` | `/api/products/:id/status` | Get all task statuses for a product |
| `POST` | `/api/products/:id/status` | Create a new task status card |
| `PUT` | `/api/products/:id/status/:statusId` | Update a task status card |
| `DELETE` | `/api/products/:id/status/:statusId` | Delete a task status card |

### Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/:id/features` | List features for a product |
| `POST` | `/api/products/:id/features` | Create a feature |
| `PUT` | `/api/features/:id` | Update a feature |
| `DELETE` | `/api/features/:id` | Delete a feature |

### User Stories
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/:id/user-stories` | List user stories for a product |
| `POST` | `/api/products/:id/user-stories` | Create a user story |
| `PUT` | `/api/user-stories/:id` | Update a user story |
| `DELETE` | `/api/user-stories/:id` | Delete a user story |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/status-distribution` | Task status breakdown |
| `GET` | `/api/reports/feature-overview` | Feature status counts |
| `GET` | `/api/reports/story-overview` | User story status counts |
| `GET` | `/api/reports/sprint-velocity` | Story points per sprint |
| `GET` | `/api/reports/workload` | Employee workload metrics |
| `GET` | `/api/reports/release-readiness` | Feature completion percentage |

### Users / Members
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/all` | List all users with assignments |
| `POST` | `/api/users` | Create a new user |
| `PUT` | `/api/users/:id` | Update user details |
| `PUT` | `/api/users/:id/toggle-active` | Activate/deactivate user |
| `PUT` | `/api/users/:id/tagged-products` | Update product tags |

### Audit Logs
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/audit-logs` | Get audit log entries (paginated, filterable) |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | Get notifications for current user |
| `PUT` | `/api/notifications/:id/read` | Mark notification as read |
| `PUT` | `/api/notifications/mark-all-read` | Mark all as read |

### Requirements Mapping
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/:id/functional-requirements` | List FRs for a product |
| `POST` | `/api/products/:id/functional-requirements` | Create a functional requirement |
| `PUT` | `/api/functional-requirements/:id` | Update an FR |
| `DELETE` | `/api/functional-requirements/:id` | Delete an FR |
| `POST` | `/api/user-stories/:id/map-requirement` | Map story to FR |
| `DELETE` | `/api/user-stories/:storyId/unmap-requirement/:frId` | Remove mapping |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Check if the API is running |

---

## Database Schema Overview

The application uses MySQL with Prisma ORM. Here are the main database tables:

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────────┐
│    users     │────►│ product_statuses │◄────│    products       │
│              │     │   (Kanban tasks) │     │                  │
│ id           │     │ id               │     │ id               │
│ name         │     │ title            │     │ name             │
│ email (uniq) │     │ description      │     │ description      │
│ role (enum)  │     │ status (enum)    │     │                  │
│ profileImage │     │ priority (enum)  │     └──────┬───────────┘
│ isActive     │     │ ownerId ──► user │            │
└──────┬───────┘     └──────────────────┘            │
       │                                              │
       │             ┌──────────────────┐             │
       ├────────────►│    features      │◄────────────┤
       │             │ title, desc      │             │
       │             │ status, priority │             │
       │             │ releaseVersion   │             │
       │             │ ownerId ──► user │             │
       │             └──────────────────┘             │
       │                                              │
       │             ┌──────────────────┐             │
       ├────────────►│  user_stories    │◄────────────┤
       │             │ title, desc      │             │
       │             │ status, priority │             │
       │             │ storyPoints      │             │
       │             │ sprint           │             │
       │             │ ownerId ──► user │             │
       │             └────────┬─────────┘             │
       │                      │                       │
       │         ┌────────────┴──────────────┐        │
       │         │ user_story_requirement    │        │
       │         │       _mappings           │        │
       │         │ userStoryId               │        │
       │         │ functionalRequirementId   │        │
       │         └────────────┬──────────────┘        │
       │                      │                       │
       │         ┌────────────┴──────────────┐        │
       │         │ functional_requirements   │◄───────┘
       │         │ reqId (e.g. "FR-001")     │
       │         │ title, description        │
       │         └───────────────────────────┘
       │
       │             ┌──────────────────┐
       ├────────────►│   audit_logs     │
       │             │ entityType       │
       │             │ entityId         │
       │             │ action           │
       │             │ oldValue (JSON)  │
       │             │ newValue (JSON)  │
       │             └──────────────────┘
       │
       │             ┌──────────────────┐
       └────────────►│  notifications   │
                     │ title, message   │
                     │ type             │
                     │ isRead           │
                     │ entityId/Type    │
                     └──────────────────┘
```

### Enums

| Enum | Values |
|------|--------|
| **Role** | `EMPLOYEE`, `ADMIN`, `BOTH` |
| **Status** (Kanban tasks) | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `TESTING`, `BLOCKED`, `READY_FOR_RELEASE`, `DONE` |
| **Priority** | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| **FeatureStatus** | `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD` |
| **StoryStatus** | `BACKLOG`, `READY`, `IN_PROGRESS`, `TESTING`, `DONE` |
| **EntityType** | `STATUS`, `FEATURE`, `USER_STORY`, `REQUIREMENTS_MAPPING`, `FUNCTIONAL_REQUIREMENT` |
| **AuditAction** | `CREATE`, `UPDATE`, `DELETE` |
| **NotificationType** | `STATUS`, `FEATURE`, `USER_STORY`, `RELEASE`, `SYSTEM` |

---

## Real-Time Features (Socket.IO)

The application uses **Socket.IO** for real-time communication:

1. **Connection**: When a user logs in, the frontend connects to the Socket.IO server using their JWT token
2. **Authentication**: The server verifies the JWT before allowing the WebSocket connection
3. **User Rooms**: Each user joins a private room (their user ID), enabling targeted notifications
4. **Events**: When someone creates, updates, or deletes an entity, the server broadcasts a notification to relevant users
5. **Toast Alerts**: Notifications appear as toast popups in the top-right corner of the screen in real-time

---

## Backup & Recovery

Database backup and restore scripts are located in the `backups/` folder.

### Create a Backup

**Windows (PowerShell):**
```powershell
.\backups\backup.ps1
```

**Linux/macOS:**
```bash
chmod +x backups/backup.sh
./backups/backup.sh
```

The script automatically:
- Detects if MySQL is running locally or in Docker
- Dumps the full `tks_tracking` database
- Saves the backup with a timestamp (e.g., `tks_backup_20260730_143000.sql`)
- Deletes backups older than 7 days

### Restore a Backup

**Windows (PowerShell):**
```powershell
.\backups\restore.ps1 backups\tks_backup_YYYYMMDD_HHMMSS.sql
```

**Linux/macOS:**
```bash
./backups/restore.sh backups/tks_backup_YYYYMMDD_HHMMSS.sql
```

---

## Logs & Monitoring

| Log File | Location | Contents |
|----------|----------|----------|
| **Application log** | `backend/logs/combined.log` | All requests, Socket.IO connections, business logic |
| **Error log** | `backend/logs/error.log` | Errors and stack traces only |
| **PM2 stdout** | `backend/logs/pm2-out.log` | PM2 standard output (production) |
| **PM2 errors** | `backend/logs/pm2-error.log` | PM2 error output (production) |
| **Nginx logs** | Docker stdout/stderr | Access and error logs from the reverse proxy |

---

## Troubleshooting

### Common Issues

<details>
<summary><strong>❌ "Cannot connect to database" or migration fails</strong></summary>

1. Make sure MySQL is running:
   - **Windows**: Check Services (`services.msc`) → look for "MySQL80"
   - **Docker**: Run `docker ps` to check the MySQL container
2. Verify your `DATABASE_URL` in `backend/.env`:
   ```
   DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/tks_tracking"
   ```
3. If your password contains `@`, encode it as `%40` in the URL:
   ```
   DATABASE_URL="mysql://root:Sai%401234@localhost:3306/tks_tracking"
   ```
4. Make sure the database exists:
   ```sql
   CREATE DATABASE IF NOT EXISTS tks_tracking;
   ```
</details>

<details>
<summary><strong>❌ Port 3000 or 5000 already in use</strong></summary>

**Windows (PowerShell):**
```powershell
# Find what's using port 5000
Get-NetTCPConnection -LocalPort 5000 | Format-List

# Kill the process
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force
```

**Or just run `stop.bat`** which handles this automatically.
</details>

<details>
<summary><strong>❌ "Access Denied" when logging in</strong></summary>

This means your email is not in the database. Ask an Admin to add you via the Members panel, or check if you're in the seed file (`backend/prisma/seed.js`).
</details>

<details>
<summary><strong>❌ Microsoft login not working / redirect loop</strong></summary>

1. For **local development**, set both files to bypass mode:
   - `backend/.env`: `BYPASS_MICROSOFT_AUTH="true"`
   - `frontend/.env`: `VITE_BYPASS_MICROSOFT_AUTH="true"`
2. Restart both servers after changing `.env` files
3. For production, verify your Azure AD app registration has the correct redirect URI
</details>

<details>
<summary><strong>❌ "npm run dev" shows errors</strong></summary>

1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules backend/node_modules frontend/node_modules
   npm run install:all
   ```
2. Make sure you're using Node.js v18 or v20:
   ```bash
   node -v
   ```
</details>

<details>
<summary><strong>❌ Prisma errors after pulling new code</strong></summary>

If the database schema has changed, you need to re-run migrations:
```bash
cd backend
npx prisma generate
npx prisma migrate dev
cd ..
```
</details>

---

## Contributing

### Development Workflow

1. **Pull latest code**: `git pull origin main`
2. **Install dependencies**: `npm run install:all`
3. **Run migrations**: `cd backend && npx prisma migrate dev && cd ..`
4. **Start dev servers**: `npm run dev` (or `start.bat`)
5. **Make your changes** and test locally
6. **Commit and push** your changes

### Key Development Commands

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Start both frontend & backend dev servers |
| `npm run dev:backend` | Start only the backend |
| `npm run dev:frontend` | Start only the frontend |
| `npm run install:all` | Install all dependencies (root + backend + frontend) |
| `cd backend && npx prisma studio` | Open Prisma Studio — visual database editor in browser |
| `cd backend && npx prisma migrate dev --name <name>` | Create a new database migration |
| `cd backend && npm run db:seed` | Re-run the database seeder |

---

## License

This is a proprietary internal project of **Techknomatic Solutions Pvt. Ltd.** For internal use only.

---

<p align="center">
  <strong>Built with ❤️ by the TKS Engineering Team</strong>
</p>
