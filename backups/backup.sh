#!/bin/bash
# Database backup script for Unix/Linux/Docker

# Set variables
BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/tks_backup_${TIMESTAMP}.sql"

DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-Sai@1234}
DB_NAME=${DB_NAME:-tks_tracking}
DB_HOST=${DB_HOST:-localhost}

echo "=== TKS Database Backup Starting ==="
echo "Backing up ${DB_NAME} from ${DB_HOST} to ${BACKUP_FILE}..."

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Check if running in docker-compose
if docker ps --format '{{.Names}}' | grep -q "tks-mysql"; then
  echo "Detected running Docker container: tks-mysql. Backing up via Docker..."
  docker exec -t tks-mysql mysqldump -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" > "${BACKUP_FILE}"
else
  echo "Running local backup..."
  mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" > "${BACKUP_FILE}"
fi

if [ $? -eq 0 ]; then
  echo "Backup successfully completed: ${BACKUP_FILE}"
  # Retain only last 7 backups (8 * 24 hours)
  find "${BACKUP_DIR}" -name "tks_backup_*.sql" -type f -mtime +7 -delete
  echo "Old backups cleaned up."
else
  echo "ERROR: Backup failed!"
  exit 1
fi
