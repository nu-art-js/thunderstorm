#!/bin/bash

projectModules=(
  app-backend
  app-frontend
)

projectLibs=(
  ${thunderstormLibraries[@]}
  app-shared
)

testServiceAccount=../.trash/test-account.json
