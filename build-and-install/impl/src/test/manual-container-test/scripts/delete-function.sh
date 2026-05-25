#!/bin/bash
# Delete deployed function

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Check function name argument
if [ -z "$1" ]; then
  echo "Usage: $0 <function-name>"
  echo ""
  echo "Available functions from config:"
  if [ -f "${TEST_DIR}/config/test-config.env" ]; then
    source "${TEST_DIR}/config/test-config.env"
    echo "${FUNCTION_NAMES}" | tr ',' '\n' | sed 's/^/  - /'
  fi
  exit 1
fi

FUNCTION_NAME="$1"

echo "=== Delete Function: ${FUNCTION_NAME} ==="
echo ""

# Load configuration
CONFIG_FILE="${TEST_DIR}/config/test-config.env"
if [ ! -f "${CONFIG_FILE}" ]; then
  echo "ERROR: Config file not found: ${CONFIG_FILE}"
  exit 1
fi

source "${CONFIG_FILE}"

# Cloud Run service names cannot contain underscores, convert to dashes
SERVICE_NAME=$(echo "${FUNCTION_NAME}" | tr '_' '-')

echo "Configuration:"
echo "  Function: ${FUNCTION_NAME}"
echo "  Service name: ${SERVICE_NAME} (Cloud Run requires dashes, not underscores)"
echo "  Project: ${GCP_PROJECT_ID}"
echo "  Region: ${DEPLOY_REGION}"
echo ""

# Check if function exists
if gcloud run services describe "${SERVICE_NAME}" \
  --region="${DEPLOY_REGION}" \
  --project="${GCP_PROJECT_ID}" \
  --quiet 2>/dev/null; then
  echo "Function found. Deleting..."
else
  echo "Function not found or already deleted."
  exit 0
fi

# Delete function
gcloud run services delete "${SERVICE_NAME}" \
  --region="${DEPLOY_REGION}" \
  --project="${GCP_PROJECT_ID}" \
  --quiet

DELETE_EXIT_CODE=$?

if [ ${DELETE_EXIT_CODE} -eq 0 ]; then
  echo ""
  echo "=== Function Deleted ==="
  echo "Function '${FUNCTION_NAME}' has been removed"
else
  echo ""
  echo "=== Delete Failed ==="
  echo "Exit code: ${DELETE_EXIT_CODE}"
  exit ${DELETE_EXIT_CODE}
fi

