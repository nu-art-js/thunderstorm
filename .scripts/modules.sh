#!/bin/bash

PKG_VERSION_FIREBASE="^9.16.0"
PKG_VERSION_FIREBASE_ADMIN="^11.5.0"
PKG_VERSION_FIREBASE_FUNCTIONS="^4.2.0"

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
