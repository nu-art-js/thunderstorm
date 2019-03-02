#!/bin/bash

source ./_modules.sh

modulePackageName=()
moduleVersion=()

for module in "${modules[@]}"; do
    cd ${module}
        npm run build
    cd ..
done

cd ${projectModule}
    npm run build
cd ..
