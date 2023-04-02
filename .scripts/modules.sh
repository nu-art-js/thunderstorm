#!/bin/bash

FIREBASE_PKG_VERSION="~9.16.0"
FIREBASE_AUTH_PKG_VERSION="0.21.5"
FIREBASE_ADMIN_PKG_VERSION="^11.5.0"
FIREBASE_FUNCTIONS_PKG_VERSION="^4.2.0"

REACT_PKG_VERSION="^18.2.0"
REACT_DOM_PKG_VERSION="^18.2.0"
REACT_ROUTER_DOM_PKG_VERSION="^6.9.0"

REACT_TYPES_VERSION="^18.0.29"
REACT_DOM_TYPES_VERSION="^18.0.11"
REACT_ROUTER_TYPES_VERSION="^5.1.20"
REACT_ROUTER_DOM_TYPES_VERSION="^5.3.3"

QS_TYPES_VERSION="^6.5.2"
NODE_TYPES_VERSION="^18.15.0"
EXPRESS_PKG_VERSION="^4.18.2"
EXPRESS_TYPES_VERSION="^4.17.0"
EXPRESS_SERVE_STATIC_CORE_TYPES_VERSION="^4.17.0"

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
