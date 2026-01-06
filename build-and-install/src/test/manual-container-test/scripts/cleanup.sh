#!/bin/bash
# Cleanup all resources created during testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Cleanup Test Resources ==="
echo ""

# Load configuration
CONFIG_FILE="${TEST_DIR}/config/test-config.env"
if [ ! -f "${CONFIG_FILE}" ]; then
  echo "ERROR: Config file not found: ${CONFIG_FILE}"
  exit 1
fi

source "${CONFIG_FILE}"

# Delete all functions
echo "Deleting deployed functions..."
FUNCTION_LIST=$(echo "${FUNCTION_NAMES}" | tr ',' ' ')
for FUNC in ${FUNCTION_LIST}; do
  echo ""
  echo "Checking function: ${FUNC}"
  if gcloud run services describe "${FUNC}" \
    --region="${DEPLOY_REGION}" \
    --project="${GCP_PROJECT_ID}" \
    --quiet 2>/dev/null; then
    echo "  Deleting ${FUNC}..."
    gcloud run services delete "${FUNC}" \
      --region="${DEPLOY_REGION}" \
      --project="${GCP_PROJECT_ID}" \
      --quiet
    echo "  ✓ Deleted"
  else
    echo "  ✓ Not found (already deleted)"
  fi
done

# Optionally delete images
echo ""
read -p "Delete container images from Artifact Registry? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  IMAGE_BASE="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}"
  
  echo "Deleting images..."
  for TAG in "${IMAGE_TAG}" "latest"; do
    IMAGE_REF="${IMAGE_BASE}:${TAG}"
    if gcloud artifacts docker images list "${IMAGE_REF}" --project="${GCP_PROJECT_ID}" 2>/dev/null | grep -q "${IMAGE_NAME}"; then
      echo "  Deleting ${IMAGE_REF}..."
      gcloud artifacts docker images delete "${IMAGE_REF}" \
        --project="${GCP_PROJECT_ID}" \
        --quiet 2>/dev/null || true
      echo "  ✓ Deleted"
    else
      echo "  ✓ ${IMAGE_REF} not found"
    fi
  done
else
  echo "Skipping image deletion"
fi

# Clean local build artifacts
echo ""
echo "Cleaning local build artifacts..."
cd "${TEST_DIR}/test-function"
if [ -d "dist" ]; then
  rm -rf dist
  echo "  ✓ Removed dist/"
fi
if [ -d "node_modules" ]; then
  read -p "Delete node_modules? (y/N): " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf node_modules
    echo "  ✓ Removed node_modules/"
  fi
fi

echo ""
echo "=== Cleanup Complete ==="

