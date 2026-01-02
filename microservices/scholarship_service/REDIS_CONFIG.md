# Redis Configuration for ESM v3 Microservices
# Copy relevant sections to your .env file

# ===========================================
# REDIS CONNECTION
# ===========================================
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# ===========================================
# SERVICE-SPECIFIC DATABASE NUMBERS
# ===========================================
# auth_service: REDIS_DB=0, REDIS_CACHE_DB=1
# scholarship_service: REDIS_DB=2, REDIS_CACHE_DB=3
# aid_service: REDIS_DB=4, REDIS_CACHE_DB=5
# monitoring_service: REDIS_DB=6, REDIS_CACHE_DB=7

# For scholarship_service:
REDIS_DB=2
REDIS_CACHE_DB=3

# ===========================================
# ENABLE REDIS FOR CACHE, QUEUE, SESSION
# ===========================================
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# ===========================================
# CACHE PREFIX (unique per service)
# ===========================================
CACHE_PREFIX=scholarship_service_cache_
