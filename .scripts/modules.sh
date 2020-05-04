#!/bin/bash

projectModules=(
  app-backend
  app-frontend
)

thunderstormLibraries=(
  ts-common
  testelot
  firebase
  thunderstorm
  db-api-generator
  storm
  live-docs
  user-account
  permissions
  push-pub-sub
  bug-report
)

projectLibraries=(
  ${thunderstormLibraries[@]}
  app-shared
  test-backend
)

testServiceAccount=../.trash/test-account.json
