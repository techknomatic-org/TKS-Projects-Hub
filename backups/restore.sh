#!/bin/bash
# Database restore script for Unix/Linux/Docker

BACKUP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file.sql>"
  echo "Available backups in ${BACKUP_DIR}:"
  ls -1 "${BACKUP_DIR}"/*.sql 2>/dev/null
  exit 1
fi

BACKUP_FILE="$1"
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_PASSWORD:-Sai@1234}
DB_NAME=${DB_NAME:-tks_tracking}
DB_HOST=${DB_HOST:-localhost}

if [ ! -f "${BACKUP_FILE}" ]; then
  # Try matching filename in backups directory
  if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILE}"
  else
    echo "Error: Backup file ${BACKUP_FILE} not found."
    exit 1
  fi
fi

echo "=== TKS Database Restore Starting ==="
echo "Restoring ${BACKUP_FILE} to ${DB_NAME} on ${DB_HOST}..."

# Check if running in docker-compose
if docker ps --format '{{.Names}}' | grep -q "tks-mysql"; then
  echo "Detected running Docker container: tks-mysql. Restoring via Docker..."
  docker exec -i tks-mysql mysql -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < "${BACKUP_FILE}"
else
  echo "Running local restore..."
  mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" < "${BACKUP_FILE}"
fi

if [ $? -eq 0 ]; then
  echo "Database successfully restored!"
else
  echo "ERROR: Restore failed!"
  exit 1
fi
