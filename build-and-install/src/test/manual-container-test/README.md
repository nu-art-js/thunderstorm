# Manual Container Deployment Test Environment

## Overview

This is a fully isolated, self-contained test environment for manually testing container image build and deployment for Firebase Functions. It is completely decoupled from the BAI build system and can be used independently to experiment with container deployment configurations.

## Prerequisites

Before using this test environment, ensure you have:

1. **gcloud CLI installed and authenticated**
   ```bash
   gcloud --version
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Required GCP APIs enabled**
   - Cloud Build API (`cloudbuild.googleapis.com`)
   - Artifact Registry API (`artifactregistry.googleapis.com`)
   - Cloud Run API (`run.googleapis.com`)
   - Cloud Functions API (`cloudfunctions.googleapis.com`)
   
   Enable them with:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable cloudfunctions.googleapis.com
   ```

3. **Artifact Registry repository created**
   ```bash
   gcloud artifacts repositories create REPOSITORY_NAME \
     --repository-format=docker \
     --location=REGION \
     --project=PROJECT_ID
   ```

4. **Required IAM permissions**
   - Cloud Build Service Account: `PROJECT_NUMBER@cloudbuild.gserviceaccount.com`
   - Artifact Registry Writer
   - Cloud Run Admin
   - Service Account User

## Quick Start

1. **Configure the environment**
   ```bash
   cd _thunderstorm/build-and-install/src/test/manual-container-test
   cp config/test-config.env.example config/test-config.env
   # Edit config/test-config.env with your values
   ```

2. **Run setup**
   ```bash
   ./scripts/setup.sh
   ```

3. **Build and push image**
   ```bash
   ./scripts/build-image.sh
   ```

4. **Deploy function**
   ```bash
   ./scripts/deploy-function.sh manual_hello
   ```

5. **Test function**
   ```bash
   # Get the function URL from the deploy output, then:
   curl https://YOUR_FUNCTION_URL
   ```

6. **Cleanup**
   ```bash
   ./scripts/cleanup.sh
   ```

## Configuration

All configuration is centralized in `config/test-config.env`. Source this file in your scripts or export the variables.

### Configuration Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `GCP_PROJECT_ID` | Your GCP project ID | `nu-art-thunderstorm-test` |
| `ARTIFACT_REGISTRY_REGION` | Region for Artifact Registry | `us-central1` |
| `ARTIFACT_REGISTRY_REPOSITORY` | Repository name in Artifact Registry | `firebase-functions` |
| `IMAGE_NAME` | Docker image name (must match Artifact Registry naming) | `manual-test-function` |
| `IMAGE_TAG` | Image tag/version | `v1.0.0` or `latest` |
| `DEPLOY_REGION` | Region for function deployment | `us-central1` |
| `FUNCTION_NAMES` | Comma-separated list of function names | `manual_hello,manual_goodbye` |

### Image Reference Format

The full image reference is constructed as:
```
{ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/{GCP_PROJECT_ID}/{ARTIFACT_REGISTRY_REPOSITORY}/{IMAGE_NAME}:{IMAGE_TAG}
```

Example:
```
us-central1-docker.pkg.dev/nu-art-thunderstorm-test/firebase-functions/manual-test-function:latest
```

## Testing Workflow

### 1. Build Image

**Script**: `scripts/build-image.sh`

**What it does**:
- Compiles TypeScript source code
- Builds Docker image using Cloud Build
- Tags image with both specified tag and `latest`
- Pushes to Artifact Registry

**Expected Results**:
- TypeScript compilation succeeds
- Docker image built successfully
- Image pushed to Artifact Registry with tags: `{IMAGE_TAG}` and `latest`
- Output shows image reference

**Manual Command**:
```bash
cd test-function
npm run build
cd ..
gcloud builds submit \
  --config=cloudbuild/cloudbuild.yaml \
  --substitutions=IMAGE_REFERENCE=${IMAGE_REFERENCE},DOCKERFILE_PATH=docker/Dockerfile \
  --project=${GCP_PROJECT_ID} \
  test-function
```

### 2. Deploy Function

**Script**: `scripts/deploy-function.sh <function-name>`

**What it does**:
- Validates image exists in Artifact Registry
- Deploys function using `gcloud run deploy`
- Sets `FUNCTION_TARGET` environment variable
- Configures HTTP trigger and allows unauthenticated access
- Outputs function URL

**Expected Results**:
- Function deployed successfully
- Function URL displayed in output
- Function accessible via HTTP
- `FUNCTION_TARGET` environment variable set correctly

**Manual Command**:
```bash
gcloud run deploy ${FUNCTION_NAME} \
  --image=${IMAGE_REFERENCE} \
  --region=${DEPLOY_REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --project=${GCP_PROJECT_ID} \
  --set-env-vars=FUNCTION_TARGET=${FUNCTION_NAME}
```

### 3. Test Function

**What to do**:
- Use the function URL from deployment output
- Make HTTP request to the function
- Verify response contains expected JSON

**Expected Results**:
- HTTP 200 response
- JSON response with function data
- Response includes deployment ID or other identifying information

**Manual Command**:
```bash
curl https://${FUNCTION_NAME}-XXXXX-${REGION}.a.run.app
```

### 4. Delete Function

**Script**: `scripts/delete-function.sh <function-name>`

**What it does**:
- Deletes the Cloud Run service (function)
- Handles errors gracefully if function doesn't exist

**Expected Results**:
- Function deleted successfully
- No error if function already deleted

**Manual Command**:
```bash
gcloud run services delete ${FUNCTION_NAME} \
  --region=${DEPLOY_REGION} \
  --project=${GCP_PROJECT_ID} \
  --quiet
```

