#!/bin/bash
# Deploy function using gcloud run deploy

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

echo "=== Deploy Function: ${FUNCTION_NAME} ==="
echo ""

# Load configuration
CONFIG_FILE="${TEST_DIR}/config/test-config.env"
if [ ! -f "${CONFIG_FILE}" ]; then
  echo "ERROR: Config file not found: ${CONFIG_FILE}"
  exit 1
fi

source "${CONFIG_FILE}"

# Validate function name is in config
FUNCTION_LIST=$(echo "${FUNCTION_NAMES}" | tr ',' ' ')
FUNCTION_FOUND=false
for FUNC in ${FUNCTION_LIST}; do
  if [ "${FUNC}" = "${FUNCTION_NAME}" ]; then
    FUNCTION_FOUND=true
    break
  fi
done

if [ "${FUNCTION_FOUND}" = "false" ]; then
  echo "ERROR: Function '${FUNCTION_NAME}' not found in FUNCTION_NAMES config"
  echo "Available functions: ${FUNCTION_NAMES}"
  exit 1
fi

# Cloud Run service names cannot contain underscores, convert to dashes
# But FUNCTION_TARGET must use the original function name (with underscore) as it's exported in code
SERVICE_NAME=$(echo "${FUNCTION_NAME}" | tr '_' '-')

# Build image reference (use latest tag for deployment)
IMAGE_REFERENCE="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}:latest"

echo "Configuration:"
echo "  Function: ${FUNCTION_NAME}"
echo "  Project: ${GCP_PROJECT_ID}"
echo "  Region: ${DEPLOY_REGION}"
echo "  Image: ${IMAGE_REFERENCE}"
echo ""

# Verify image exists
echo "Verifying image exists..."
if gcloud artifacts docker images list "${IMAGE_REFERENCE}" --project="${GCP_PROJECT_ID}" 2>/dev/null | grep -q "${IMAGE_NAME}"; then
  echo "✓ Image found in Artifact Registry"
else
  echo "⚠ Image not found. It may still be available, continuing..."
fi

# Deploy function
echo ""
echo "Deploying function..."
echo "  Service name: ${SERVICE_NAME} (Cloud Run requires dashes, not underscores)"
echo "  Function target: ${FUNCTION_NAME} (original function name for FUNCTION_TARGET)"
echo "This may take a few minutes..."
echo ""

gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_REFERENCE}" \
  --region="${DEPLOY_REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --project="${GCP_PROJECT_ID}" \
  --set-env-vars="FUNCTION_TARGET=${FUNCTION_NAME}"

DEPLOY_EXIT_CODE=$?

if [ ${DEPLOY_EXIT_CODE} -eq 0 ]; then
  echo ""
  echo "=== Deployment Complete ==="
  echo ""
  
  # Get function URL (use service name, not function name)
  FUNCTION_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --region="${DEPLOY_REGION}" \
    --project="${GCP_PROJECT_ID}" \
    --format="value(status.url)" 2>/dev/null || echo "")
  
  if [ -n "${FUNCTION_URL}" ]; then
    echo "Function URL: ${FUNCTION_URL}"
    echo ""
    echo "Test the function:"
    echo "  curl ${FUNCTION_URL}"
  else
    echo "Function deployed. Get URL with:"
    echo "  gcloud run services describe ${SERVICE_NAME} --region=${DEPLOY_REGION} --format='value(status.url)'"
  fi
else
  echo ""
  echo "=== Deployment Failed ==="
  echo "Exit code: ${DEPLOY_EXIT_CODE}"
  exit ${DEPLOY_EXIT_CODE}
fi

