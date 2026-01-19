# Quick Start Guide

## First Time Setup

1. **Copy and configure**
   ```bash
   cd _thunderstorm/build-and-install/src/test/manual-container-test
   cp config/test-config.env.example config/test-config.env
   # Edit config/test-config.env with your GCP project details
   ```

2. **Run setup**
   ```bash
   ./scripts/setup.sh
   ```

## Testing Workflow

### Build Image
```bash
./scripts/build-image.sh
```

**Expected**: Image built and pushed to Artifact Registry with both `{TAG}` and `latest` tags.

### Deploy Function
```bash
./scripts/deploy-function.sh manual_hello
```

**Expected**: Function deployed, URL displayed.

### Test Function
```bash
# Use the URL from deploy output
curl https://manual-hello-XXXXX-us-central1.a.run.app
```

**Expected**: JSON response with function data.

### Delete Function
```bash
./scripts/delete-function.sh manual_hello
```

**Expected**: Function removed.

### Cleanup Everything
```bash
./scripts/cleanup.sh
```

**Expected**: All functions and optionally images deleted.

## Manual Commands (for experimentation)

### Build Image Manually
```bash
source config/test-config.env
IMAGE_REFERENCE="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"
IMAGE_REFERENCE_LATEST="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}:latest"

cd test-function
npm run build
cd ..

gcloud builds submit \
  --config=cloudbuild/cloudbuild.yaml \
  --substitutions=IMAGE_REFERENCE=${IMAGE_REFERENCE},IMAGE_REFERENCE_LATEST=${IMAGE_REFERENCE_LATEST},DOCKERFILE_PATH=docker/Dockerfile \
  --project=${GCP_PROJECT_ID} \
  test-function
```

### Deploy Function Manually
```bash
source config/test-config.env
IMAGE_REFERENCE="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}:latest"

gcloud run deploy manual_hello \
  --image=${IMAGE_REFERENCE} \
  --region=${DEPLOY_REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --project=${GCP_PROJECT_ID} \
  --set-env-vars=FUNCTION_TARGET=manual_hello
```

### Delete Function Manually
```bash
source config/test-config.env

gcloud run services delete manual_hello \
  --region=${DEPLOY_REGION} \
  --project=${GCP_PROJECT_ID} \
  --quiet
```

## Troubleshooting

### Container fails to start
- Check Cloud Run logs: `gcloud run services logs read manual_hello --region=${DEPLOY_REGION}`
- Verify `FUNCTION_TARGET` is set correctly
- Verify function is exported in `dist/index.js`

### Image not found
- Verify image exists: `gcloud artifacts docker images list ${IMAGE_REFERENCE}`
- Check image reference format matches exactly
- Verify Artifact Registry permissions

### Build fails
- Check Cloud Build logs in Cloud Console
- Verify Cloud Build API is enabled
- Verify service account has Artifact Registry Writer role

