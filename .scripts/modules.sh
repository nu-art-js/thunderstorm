#!/bin/bash

projectModules=(
  app-backend
  app-frontend
)

projectLibraries=(
  ${thunderstormLibraries[@]}
  app-shared
  test-backend
)

testServiceAccount=../.trash/test-account.json
