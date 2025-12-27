---

### 📂 `auth_service/README.md` (dev only)

````md
# Auth Service (Development Stub)

This is a **stubbed version of Central Auth** for development and testing only.

## Responsibilities

-   Issues JWT access tokens with `isCitizen` and `roles`.
-   Allows creating/updating users with `is_citizen` flag in local DB.

## Tech Stack

-   Laravel
-   MySQL

## Environment Variables

| Name                    | Description                                   | Default               |
| ----------------------- | --------------------------------------------- | --------------------- |
| DB_HOST                 | Database host                                 | 127.0.0.1             |
| DB_PORT                 | Database port                                 | 3306                  |
| DB_USER                 | Database user                                 | root                  |
| DB_PASSWORD             | Database password                             |                       |
| DB_NAME                 | Database name                                 | auth_service          |
| JWT_SECRET              | Secret for signing JWT                        |                       |
| SCHOLARSHIP_SERVICE_URL | Scholarship service URL for staff integration | http://localhost:8002 |

## Running Locally

```bash
composer install
php artisan serve
```
````
