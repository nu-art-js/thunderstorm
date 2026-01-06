#!/bin/bash
# Build and push container image to Artifact Registry

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Build and Push Container Image ==="
echo ""

# Load configuration
CONFIG_FILE="${TEST_DIR}/config/test-config.env"
if [ ! -f "${CONFIG_FILE}" ]; then
  echo "ERROR: Config file not found: ${CONFIG_FILE}"
  exit 1
fi

source "${CONFIG_FILE}"

# Validate required variables
REQUIRED_VARS=(
  "GCP_PROJECT_ID"
  "ARTIFACT_REGISTRY_REGION"
  "ARTIFACT_REGISTRY_REPOSITORY"
  "IMAGE_NAME"
  "IMAGE_TAG"
)

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "ERROR: Required variable ${VAR} is not set in config"
    exit 1
  fi
done

# Build image references
IMAGE_REFERENCE="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
IMAGE_REFERENCE_LATEST="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}:latest"

echo "Configuration:"
echo "  Project: ${GCP_PROJECT_ID}"
echo "  Region: ${ARTIFACT_REGISTRY_REGION}"
echo "  Repository: ${ARTIFACT_REGISTRY_REPOSITORY}"
echo "  Image Name: ${IMAGE_NAME}"
echo "  Image Tag: ${IMAGE_TAG}"
echo ""
echo "Image References:"
echo "  Tagged: ${IMAGE_REFERENCE}"
echo "  Latest: ${IMAGE_REFERENCE_LATEST}"
echo ""

# Verify test-function is compiled
if [ ! -f "${TEST_DIR}/test-function/dist/index.js" ]; then
  echo "ERROR: test-function/dist/index.js not found. Run setup.sh first"
  exit 1
fi

# Copy Dockerfile to test-function directory for build context
echo "Preparing build context..."
cp "${TEST_DIR}/docker/Dockerfile" "${TEST_DIR}/test-function/Dockerfile"
cp "${TEST_DIR}/docker/.dockerignore" "${TEST_DIR}/test-function/.dockerignore" 2>/dev/null || true

# Build and push using Cloud Build
echo ""
echo "Building and pushing image using Cloud Build..."
echo "This may take a few minutes..."
echo ""

cd "${TEST_DIR}/test-function"

# Hard-coded labels - build timestamp for second label
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

gcloud builds submit \
  --config="${TEST_DIR}/cloudbuild/cloudbuild.yaml" \
  --substitutions=_IMAGE_REFERENCE=${IMAGE_REFERENCE},_IMAGE_REFERENCE_LATEST=${IMAGE_REFERENCE_LATEST},_DOCKERFILE_PATH=Dockerfile,_BUILD_TIMESTAMP=${BUILD_TIMESTAMP} \
  --project="${GCP_PROJECT_ID}" \
  .

BUILD_EXIT_CODE=$?

# Cleanup copied files
rm -f "${TEST_DIR}/test-function/Dockerfile"
rm -f "${TEST_DIR}/test-function/.dockerignore"

if [ ${BUILD_EXIT_CODE} -eq 0 ]; then
  echo ""
  echo "=== Build Complete ==="
  echo ""
  echo "Image pushed successfully:"
  echo "  ${IMAGE_REFERENCE}"
  echo "  ${IMAGE_REFERENCE_LATEST}"
  echo ""
  echo "Next step: Run ./scripts/deploy-function.sh <function-name>"
else
  echo ""
  echo "=== Build Failed ==="
  echo "Exit code: ${BUILD_EXIT_CODE}"
  exit ${BUILD_EXIT_CODE}
fi

