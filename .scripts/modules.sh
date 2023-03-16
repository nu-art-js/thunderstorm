#!/bin/bash

FIREBASE_PKG_VERSION="^9.16.0"
FIREBASE_ADMIN_PKG_VERSION="^11.5.0"
FIREBASE_FUNCTIONS_PKG_VERSION="^4.2.0"

projectLibs=(
  app-shared
)

backendApps=(
  app-backend
)

frontendApps=(
  app-frontend
)

testServiceAccount=../.trash/test-account.json
