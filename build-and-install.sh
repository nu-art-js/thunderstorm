#!/bin/bash

source ./dev-tools/scripts/git/_core.sh
source ./_modules.sh

enforceBashVersion 4.4

debug=
mergeOriginRepo=
cloneNuArt=
pushNuArtMessage=

lib=
syncApp=

purge=
clean=

setup=
listen=
useFrontendHack=true
linkDependencies=
test=
build=true

serveBackend=
launchBackend=
launchFrontend=

envType=
prepareConfig=
setBackendConfig=
getBackendConfig=
deployBackend=
deployFrontend=

version=
publish=

modulesPackageName=()
modulesVersion=()

params=(mergeOriginRepo cloneNuArt pushNuArtMessage purge clean setup lib syncApp useFrontendHack linkDependencies test build serveBackend launchBackend launchFrontend envType prepareConfig getBackendConfig setBackendConfig deployBackend deployFrontend version publish)

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
    logVerbose "   ${pc}--no-frontend-hack${noColor}"
    logVerbose "        ${dc}Do not apply the frontend development hack${noColor}"
    logVerbose
    logVerbose "   ${pc}--listen${noColor}"
    logVerbose "        ${dc}listen and rebuild on changes in modules${noColor}"
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
    logVerbose "   ${pc}--launch-frontend${noColor}"
    logVerbose "        ${dc}Will launch ONLY frontend${noColor}"
    logVerbose
    logVerbose "   ${pc}--launch-backend${noColor}"
    logVerbose "        ${dc}Will launch ONLY backend${noColor}"
    logVerbose
    logVerbose "   ${pc}--serve-backend${noColor}"
    logVerbose "        ${dc}Will serve ONLY backend${noColor}"
    logVerbose
    logVerbose

    logVerbose " ==== ${group}DEPLOY:${noColor} ===="
    logVerbose
    logVerbose "   ${pc}--deploy${noColor}"
    logVerbose "        ${dc}Will deploy both frontend & backend${noColor}"
    logVerbose
    logVerbose "   ${pc}--deploy-frontend${noColor}"
    logVerbose "        ${dc}Will deploy ONLY frontend${noColor}"
    logVerbose
    logVerbose "   ${pc}--deploy-backend${noColor}"
    logVerbose "        ${dc}Will deploy ONLY backend${noColor}"
    logVerbose
    logVerbose "   ${pc}--prepare-config${noColor}"
    logVerbose "        ${dc}Will prepare the .config.json as base64 for local usage${noColor}"
    logVerbose
    logVerbose "   ${pc}--set-env=<${param}envType${pc}>${noColor}"
    logVerbose "        ${dc}Will set the .config-\${envType}.json as the current .config.json and prepare it as base 64 for local usage${noColor}"
    logVerbose
    logVerbose "   ${pc}--set-backend-config${noColor}"
    logVerbose "        ${dc}Will set function backend config${noColor}"
    logVerbose
    logVerbose "   ${pc}--get-backend-config${noColor}"
    logVerbose "        ${dc}Will get function backend config${noColor}"
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

function signature() {
    clear
    logVerbose
    logVerbose "${Gray} -------        _   __                      ___         __ ${Purple}            ${Gray}   ------- ${NoColor}"
    logVerbose "${Gray} -------       / | / /_  __                /   |  _____/ /_${Purple}            ${Gray}   ------- ${NoColor}"
    logVerbose "${Gray} -------      /  |/ / / / /    ______     / /| | / ___/ __/${Purple}    .   __  ${Gray}   ------- ${NoColor}"
    logVerbose "${Gray} -------     / /|  / /_/ /    /_____/    / ___ |/ /  / /_ ${Purple}    /|  /  \ ${Gray}   ------- ${NoColor}"
    logVerbose "${Gray} -------    /_/ |_/\__,_/               /_/  |_/_/   \__/ ${Purple} \/  |. \__/ ${Gray}   ------- ${NoColor}"
    logVerbose "${Gray} -------                                                  ${Purple}             ${Gray}   ------- ${NoColor}"
    logVerbose
    sleep 1s
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

            "--push="*)
                pushNuArtMessage=`echo "${paramValue}" | sed -E "s/--push=(.*)/\1/"`
            ;;

