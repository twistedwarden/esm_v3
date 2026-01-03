# GoServePH ESM v3 – Setup Guide

This repository contains the GoServePH Education Support Management (ESM) System v3, featuring a high-performance microservices architecture.

## Architecture
- **GSM (Frontend)**: React (Vite) application using Tailwind CSS, React Router, and Zustand.
- **Auth Service**: Laravel API for central authentication, user roles, and security.
- **Scholarship Service**: Laravel API managing scholarship categories, subcategories, and applications.
- **Aid Service**: Laravel API handling school aid distribution, processing, and disbursements.
- **Monitoring Service**: Laravel API for system logs, audit trails, and health monitoring.

## Prerequisites
- **Node.js**: 18.0.0 or higher
- **PHP**: 8.2.0 or higher
- **Composer**: 2.0 or higher
- **MySQL**: 8.0 or higher (Recommended)
- **Redis**: 6.0 or higher (Required for caching, sessions, and queues)
- **Environment**: Bash (Linux/macOS) or PowerShell (Windows)

## Installation & Setup

### 1) Clone and Install Global Dependencies
```bash
git clone <repository-url> esm-v3
cd esm-v3
npm run install:all
```
*Tip: `npm run install:all` handles `npm install` for the root and frontend, and `composer install` for all 4 microservices.*

### 2) Environment Configuration
Each service in the `microservices/` directory needs a `.env` file. You can initialize them using the provided `.env.example` files.

For **each** service (`auth_service`, `scholarship_service`, `aid_service`, `monitoring_service`):
```bash
cd microservices/<service_name>
cp .env.example .env
php artisan key:generate
```

### 3) Database & Redis Setup
Prior to running migrations, ensure you have created the following databases in your MySQL server:
- `auth_service`
- `scholarship_service`
- `aid_service`
- `monitoring_service`

Ensure your Redis server is running and the connection details in each service's `.env` match your environment.

### 4) Run Migrations & Seeding
Execute the following for each service:

**Auth Service (8000):**
```bash
cd microservices/auth_service
php artisan migrate --seed
```

**Scholarship Service (8001):**
```bash
cd ../scholarship_service
php artisan migrate --seed
```

**Aid Service (8002):**
```bash
cd ../aid_service
php artisan migrate --seed
```

**Monitoring Service (8003):**
```bash
cd ../monitoring_service
php artisan migrate --seed
```

## Seeded Accounts (Development)

Use these credentials to test different system roles:

| Role | ID | Email | Password |
|------|----|-------|----------|
| **System Administrator** | 100 | `cursorai626@gmail.com` | `admin123` |
| **SSC Chairperson (Final Approval)** | 1 | `twistedwarden626@gmail.com` | `password123` |
| **Document Verification** | 2 | `kishaia1871@gmail.com` | `password123` |
| **Financial Review** | 5 | `jheyjheypogi30@gmail.com` | `password123` |
| **Academic Review** | 8 | `yvonnebarotilla16@gmail.com` | `password123` |

## Running the Application

Start all services concurrently from the root directory:

```bash
npm run dev:all
```

### Direct Access
- **Frontend (GSM)**: [http://localhost:5173](http://localhost:5173)
- **Auth API**: `http://localhost:8000`
- **Scholarship API**: `http://localhost:8001`
- **Aid API**: `http://localhost:8002`
- **Monitoring API**: `http://localhost:8003`

## Project Structure
```
esm-v3/
├── GSM/                       # React Frontend (Vite)
│   ├── src/admin/             # Admin Module Components
│   ├── src/services/          # API Services & Stores
│   └── public/                # Assets & Icons
├── microservices/
│   ├── auth_service/          # Auth & User Management
│   ├── scholarship_service/   # Programs & Applications
│   ├── aid_service/           # Financial Aid & Disbursements
│   └── monitoring_service/    # Logs & Audit Trails
├── package.json               # Global scripts & orchestration
└── README.md                  # This guide
```

## Troubleshooting
- **Redis Connection Failures**: Check that the `REDIS_HOST` and `REDIS_PORT` in your `.env` files are correct. Use `predis` as the client.
- **MySQL Connection**: Ensure the database names match the `.env` settings and the user has sufficient permissions.
- **CORS Issues**: Ensure `.env` files have `CORS_ALLOWED_ORIGINS=http://localhost:5173`.
- **Node Modules**: If you encounter Vite errors, try deleting `GSM/node_modules` and running `npm install` inside the `GSM/` directory.

## License
Proprietary – GoServePH Internal Development.
