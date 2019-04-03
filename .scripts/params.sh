#!/bin/bash

debug=
mergeOriginRepo=
cloneNuArt=
pushNuArtMessage=

compileLib=

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

promoteNuArtVersion=
promoteAppVersion=
publish=

modulesPackageName=()
modulesVersion=()

params=(mergeOriginRepo cloneNuArt pushNuArtMessage purge clean setup compileLib useFrontendHack linkDependencies test build serveBackend launchBackend launchFrontend envType prepareConfig getBackendConfig setBackendConfig deployBackend deployFrontend version publish)

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
                build=
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

            "--set-backend-config" | "-sbc")
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
                build=true
                publish=true
            ;;

            "--version-nu-art="* | "-vn="*)
                promoteNuArtVersion=`echo "${paramValue}" | sed -E "s/(--version-nu-art=|-vn=)(.*)/\2/"`
                setup=true
                linkDependencies=true
            ;;

            "--version-app="* | "-va="*)
                promoteAppVersion=`echo "${paramValue}" | sed -E "s/(--version-app=|-va=)(.*)/\2/"`
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
