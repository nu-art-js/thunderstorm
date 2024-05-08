#!/bin/bash

source "$(folder.getRunningPath)/versions.sh"

tsLibs=(
  ts-common
  ts-styles
  google-services
  commando
  build-and-install
  firebase
  thunderstorm
  ts-pdf
  slack
  live-docs
  user-account
  permissions
  ts-short-url
  ts-dependency-viewer
  ts-focused-object
  ts-messaging
  ts-workspace
  push-pub-sub
  jira
  bug-report
  github
  file-upload
  ts-openai
  schema-to-types
)

projectLibs=(
)

backendApps=(
)

frontendApps=(
)

testServiceAccount=../.trash/test-account.json