#        ==== Frontend Hack =====
            "--lib="*)
                compileLib=`echo "${paramValue}" | sed -E "s/--lib=(.*)/\1/"`
            ;;

            "--sync-app="*)
                syncApp=`echo "${paramValue}" | sed -E "s/--sync-app=(.*)/\1/"`
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
            "--setup" | "-s")
                setup=true
                linkDependencies=true
            ;;

            "--unlink" | "-u")
                purge=true
                setup=true
            ;;

            "--no-build" | "-nb")
                build=
            ;;

            "--test" | "-t")
                test=true
            ;;

            "--listen" | "-l")
                listen=true
            ;;

            "--no-frontend-hack" | "-nfh")
                useFrontendHack=
            ;;


#        ==== DEPLOY =====
            "--deploy" | "-d")
                deployBackend=true
                deployFrontend=true
            ;;

            "--deploy-backend" | "-db")
                deployBackend=true
            ;;

            "--deploy-frontend" | "-df")
                deployFrontend=true
            ;;

            "--set-env="* | "-se="*)
                envType=`echo "${paramValue}" | sed -E "s/(--set-env=|-se=)(.*)/\2/"`
                prepareConfig=true
            ;;

            "--set-backend-config"* | "-sbc"*)
                envType=`echo "${paramValue}" | sed -E "s/(--set-backend-config=|-scb=)(.*)/\2/"`
                prepareConfig=true
                setBackendConfig=true
                build=
            ;;

            "--get-backend-config" | "-gbc")
                getBackendConfig=true
                build=
            ;;

#        ==== LAUNCH =====
            "--launch" | "-l")
                launchBackend=true
                launchFrontend=true
            ;;

            "--serve-backend" | "-sb")
                serveBackend=true
            ;;

            "--launch-backend" | "-lb")
                launchBackend=true
            ;;

            "--launch-frontend" | "-lf")
                launchFrontend=true
            ;;

#        ==== PUBLISH =====
            "--publish" | "-p")
                clean=true
                publish=true
            ;;

            "--version="*)
                version=`echo "${paramValue}" | sed -E "s/--version=(.*)/\1/"`
                setup=true
                linkDependencies=true
            ;;

            "-v="*)
                version=`echo "${paramValue}" | sed -E "s/-v=(.*)/\1/"`
                setup=true
                linkDependencies=true

            ;;

#        ==== ERRORS & DEPRECATION =====
            "--get-config-backend"*)
                logWarning "COMMAND IS DEPRECATED... USE --get-backend-config"
            ;;

            "-gcb")
                logWarning "COMMAND IS DEPRECATED... USE -gbc"
            ;;

            "--set-config-backend"*)
                logWarning "COMMAND IS DEPRECATED... USE --set-backend-config"
            ;;

            "-scb"*)
                logWarning "COMMAND IS DEPRECATED... USE -sbc"
            ;;

            *)
                logWarning "UNKNOWN PARAM: ${paramValue}";
            ;;
        esac
    done
}

#################
#               #
#  DECLARATION  #
#               #
#################

function mapModulesVersions() {
    modulesPackageName=()
    modulesVersion=()
    executeOnModules mapModule
}

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
    rm package-lock.json
}

function cleanModule() {
    rm -rf dist
}

function usingBackend() {
    if [[ ! "${deployBackend}" ]] && [[ ! "${launchBackend}" ]] && [[ ! "${serveBackend}" ]]; then
        echo
        return
    fi

    echo true
}

function usingFrontend() {
    if [[ ! "${deployFrontend}" ]] && [[ ! "${launchFrontend}" ]]; then
        echo
        return
    fi

    echo true
}

