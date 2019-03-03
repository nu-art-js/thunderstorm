#!/bin/bash

source ./_modules.sh

modulePackageName=()
moduleVersion=()

for module in "${modules[@]}"; do
    cd ${module}
        npm install
        npm link
        packageName=`cat package.json | grep '"name":' | sed -E "s/.*\"name\".*\"(.*)\",?/\1/"`
        version=`cat package.json | grep '"version":' | sed -E "s/.*\"version\".*\"(.*)\",?/\1/"`
        modulePackageName+=(${packageName})
        moduleVersion+=(${version})
    cd ..
done

cd ${projectModule}
    cp package.json _package.json
    for moduleName in "${modulePackageName[@]}"; do
        if [[ "$(uname -v)" =~ "Darwin" ]]; then
            sed -i '' "/${moduleName/\//\\/}/d" package.json
        else
            sed -i "/${moduleName/\//\\/}/d" package.json
        fi
    done

    npm install
    rm package.json
    mv _package.json package.json

    for (( arg=0; arg<${#modules[@]}; arg+=1 )); do
        echo npm link ${modulePackageName[${arg}]}
        npm link ${modulePackageName[${arg}]}
    done
cd ..