## Expected Results

### Build Phase
- ✅ TypeScript compiles without errors
- ✅ Docker image builds successfully
- ✅ Image tagged with both `{IMAGE_TAG}` and `latest`
- ✅ Image pushed to Artifact Registry
- ✅ Image reference output: `{REGION}-docker.pkg.dev/{PROJECT}/{REPO}/{IMAGE}:{TAG}`

### Deploy Phase
- ✅ Function deployed to Cloud Run
- ✅ Function URL generated: `https://{FUNCTION}-{HASH}-{REGION}.a.run.app`
- ✅ `FUNCTION_TARGET` environment variable set
- ✅ Function accessible without authentication

### Test Phase
- ✅ HTTP request returns 200 OK
- ✅ Response contains expected JSON structure
- ✅ Function executes correctly

### Delete Phase
- ✅ Function removed from Cloud Run
- ✅ No resources remaining

## Troubleshooting

### Container Fails to Start

**Error**: `The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable`

**Solutions**:
1. Verify Dockerfile uses `functions-framework` correctly
2. Check that `FUNCTION_TARGET` is set correctly
3. Ensure the function is exported in `dist/index.js`
4. Check Cloud Run logs for detailed errors

### Image Not Found

**Error**: `Image not found in Artifact Registry`

**Solutions**:
1. Verify image was built and pushed successfully
2. Check image reference format matches exactly
3. Verify you have read permissions on Artifact Registry
4. Check image exists: `gcloud artifacts docker images list ${IMAGE_REFERENCE}`

### Build Fails

**Error**: `Build failed` or `Permission denied`

**Solutions**:
1. Verify Cloud Build API is enabled
2. Check Cloud Build service account has Artifact Registry Writer role
3. Verify Dockerfile path is correct
4. Check build logs in Cloud Console

### Function Not Accessible

**Error**: `403 Forbidden` or connection timeout

**Solutions**:
1. Verify `--allow-unauthenticated` flag was used
2. Check IAM permissions on Cloud Run service
3. Verify function is deployed in the correct region
4. Check function logs for errors

## Manual Commands Reference

### Build Image
```bash
# Load config
source config/test-config.env

# Build image reference
IMAGE_REFERENCE="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"

# Compile TypeScript
cd test-function
npm install
npm run build
cd ..

# Submit build
gcloud builds submit \
  --config=cloudbuild/cloudbuild.yaml \
  --substitutions=IMAGE_REFERENCE=${IMAGE_REFERENCE},DOCKERFILE_PATH=docker/Dockerfile \
  --project=${GCP_PROJECT_ID} \
  test-function
```

### Deploy Function
```bash
# Load config
source config/test-config.env

# Build image reference
IMAGE_REFERENCE="${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME}:${IMAGE_TAG}"

# Deploy
gcloud run deploy ${FUNCTION_NAME} \
  --image=${IMAGE_REFERENCE} \
  --region=${DEPLOY_REGION} \
  --platform=managed \
  --allow-unauthenticated \
  --project=${GCP_PROJECT_ID} \
  --set-env-vars=FUNCTION_TARGET=${FUNCTION_NAME}
```

### Delete Function
```bash
# Load config
source config/test-config.env

# Delete
gcloud run services delete ${FUNCTION_NAME} \
  --region=${DEPLOY_REGION} \
  --project=${GCP_PROJECT_ID} \
  --quiet
```

### Verify Image Exists
```bash
gcloud artifacts docker images list \
  ${ARTIFACT_REGISTRY_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPOSITORY}/${IMAGE_NAME} \
  --project=${GCP_PROJECT_ID}
```

### View Function Logs
```bash
gcloud run services logs read ${FUNCTION_NAME} \
  --region=${DEPLOY_REGION} \
  --project=${GCP_PROJECT_ID}
```

## Parameters Reference

All parameters used in scripts and commands:

### Environment Variables (from config/test-config.env)
- `GCP_PROJECT_ID`: GCP project ID
- `ARTIFACT_REGISTRY_REGION`: Region for Artifact Registry (e.g., `us-central1`)
- `ARTIFACT_REGISTRY_REPOSITORY`: Repository name in Artifact Registry
- `IMAGE_NAME`: Docker image name (lowercase, alphanumeric with dots, underscores, hyphens)
- `IMAGE_TAG`: Image tag/version (alphanumeric with dots, underscores, hyphens, max 128 chars)
- `DEPLOY_REGION`: Region for function deployment (typically same as Artifact Registry region)
- `FUNCTION_NAMES`: Comma-separated list of function names (e.g., `manual_hello,manual_goodbye`)

### Derived Variables
- `IMAGE_REFERENCE`: Full image reference constructed from above variables
- `FUNCTION_TARGET`: Environment variable set during deployment to specify which function to invoke

### gcloud Command Flags
- `--gen2`: Use Cloud Functions Gen2 (not used with gcloud run deploy)
- `--region`: Region for deployment
- `--platform=managed`: Use fully managed Cloud Run
- `--allow-unauthenticated`: Allow HTTP access without authentication
- `--image`: Container image reference
- `--set-env-vars`: Set environment variables
- `--project`: GCP project ID
- `--quiet`: Suppress confirmation prompts
- `--config`: Cloud Build configuration file
- `--substitutions`: Cloud Build substitution variables

## Notes

- This test environment is completely isolated from BAI
- All scripts are standalone and can be run independently
- Configuration is centralized in `config/test-config.env`
- Scripts include error handling and validation
- All commands are documented for manual execution
- The environment can be cleaned up completely using `cleanup.sh`

