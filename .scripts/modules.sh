#!/bin/bash

projectModules=(app-backend app-frontend)
projectLibraries=(ts-common testelot firebase thunderstorm db-api-generator storm live-docs user-account permissions app-shared push-pub-sub)
thunderstormLibraries=(ts-common testelot firebase thunderstorm db-api-generator storm live-docs user-account permissions push-pub-sub)

testServiceAccount=../.trash/test-account.json
