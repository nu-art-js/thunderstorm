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
    for (( arg=0; arg<${#modules[@]}; arg+=1 )); do
        npm link ${modulePackageName[${arg}]}
    done

    cp package.json _package.json
    for moduleName in "${modulePackageName[@]}"; do
        sed -i '' "/${moduleName/\//\\/}/d" package.json
    done

    npm install
    rm package.json
    mv _package.json package.json
cd ..