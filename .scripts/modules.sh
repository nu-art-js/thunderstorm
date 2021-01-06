#!/bin/bash

projectModules=(
  #  app-backend
  #  app-frontend
)
thunderstormLibraries=(ts-common)
projectLibs=(
  ts-common
  #  ${thunderstormLibraries[@]}
  #  app-shared
)

testServiceAccount=../.trash/test-account.json
