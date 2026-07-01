#!/bin/sh
set -e

if [ -z "$SERVICE_NAME" ]; then
  echo "ERROR: SERVICE_NAME environment variable is required"
  echo "Valid values: admin, loyalty-admin, loyalty-consumer, product-admin, product-consumer, user-admin, user-consumer, redistro"
  exit 1
fi

SERVICE_MAIN="dist/apps/${SERVICE_NAME}/src/main.js"

if [ ! -f "$SERVICE_MAIN" ]; then
  echo "ERROR: entrypoint not found: $SERVICE_MAIN"
  echo "Available services:"
  ls dist/apps/ 2>/dev/null || echo "  (no dist/ directory - was the build step run?)"
  exit 1
fi

echo "Starting ${SERVICE_NAME} service..."
exec node "$SERVICE_MAIN"
