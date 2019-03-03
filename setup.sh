#!/bin/bash

source ./_modules.sh
source ./dev-tools/scripts/_core-tools/_source.sh

modulePackageName=()
moduleVersion=()

function processModule() {
    function npmLinkModule() {
        packageName=`cat package.json | grep '"name":' | sed -E "s/.*\"name\".*\"(.*)\",?/\1/"`
        version=`cat package.json | grep '"version":' | sed -E "s/.*\"version\".*\"(.*)\",?/\1/"`
        modulePackageName+=(${packageName})
        moduleVersion+=(${version})

        logInfo "Linking package: ${packageName} -> ${module}"
        npm link
    }

    function cleanPackageJson() {
        logInfo "Backup & Cleaning up package.json"
        cp package.json _package.json
        for moduleName in "${modulePackageName[@]}"; do
            local escapedModuleName=${moduleName/\//\\/}

            if [[ "$(uname -v)" =~ "Darwin" ]]; then
                sed -i '' "/${escapedModuleName}/d" package.json
            else
                sed -i "/${escapedModuleName}/d" package.json
            fi
        done
    }

    function restorePackageJson() {
        logInfo "Restore package.json"
        rm package.json
        mv _package.json package.json
    }

    function linkLibraries() {
        logInfo "Link libraries"
        for (( arg=0; arg<${#modules[@]}; arg+=1 )); do
            if [[ "${module}" == "${modules[${arg}]}" ]];then break; fi
            echo npm link ${modulePackageName[${arg}]}
            npm link ${modulePackageName[${arg}]}
        done
    }

    local module=${1}
    logInfo "processing module: ${module}"
    cd ${module}

        cleanPackageJson

        npmLinkModule
        npm install
        restorePackageJson

        linkLibraries
    cd ..
}

for module in "${modules[@]}"; do
    processModule ${module}
done
