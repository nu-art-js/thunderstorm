#!/bin/bash

source ./dev-tools/scripts/_core-tools/_source.sh
source ./_modules.sh

enforceBashVersion 4.4

setup=
purge=
unlink=
clean=
debug=
launch=
test=
deploy=
publish=
version=
build=true
linkDependencies=

function printHelp() {
    local pc="${BBlue}"
    local param="${BPurple}"
    local err="${BRed}"
    local dc="${Green}"
    local dcb="${BGreen}"
    local noColor="${NoColor}"

    logVerbose "   ${pc}--purge${noColor}"
    logVerbose "        ${dc}Will delete the node_modules folder in all modules${noColor}"
    logVerbose
    logVerbose "   ${pc}--unlink${noColor}"
    logVerbose "        ${dc}Unlink the dependencies sources${noColor}"
    logVerbose
    logVerbose "   ${pc}--clean${noColor}"
    logVerbose "        ${dc}Will delete the dist folder in all modules${noColor}"
    logVerbose
    logVerbose "   ${pc}--setup${noColor}"
    logVerbose "        ${dc}Will link all modules and create link dependencies${noColor}"
    logVerbose
    logVerbose "   ${pc}--no-build${noColor}"
    logVerbose "        ${dc}Skip the build${noColor}"
    logVerbose
    logVerbose "   ${pc}--test${noColor}"
    logVerbose "        ${dc}Run tests in all modules${noColor}"
    logVerbose
    logVerbose "   ${pc}--no-launch${noColor}"
    logVerbose "        ${dc}Will not launch${noColor}"
    logVerbose
    logVerbose "   ${pc}--publish${noColor}"
    logVerbose "        ${dc}Publish artifacts to npm${noColor}"
    logVerbose
    logVerbose "   ${pc}--version=< ${param}major${noColor} | ${param}minor${noColor} | ${param}patch${noColor} >${noColor}"
    logVerbose "        ${dc}Publish artifacts to npm${noColor}"
    logVerbose
    logVerbose "   ${pc}--dont-link${noColor}"
    logVerbose "        ${dc}Do not link dependencies from sources, use artifacts from npm${noColor}"
    logVerbose
    exit 0
}

function extractParams() {
    for paramValue in "${@}"; do
        case "${paramValue}" in
            "--debug")
                debug=true
            ;;

           "--purge")
                purge=true
                clean=true
            ;;

           "--unlink")
                setup=true
                unlinkDependencies=true
            ;;

           "--setup")
                setup=true
                linkDependencies=true
            ;;

            "--clean")
                clean=true
            ;;

            "--deploy")
                deploy=true
            ;;

            "--no-build")
                build=
            ;;

            "--test")
                test=true
            ;;

            "--no-launch")
                launch=
            ;;

            "--publish")
                publish=true
            ;;

            "--version="*)
                version=`echo "${paramValue}" | sed -E "s/--version=(.*)/\1/"`
            ;;

            "--help")
                printHelp
            ;;

            "*")
                logWarning "UNKNOWN PARAM: ${paramValue}";
            ;;
        esac
    done
}

signature
printCommand "$@"
extractParams "$@"

modulePackageName=()
moduleVersion=()

params=(setup purge clean debug launch test deploy build version linkDependencies)
printDebugParams ${debug} "${params[@]}"

function purgeModule() {
    rm -rf node_modules
}

function cleanModule() {
    rm -rf dist
}

function buildModule() {
    npm run build
}

function testModule() {
    npm run test
}

function npmLinkModule() {
    logInfo "Linking package: ${2} -> ${1}"
    npm link
}

function linkDependenciesImpl() {
    local module=${1}

    logInfo "Linking dependencies"
    for (( arg=0; arg<${#modules[@]}; arg+=1 )); do
        if [[ "${module}" == "${modules[${arg}]}" ]];then break; fi
        local moduleName="${modulePackageName[${arg}]}"

        logDebug "Linking library ${module} => ${moduleName}"
        npm link ${moduleName}
    done
}

function unlinkDependenciesImpl() {
    local module=${1}
    backupPackageJson

    logInfo "Un-linking dependencies  "
    for (( arg=0; arg<${#modules[@]}; arg+=1 )); do
        if [[ "${module}" == "${modules[${arg}]}" ]];then break; fi
        local moduleName="${modulePackageName[${arg}]}"

        logDebug "Un-linking library ${module} => ${moduleName}"
        npm unlink ${moduleName}
    done

    restorePackageJson
}

function backupPackageJson() {
    logInfo "Backup package.json"
    cp package.json _package.json
}

function restorePackageJson() {
    logInfo "Restore package.json"
    rm package.json
    mv _package.json package.json
}


function setupModule() {
    local module=${1}

    function cleanPackageJson() {
        logInfo "Cleaning up package.json"
        for (( arg=0; arg<${#modules[@]}; arg+=1 )); do
            if [[ "${module}" == "${modules[${arg}]}" ]]; then break; fi

            local moduleName="${modulePackageName[${arg}]}"
            local escapedModuleName=${moduleName/\//\\/}

            if [[ "$(uname -v)" =~ "Darwin" ]]; then
                sed -i '' "/${escapedModuleName}/d" package.json
            else
                sed -i "/${escapedModuleName}/d" package.json
            fi
        done
    }


    if [[ "${linkDependencies}" ]]; then
        backupPackageJson $@
        cleanPackageJson $@
        npmLinkModule $@
    fi

    npm install

    if [[ "${linkDependencies}" ]]; then
        restorePackageJson $@
        linkDependenciesImpl $@
    fi
}

function executeOnModules() {
    local toExecute=${1}
    for (( arg=0; arg<${#modules[@]}; arg+=1 )); do
        cd ${modules[${arg}]}
            ${toExecute} ${modules[${arg}]} ${modulePackageName[${arg}]} ${moduleVersion[${arg}]}
        cd ..
    done
}

function mapModules() {
    local packageName=`cat package.json | grep '"name":' | head -1 | sed -E "s/.*\"name\".*\"(.*)\",?/\1/"`
    local version=`cat package.json | grep '"version":' | head -1 | sed -E "s/.*\"version\".*\"(.*)\",?/\1/"`
    modulePackageName+=(${packageName})
    moduleVersion+=(${version})
}

function printModules() {
    local output=`printf "Found: %-15s %-20s  %s\n" ${1} ${2} v${3}`
    logDebug "${output}"
}

executeOnModules mapModules
executeOnModules printModules

if [[ "${purge}" ]]; then
    executeOnModules purgeModule
fi

if [[ "${unlink}" ]]; then
    executeOnModules unlinkDependenciesImpl
fi

if [[ "${clean}" ]]; then
    executeOnModules cleanModule
fi

if [[ "${setup}" ]]; then
    executeOnModules setupModule
fi

if [[ "${build}" ]]; then
    executeOnModules buildModule
fi

if [[ "${test}" ]]; then
    executeOnModules testModule
fi

if [[ "${launch}" ]]; then
    cd app-backend
        node ./dist/index.js
    cd ..
fi

if [[ "${deploy}" ]]; then
    cd app-backend
        firebase deploy --only functions
    cd ..
fi

if [[ "${publish}" ]]; then
    for module in "${modulesToPublish[@]}"; do
        cd ${module}
            case "${version}" in
                "patch")
                    npm version patch
                ;;

                "minor")
                    npm version minor
                ;;

                "major")
                    npm version major
                ;;
            esac

            npm publish
        cd ..
    done
fi

