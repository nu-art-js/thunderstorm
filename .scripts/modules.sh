#!/bin/bash

projectModules=(app-backend app-frontend)
projectLibraries=(ts-common testelot firebase thunderstorm db-api-generator storm live-docs user-account permissions app-shared push-pub-sub bug-report)
thunderstormLibraries=(ts-common testelot firebase thunderstorm db-api-generator storm live-docs user-account permissions push-pub-sub bug-report)

testServiceAccount=../.trash/test-account.json
