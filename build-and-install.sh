#!/bin/bash

source ./dev-tools/scripts/git/_core.sh
source ./_modules.sh

enforceBashVersion 4.4

debug=
mergeOriginRepo=
cloneNuArt=

purge=
clean=

setup=
linkDependencies=
test=
build=true

launchFunctions=
launchHosting=

deployFunctions=
deployHosting=

version=
publish=

function printHelp() {
    local pc="${BBlue}"
    local group="${BCyan}"
    local param="${BPurple}"
    local err="${BRed}"
    local dc="${Green}"
    local dcb="${BGreen}"
    local noColor="${NoColor}"

    logVerbose " ==== ${group}CLEAN:${noColor} ===="
    logVerbose
    logVerbose "   ${pc}--purge${noColor}"
    logVerbose "        ${dc}Will delete the node_modules folder in all modules${noColor}"
    logVerbose "        ${dc}Will perform --clean{noColor}"
    logVerbose
    logVerbose "   ${pc}--clean${noColor}"
    logVerbose "        ${dc}Will delete the dist folder in all modules${noColor}"
    logVerbose
    logVerbose

    logVerbose " ==== ${group}BUILD:${noColor} ===="
    logVerbose
    logVerbose "   ${pc}--unlink${noColor}"
    logVerbose "        ${dc}Will purge & setup without dependencies${noColor}"
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
    logVerbose

    logVerbose " ==== ${group}LAUNCH:${noColor} ===="
    logVerbose
    logVerbose "   ${pc}--launch${noColor}"
    logVerbose "        ${dc}Will launch both frontend & backend${noColor}"
    logVerbose
    logVerbose "   ${pc}--frontend${noColor}"
    logVerbose "        ${dc}Will launch ONLY frontend${noColor}"
    logVerbose
    logVerbose "   ${pc}--backend${noColor}"
    logVerbose "        ${dc}Will launch ONLY backend${noColor}"
    logVerbose
    logVerbose

    logVerbose " ==== ${group}DEPLOY:${noColor} ===="
    logVerbose
    logVerbose "   ${pc}--deploy${noColor}"
    logVerbose "        ${dc}Will deploy both frontend & backend${noColor}"
    logVerbose
    logVerbose "   ${pc}--hosting${noColor}"
    logVerbose "        ${dc}Will launch ONLY frontend${noColor}"
    logVerbose
    logVerbose "   ${pc}--server${noColor}"
    logVerbose "        ${dc}Will launch ONLY backend${noColor}"
    logVerbose
    logVerbose

    logVerbose " ==== ${group}PUBLISH:${noColor} ===="
    logVerbose
    logVerbose "   ${pc}--version=< ${param}major${noColor} | ${param}minor${noColor} | ${param}patch${noColor} >${noColor}"
    logVerbose "        ${dc}Promote dependencies version${noColor}"
    logVerbose
    logVerbose "   ${pc}--publish${noColor}"
    logVerbose "        ${dc}Publish artifacts to npm${noColor}"
    logVerbose

    logVerbose " ==== ${group}SUPER:${noColor} ===="
    logVerbose
    logVerbose "   ${pc}--merge-origin"
    logVerbose "        ${dc}Pull and merge from the forked repo${noColor}"
    logVerbose
    logVerbose "   ${pc}--nu-art${noColor}"
    logVerbose "        ${dc}Add dependencies sources${noColor}"
    logVerbose

    exit 0
}

function extractParams() {
    for paramValue in "${@}"; do
        case "${paramValue}" in
            "--help")
                printHelp
            ;;

            "--debug")
                debug=true
            ;;

            "--merge-origin")
                mergeOriginRepo=true
            ;;

            "--nu-art")
                cloneNuArt=true
            ;;


#        ==== CLEAN =====
           "--purge")
                purge=true
                clean=true
            ;;

            "--clean")
                clean=true
            ;;


#        ==== BUILD =====
           "--setup")
                setup=true
                linkDependencies=true
            ;;

           "--unlink")
                purge=true
                setup=true
            ;;

            "--no-build")
                build=
            ;;

            "--test")
                test=true
            ;;


#        ==== DEPLOY =====
            "--deploy")
                deployFunctions=true
                deployHosting=true
            ;;

            "--server")
                deployFunctions=true
            ;;

            "--hosting")
                deployHosting=true
            ;;

#        ==== LAUNCH =====
            "--launch")
                launchFunctions=true
                launchHosting=true
            ;;

            "--backend")
                launchFunctions=true
            ;;

            "--frontend")
                launchHosting=true
            ;;

#        ==== PUBLISH =====
            "--no-launch")
                launch=
            ;;

            "--publish")
                publish=true
            ;;

            "--version="*)
                version=`echo "${paramValue}" | sed -E "s/--version=(.*)/\1/"`
            ;;

#        ==== LAUNCH =====

            *)
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

params=(setup purge clean launch test deployFunctions deployHosting publish version build linkDependencies cloneNuArt mergeOriginRepo)
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
    npm link
    throwError "Error linking module: ${1}" $?
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
        npm link ${moduleName}
        throwError "Error linking dependency sources ${module} => ${moduleName}: " $?
    done
}

function backupPackageJson() {
    cp package.json _package.json
    throwError "Error backing up package.json in module: ${1}" $?
}

function restorePackageJson() {
    rm package.json
    throwError "Error restoring package.json in module: ${1}" $?

    mv _package.json package.json
    throwError "Error restoring package.json in module: ${1}" $?
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
    throwError "Error installing module" $?

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

function mergeFromFork() {
    local repoUrl=`gitGetRepoUrl`
    logInfo "repoUrl: ${repoUrl}"
    if [[ "${repoUrl}" == "git@github.com:nu-art-js/typescript-boilerplate.git" ]]; then
        throwError "HAHAHAHA.... You need to be careful... this is not a fork..."
    fi
    git stash
    git remote add public git@github.com:nu-art-js/typescript-boilerplate.git
    git fetch public
    git merge public/master
    git stash pop
    throwError "Need to resolve conflicts...." $?

    git submodule update dev-tools
}

if [[ "${mergeOriginRepo}" ]]; then
    mergeFromFork
fi

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

if [[ "${launchFunctions}" ]]; then
    cd app-backend
        node ./dist/index.js &
    cd ..
fi

if [[ "${launchHosting}" ]]; then
    cd app-frontend
        npm run dev-test &
    cd ..
fi

if [[ "${deployFunctions}" ]]; then
    firebase deploy --only functions
    throwError "Error while deploying functions" $?
fi

if [[ "${deployHosting}" ]]; then
    firebase deploy --only hosting
    throwError "Error while deploying hosting" $?
fi

if [[ "${publish}" ]]; then
    for module in "${modulesToPublish[@]}"; do
        case "${version}" in
            "patch" | "minor" | "major")
                version=${version}
            ;;

            *)
                version=
            ;;
        esac

        cd ${module}
            if [[ "${version}" ]]; then
                logInfo "updating module: ${module} version: ${version}"
                npm version ${version}
                throwError "Error promoting version" $?
            fi

            logInfo "publishing module: ${module} version: ${version}"
            npm publish
            throwError "Error publishing module: ${module}" $?
        cd ..
    done
fi

