#!/bin/bash
# Inspect container image labels in Artifact Registry without pulling the image

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== Inspect Container Image Labels from Artifact Registry ==="
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

# Build image reference
IMAGE_REFERENCE="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
REGISTRY_HOST="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev"
REPO_PATH="${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}"

echo "Image: ${IMAGE_REFERENCE}"
echo ""

# Method 1: Try using Docker Registry API v2 to fetch manifest and config
echo "=== Fetching labels from Artifact Registry (Docker Registry API) ==="
echo ""

# Get access token for Artifact Registry
echo "Authenticating with Artifact Registry..."
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)
if [ -z "${ACCESS_TOKEN}" ]; then
  echo "ERROR: Failed to get access token. Make sure you're authenticated with gcloud."
  exit 1
fi

# Get manifest
echo "Fetching image manifest..."
MANIFEST_URL="https://${REGISTRY_HOST}/v2/${REPO_PATH}/${IMAGE_NAME}/manifests/${IMAGE_TAG}"
MANIFEST=$(curl -s -f -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.docker.distribution.manifest.v2+json" \
  "${MANIFEST_URL}" 2>/dev/null)

if [ $? -ne 0 ] || [ -z "${MANIFEST}" ]; then
  echo "ERROR: Failed to fetch manifest"
  echo "Trying fallback method with Docker..."
  echo ""
  
  # Fallback to Docker if available
  if command -v docker &> /dev/null; then
    echo "=== Fallback: Using Docker ==="
    echo "Pulling image to inspect labels..."
    if docker pull "${IMAGE_REFERENCE}" > /dev/null 2>&1; then
      echo "Labels:"
      docker inspect "${IMAGE_REFERENCE}" --format='{{json .Config.Labels}}' | python3 -m json.tool 2>/dev/null || docker inspect "${IMAGE_REFERENCE}" --format='{{json .Config.Labels}}'
      echo ""
      exit 0
    else
      echo "ERROR: Could not pull image with Docker either"
      exit 1
    fi
  else
    exit 1
  fi
fi

# Extract config digest from manifest
CONFIG_DIGEST=$(echo "${MANIFEST}" | python3 -c "
import json
import sys
try:
    manifest = json.load(sys.stdin)
    config_digest = manifest.get('config', {}).get('digest', '')
    if config_digest:
        print(config_digest)
    else:
        print('ERROR: No config digest found in manifest', file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print(f'ERROR parsing manifest: {e}', file=sys.stderr)
    sys.exit(1)
" 2>&1)

EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ] || [ -z "${CONFIG_DIGEST}" ]; then
  echo "ERROR: Could not extract config digest from manifest"
  echo "${CONFIG_DIGEST}"
  exit 1
fi

# Fetch config blob
echo "Fetching image config..."
CONFIG_URL="https://${REGISTRY_HOST}/v2/${REPO_PATH}/${IMAGE_NAME}/blobs/${CONFIG_DIGEST}"
# Follow redirects and use proper headers for Artifact Registry
CONFIG_JSON=$(curl -s -L -f -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Accept: application/vnd.docker.container.image.v1+json" \
  "${CONFIG_URL}" 2>/dev/null)

if [ $? -ne 0 ] || [ -z "${CONFIG_JSON}" ] || echo "${CONFIG_JSON}" | grep -q "<!DOCTYPE html>"; then
  echo "ERROR: Failed to fetch config blob (may need different auth method)"
  echo "Trying alternative: using Docker to pull and inspect..."
  echo ""
  
  # Fallback to Docker
  if command -v docker &> /dev/null; then
    echo "=== Fallback: Using Docker ==="
    echo "Pulling image to inspect labels..."
    if docker pull "${IMAGE_REFERENCE}" > /dev/null 2>&1; then
      echo "Labels:"
      docker inspect "${IMAGE_REFERENCE}" --format='{{json .Config.Labels}}' | python3 -m json.tool 2>/dev/null || docker inspect "${IMAGE_REFERENCE}" --format='{{json .Config.Labels}}'
      echo ""
      exit 0
    else
      echo "ERROR: Could not pull image with Docker either"
      exit 1
    fi
  else
    exit 1
  fi
fi

# Extract labels from config
echo ""
echo "=== Image Labels ==="
LABELS_OUTPUT=$(echo "${CONFIG_JSON}" | python3 -c "
import json
import sys
try:
    config = json.load(sys.stdin)
    labels = config.get('config', {}).get('Labels', {})
    if labels:
        print(json.dumps(labels, indent=2))
    else:
        print('No labels found in image')
        sys.exit(0)
except Exception as e:
    print(f'ERROR parsing config: {e}', file=sys.stderr)
    print(f'Config JSON (first 500 chars): {str(config)[:500]}', file=sys.stderr)
    sys.exit(1)
" 2>&1)

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "${LABELS_OUTPUT}"
else
  echo "ERROR: Failed to parse labels from config"
  echo "${LABELS_OUTPUT}"
  exit 1
fi

echo ""

# Show alternative method
if command -v docker &> /dev/null; then
  echo "=== Alternative: Using Docker ==="
  echo "You can also inspect with Docker after pulling:"
  echo "  docker pull ${IMAGE_REFERENCE}"
  echo "  docker inspect ${IMAGE_REFERENCE} --format='{{json .Config.Labels}}' | python3 -m json.tool"
  echo ""
fi