function buildModule() {
    if [[ `usingFrontend` ]] && [[ ! `usingBackend` ]] && [[ "${1}" == "${backendModule}" ]]; then
        return
    fi

    if [[ `usingBackend` ]] && [[ ! `usingFrontend` ]] && [[ "${1}" == "${frontendModule}" ]]; then
        return
    fi

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
    if [[ `contains ${1} "${projectModules[@]}"` ]]; then
        return
    fi

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

        if [[ `contains "${modules[${i}]}" "${projectModules[@]}"` ]]; then
            return
        fi

        local modulePackageName="${modulesPackageName[${i}]}"
        if [[ ! "`cat package.json | grep ${modulePackageName}`" ]]; then
            continue;
        fi

        logDebug "Linking dependency sources ${modulePackageName} => ${module}"
        if [[ "${module}" == "${frontendModule}" ]] && [[ "${useFrontendHack}" ]]; then
            logInfo "Sync ${modules[${i}]} => ${module}"
            cd ..
                bash build-and-install.sh --lib=${modules[${i}]} --sync-app=${module}
            cd -
        else
            npm link ${modulePackageName}
            throwError "Error linking dependency" $?
        fi

        local moduleVersion="${modulesVersion[${i}]}"
        if [[ ! "${moduleVersion}" ]]; then continue; fi

        logDebug "Updating dependency version to ${modulePackageName} => ${moduleVersion}"
        local escapedModuleName=${modulePackageName/\//\\/}
        sed -i '' "s/\"${escapedModuleName}\": \".*\"/\"${escapedModuleName}\": \"^${moduleVersion}\"/g" package.json
        throwError "Error updating version of dependency in package.json" $?
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

            local moduleName="${modulesPackageName[${i}]}"
            local escapedModuleName=${moduleName/\//\\/}

            if [[ `isMacOS` ]]; then
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
    local async=${2}

    local i
    for (( i=0; i<${#modules[@]}; i+=1 )); do
        local module="${modules[${i}]}"
        local packageName="${modulesPackageName[${i}]}"
        local version="${modulesVersion[${i}]}"

        cd ${module}
            if [[ "${async}" == "true" ]]; then
                ${toExecute} ${module} ${packageName} ${version} &
            else
                ${toExecute} ${module} ${packageName} ${version}
            fi
        cd ..
    done
}

function getModulePackageName() {
    local packageName=`cat package.json | grep '"name":' | head -1 | sed -E "s/.*\"name\".*\"(.*)\",?/\1/"`
    echo "${packageName}"
}

function getModuleVersion() {
    local version=`cat package.json | grep '"version":' | head -1 | sed -E "s/.*\"version\".*\"(.*)\",?/\1/"`
    echo "${version}"
}

function mapModule() {
    local packageName=`getModulePackageName`
    local version=`getModuleVersion`
    modulesPackageName+=(${packageName})
    modulesVersion+=(${version})
}

function printModule() {
    local output=`printf "Found: %-15s %-20s  %s\n" ${1} ${2} v${3}`
    logDebug "${output}"
}

function cloneNuArtModules() {
    local module
    for module in "${nuArtModules[@]}"; do
        if [[ ! -e "${module}" ]]; then
            git clone git@github.com:nu-art-js/${module}.git
        else
            cd ${module}
                git pull
            cd ..
        fi
    done
}

function mergeFromFork() {
    local repoUrl=`gitGetRepoUrl`
    if [[ "${repoUrl}" == "git@github.com:nu-art-js/typescript-boilerplate.git" ]]; then
        throwError "HAHAHAHA.... You need to be careful... this is not a fork..."
    fi

    logInfo "Making sure repo is clean..."
    gitAssertRepoClean
    git remote add public git@github.com:nu-art-js/typescript-boilerplate.git
    git fetch public
    git merge public/master
    throwError "Need to resolve conflicts...." $?

    git submodule update dev-tools
}

function pushNuArt() {
    for module in "${nuArtModules[@]}"; do
        if [[ ! -e "${module}" ]]; then
            throwError "In order to promote a version ALL nu-art dependencies MUST be present!!!"
        fi
    done

    for module in "${nuArtModules[@]}"; do
        cd ${module}
            gitNoConflictsAddCommitPush ${module} `gitGetCurrentBranch` "${pushNuArtMessage}"
        cd ..
    done

    gitNoConflictsAddCommitPush ${module} `gitGetCurrentBranch` "built with new dependencies, ${pushNuArtMessage}"
}

function promoteNuArt() {
    local _version=${version}
    case "${_version}" in
        "patch" | "minor" | "major")
            _version=${_version}
        ;;

        "p")
            _version="patch"
        ;;

        *)
            _version=
        ;;
    esac

    if [[ ! "${_version}" ]]; then
        throwError "Bad version type: ${version}"
    fi

    for module in "${nuArtModules[@]}"; do
        if [[ ! -e "${module}" ]]; then
            throwError "In order to promote a version ALL nu-art dependencies MUST be present!!!"
        fi

        cd ${module}
            gitAssertRepoClean
        cd ..
    done

    for module in "${nuArtModules[@]}"; do
        cd ${module}
            logInfo "updating module: ${module} version: ${_version}"
            setupModule ${module}
            gitNoConflictsAddCommitPush ${module} `gitGetCurrentBranch` "updated dependencies version"
            npm version ${_version}
            throwError "Error promoting version" $?
        cd ..

        mapModulesVersions
    done
}

function publishNuArt() {
    for module in "${nuArtModules[@]}"; do
        cd ${module}
            logInfo "publishing module: ${module}"
            npm publish
            throwError "Error publishing module: ${module}" $?
        cd ..
    done
}

function getFirebaseConfig() {
    logInfo "Fetching config for serving function locally..."
    firebase functions:config:get > .runtimeconfig.json
}

function prepareConfigImpl() {
    cd ${backendModule}
        if [[ -e ".example-config.json" ]] && [[ ! -e ".config.json" ]]; then
            logInfo "Setting first time .config.json"
            if [[ ! -e ".config-dev.json" ]]; then
                cp .config.json .config-dev.json
            fi
            if [[ ! -e ".config-prod.json" ]]; then
                cp .config.json .config-prod.json
            fi
            mv .example-config.json .config.json

        fi

        if [[ "${envType}" ]] && [[ -e ".config-${envType}.json" ]]; then
            logInfo "Setting to backend envType: ${envType}"
            cp -f ".config-${envType}.json" .config.json
        fi

        logInfo "Preparing config as base64..."
        local configAsJson=`cat .config.json`
        configAsBase64=

        if [[ `isMacOS` ]]; then
            configAsBase64=`echo "${configAsJson}" | base64 --break 0`
            throwError "Error base64 config" $?
        else
            configAsBase64=`echo "${configAsJson}" | base64 --wrap=0`
            throwError "Error base64 config" $?
        fi

        echo "{\"app\": {\"config\":\"${configAsBase64}\"}}" > .runtimeconfig.json
        logInfo "Backend Config is ready as base64!"
    cd -

    cd ${frontendModule}/src/main
        if [[ "${envType}" ]] && [[ -e "config-${envType}.ts" ]]; then
            logInfo "Setting to frontend envType: ${envType}"
            cp -f "config-${envType}.ts" config.ts
        fi
        logInfo "Frontend config is set!"
    cd -
}

function updateBackendConfig() {
    if [[ ! "${configAsBase64}" ]]; then
        throwError "config was not prepared!!"
    fi

    cd ${backendModule}
        logInfo "Updating config in firebase..."
        firebase functions:config:set ${configEntryName}="${configAsBase64}"
        throwError "Error Updating config as base 64 in firebase..." $?

        getFirebaseConfig
    cd ..
    throwError "Error while deploying functions" $?
}

function fetchBackendConfig() {
    cd ${backendModule}
        getFirebaseConfig

        logInfo "Updating config locally..."
        local configAsBase64=`firebase functions:config:get ${configEntryName}`
        configAsBase64=${configAsBase64:1:-1}
        local configEntry=`echo ${configAsBase64} | base64 --decode`
        echo "${configEntry}" > .config.json
    cd ..
    throwError "Error while deploying functions" $?
}

function compileModule() {
    local compileLib=${1}
    logInfo "Compiling module: ${compileLib}"
    cd ${compileLib}
        tsc
    cd ..
}

function syncModule() {
    local compileLib=${1}
    local syncApp=${2}
    cd ${compileLib}
        local packageName=`getModulePackageName`
    cd ..

    logInfo "Syncing lib: ${compileLib} into app: ${syncApp}"
    if [[ "${syncApp}" ]]; then
        local targetFolder="./${syncApp}/node_modules/${packageName}"
        logInfo "Syncing ${compileLib}..."
        createDir ${targetFolder}
        rsync -a --exclude 'node_modules' ./${compileLib}/ ${targetFolder}
        logInfo "${compileLib} is Ready!!"
    fi
}

function syncLibChangesToApp() {
    local compileLib=${1}
    local syncApp=${2}

    logInfo "Watching on: ${compileLib}/dist => bash build-and-install.sh --lib=${compileLib} --sync-app=${syncApp}"
    fswatch -o -0 ${compileLib}/dist | xargs -0 -n1 -I{} bash build-and-install.sh --lib=${compileLib} --sync-app=${syncApp} &
}


function compileModuleOnChanges() {
    local module=${1}

    logInfo "Watching on: ${module}/src => bash build-and-install.sh --lib=${module}"
    fswatch -o -0 ${module}/src | xargs -0 -n1 -I{} bash build-and-install.sh --lib=${module} &
}

#################
#               #
#    PREPARE    #
#               #
#################

# Handle recursive sync execution
if [[ ! "${1}" =~ "--lib" ]]; then
    signature
    printCommand "$@"
fi

extractParams "$@"

if [[ "${compileLib}" ]]; then
    if [[ "${syncApp}" ]]; then
        syncModule ${compileLib} ${syncApp}
    else
        compileModule ${compileLib}
    fi
    exit $?
fi

printDebugParams ${debug} "${params[@]}"


#################
#               #
#   EXECUTION   #
#               #
#################

if [[ "${mergeOriginRepo}" ]]; then
    mergeFromFork
fi

if [[ "${cloneNuArt}" ]]; then
    cloneNuArtModules
    bash $0 --setup
fi

mapExistingLibraries
mapModulesVersions
executeOnModules printModule

if [[ "${purge}" ]]; then
    executeOnModules purgeModule
fi

if [[ "${clean}" ]]; then
    executeOnModules cleanModule
fi

if [[ "${prepareConfig}" ]]; then
    prepareConfigImpl
fi

if [[ "${setBackendConfig}" ]]; then
    updateBackendConfig
fi

if [[ "${getBackendConfig}" ]]; then
    fetchBackendConfig
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

if [[ "${launchBackend}" ]]; then
    cd ${backendModule}
        if [[ "${launchFrontend}" ]]; then
            node ./dist/index.js &
        else
            node ./dist/index.js
        fi
    cd ..
fi

if [[ "${serveBackend}" ]]; then
    cd ${backendModule}

        npm run serve
    cd ..
fi

if [[ "${launchFrontend}" ]]; then
    cd ${frontendModule}
        if [[ "${launchBackend}" ]]; then
            npm run dev &
        else
            npm run dev
        fi
    cd ..
fi

if [[ "${deployBackend}" ]]; then
    firebase deploy --only functions
    throwError "Error while deploying functions" $?
fi

if [[ "${deployFrontend}" ]]; then
    firebase deploy --only hosting
    throwError "Error while deploying hosting" $?
fi

if [[ "${pushNuArtMessage}" ]]; then
    pushNuArt
fi

if [[ "${version}" ]]; then
    promoteNuArt
fi

if [[ "${publish}" ]]; then
    publishNuArt
    executeOnModules setupModule
fi

if [[ "${listen}" ]]; then
    logDebug "Stop all fswatch listeners..."
    killall 9 fswatch
    pids=()
    for module in ${modules[@]}; do
        if [[ ! -e "./${module}" ]]; then continue; fi

        fswatch -o -0 ${module}/src | xargs -0 -n1 -I{} bash build-and-install.sh --lib=${module} &
        pids+=($!)
    done

    executeOnModules compileModuleOnChanges
    if [[ "${useFrontendHack}" ]]; then
        if [[ -e "./nu-art-core" ]]; then
            logDebug "Applying frontend rsync HACK nu-art-core => ${frontendModule}"
            fswatch -o -0 nu-art-core/dist | xargs -0 -n1 -I{} bash build-and-install.sh --lib=nu-art-core --sync-app=${frontendModule} &
            pids+=($!)
        fi

        if [[ -e "./nu-art-fronzy" ]]; then
            logDebug "Applying frontend rsync HACK nu-art-fronzy => ${frontendModule}"
            fswatch -o -0 nu-art-fronzy/dist | xargs -0 -n1 -I{} bash build-and-install.sh --lib=nu-art-fronzy --sync-app=${frontendModule} &
            pids+=($!)
        fi
    fi

    for pid in "${pids[@]}"; do
        wait ${pid}
    done
fi

