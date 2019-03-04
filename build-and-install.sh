#!/bin/bash

source ./dev-tools/scripts/_core-tools/_source.sh
source ./_modules.sh

enforceBashVersion 4.4

setup=
purge=
clean=
debug=
launch=
test=
deploy=
publish=
version=
build=true
linkDependencies=
cloneNuArt=

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
    logVerbose "        ${dc}Will purge & setup without dependencies${noColor}"
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

           "--nu-art")
                cloneNuArt=true
            ;;

           "--unlink")
                purge=true
                setup=true
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

params=(setup purge clean launch test deploy publish version build linkDependencies cloneNuArt)
printDebugParams ${debug} "${params[@]}"

function mapExistingLibraries() {
    _modules=()
    local module
    for module in "${modules[@]}"; do
        if [[ ! -e "${module}" ]]; then continue; fi
        _modules+=(${module})
    done
    modules=("${_modules[@]}")
}

function purgeModule() {
    rm -rf node_modules
}

function cleanModule() {
    rm -rf dist
}

function buildModule() {
    logVerbose
    logInfo "Building module: ${1}"
    logVerbose
    npm run build
}

function testModule() {
    npm run test
}

function npmLinkModule() {
    logVerbose
    if [[ "${1}" == "${projectModule}" ]]; then return; fi

    logInfo "Linking module sources: ${2} -> ${1}"
    logVerbose "`npm link`"
}

function linkDependenciesImpl() {
    local module=${1}

    logVerbose
    logInfo "Linking dependencies sources to: ${module}"
    local i
    for (( i=0; i<${#modules[@]}; i+=1 )); do
        if [[ "${module}" == "${modules[${i}]}" ]];then break; fi

        local moduleName="${modulePackageName[${i}]}"
        logDebug "Linking dependency sources ${module} => ${moduleName}"
        logVerbose "`npm link ${moduleName}`"
    done
}

function backupPackageJson() {
    cp package.json _package.json
}

function restorePackageJson() {
    rm package.json
    mv _package.json package.json
}

function setupModule() {
    local module=${1}

    function cleanPackageJson() {
        local i
        for (( i=0; i<${#modules[@]}; i+=1 )); do
            if [[ "${module}" == "${modules[${i}]}" ]]; then break; fi

            local moduleName="${modulePackageName[${i}]}"
            local escapedModuleName=${moduleName/\//\\/}

            if [[ "$(uname -v)" =~ "Darwin" ]]; then
                sed -i '' "/${escapedModuleName}/d" package.json
            else
                sed -i "/${escapedModuleName}/d" package.json
            fi
        done
    }

    if [[ "${linkDependencies}" ]]; then
        backupPackageJson
        cleanPackageJson
        npmLinkModule $@
    fi

    logVerbose
    logInfo "Installing ${module}"
    logVerbose
    npm install

    if [[ "${linkDependencies}" ]]; then
        restorePackageJson
        linkDependenciesImpl $@
    fi
}

function executeOnModules() {
    local toExecute=${1}
    local i
    for (( i=0; i<${#modules[@]}; i+=1 )); do
        local module="${modules[${i}]}"
        local packageName="${modulePackageName[${i}]}"
        local version="${moduleVersion[${i}]}"

        cd ${module}
            ${toExecute} ${module} ${packageName} ${version}
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

function cloneNuArtModules() {
    local module
    for module in "${nuArtModules[@]}"; do
        if [[ ! -e "${module}" ]]; then
            git clone git@github.com:nu-art-js/${module}.git
        fi
    done
}

if [[ "${cloneNuArt}" ]]; then
    cloneNuArtModules
fi

mapExistingLibraries

executeOnModules mapModules
executeOnModules printModules

if [[ "${purge}" ]]; then
    executeOnModules purgeModule
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

