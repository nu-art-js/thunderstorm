#!/bin/bash
# Setup script for manual container deployment test environment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Manual Container Deployment Test - Setup ==="
echo ""

# Check if config file exists
CONFIG_FILE="${TEST_DIR}/config/test-config.env"
if [ ! -f "${CONFIG_FILE}" ]; then
  echo "ERROR: Config file not found: ${CONFIG_FILE}"
  echo "Please copy config/test-config.env.example to config/test-config.env and configure it"
  exit 1
fi

# Load configuration
source "${CONFIG_FILE}"

echo "Configuration loaded:"
echo "  Project: ${GCP_PROJECT_ID}"
echo "  Region: ${ARTIFACT_REGISTRY_REGION}"
echo "  Repository: ${ARTIFACT_REGISTRY_REPOSITORY}"
echo "  Image: ${IMAGE_NAME}"
echo ""

# Check gcloud is installed
if ! command -v gcloud &> /dev/null; then
  echo "ERROR: gcloud CLI is not installed"
  exit 1
fi

echo "✓ gcloud CLI found"

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  echo "ERROR: No active gcloud authentication found"
  echo "Run: gcloud auth login"
  exit 1
fi

echo "✓ gcloud authentication verified"

# Check project is set
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ "${CURRENT_PROJECT}" != "${GCP_PROJECT_ID}" ]; then
  echo "WARNING: Current gcloud project (${CURRENT_PROJECT}) doesn't match config (${GCP_PROJECT_ID})"
  echo "Run: gcloud config set project ${GCP_PROJECT_ID}"
fi

# Check required APIs
echo ""
echo "Checking required APIs..."
APIS=(
  "cloudbuild.googleapis.com"
  "artifactregistry.googleapis.com"
  "run.googleapis.com"
  "cloudfunctions.googleapis.com"
)

for API in "${APIS[@]}"; do
  if gcloud services list --enabled --filter="name:${API}" --format="value(name)" | grep -q "${API}"; then
    echo "✓ ${API} enabled"
  else
    echo "⚠ ${API} not enabled. Enable with: gcloud services enable ${API}"
  fi
done

# Setup test-function directory
echo ""
echo "Setting up test-function..."
cd "${TEST_DIR}/test-function"

# Install dependencies
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
else
  echo "✓ Dependencies already installed"
fi

# Compile TypeScript
echo "Compiling TypeScript..."
npm run build

if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
  echo "ERROR: TypeScript compilation failed or dist/index.js not found"
  exit 1
fi

echo "✓ TypeScript compiled successfully"

# Verify exported functions exist
echo ""
echo "Verifying exported functions..."
FUNCTIONS=$(echo "${FUNCTION_NAMES}" | tr ',' ' ')
for FUNC in ${FUNCTIONS}; do
  if grep -q "export const ${FUNC}" dist/index.js; then
    echo "✓ Function '${FUNC}' found in compiled code"
  else
    echo "⚠ Function '${FUNC}' not found in compiled code"
  fi
done

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Review config/test-config.env"
echo "  2. Run: ./scripts/build-image.sh"
echo "  3. Run: ./scripts/deploy-function.sh <function-name>"

