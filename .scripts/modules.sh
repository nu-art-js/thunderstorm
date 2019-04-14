#!/bin/bash

boilerplateRepo="git@github.com:nu-art-js/typescript-boilerplate.git"

frontendModule=app-frontend
backendModule=app-backend
configEntryName="app.config"

projectModules=(app-backend app-frontend)
#projectModules=()

#otherModules=(app-common)
otherModules=()

nuArtModules=(nu-art-core nu-art-server nu-art-fronzy nu-art-test)
#nuArtModules=(nu-art-core nu-art-server nu-art-fronzy)
modules=()
