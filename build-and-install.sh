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
build=true

function printHelp() {
    local pc="${BBlue}"
    local err="${BRed}"
    local dc="${Green}"
    local dcb="${BGreen}"
    local noColor="${NoColor}"

    logVerbose "   ${pc}--purge${noColor}"
    logVerbose "        ${dc}Will delete the node_modules folder in all modules${noColor}"
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
            ;;

            "--clean")
                clean=true
            ;;

            "--setup")
                setup=true
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

params=(setup clean launch test build)
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

function linkLibraries() {
    local module=${1}

    logInfo "Link libraries"
    for (( arg=0; arg<${#modules[@]}; arg+=1 )); do
        if [[ "${module}" == "${modules[${arg}]}" ]];then break; fi
        local moduleName="${modulePackageName[${arg}]}"

        logDebug "Linking library ${module} => ${moduleName}"
        npm link ${moduleName}
    done
}

function setupModule() {
    local module=${1}

    function cleanPackageJson() {
        logInfo "Backup & Cleaning up package.json"
        cp package.json _package.json
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

    function restorePackageJson() {
        logInfo "Restore package.json"
        rm package.json
        mv _package.json package.json
    }


    cleanPackageJson $@
    npmLinkModule $@

    npm install

    restorePackageJson $@
    linkLibraries $@
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
    local output=`printf "Found: %15s %20s  %s\n" ${1} ${2} v${3}`
    logDebug "${output}"
}

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