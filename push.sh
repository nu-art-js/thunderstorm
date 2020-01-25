#!/bin/bash

source ./dev-tools/scripts/git/_core.sh
source ./dev-tools/scripts/_core-tools/_source.sh

version=`getVersionName version-nu-art.json`
dryRun=

[[ "${1}" == "-dr" ]] && dryRun=true && shift
[[ "${1}" ]] && version=${1}
[[ ! "${version}" ]] && throwError "Could not resolve version!" 2

[[ ! ${dryRun} ]] && bash ./dev-tools/scripts/git/gist-pull.sh -a -f

[[ ! ${dryRun} ]] && bash ./build-and-install.sh --lint
throwError "Error linting and building Thunderstorm" $?


modules=(ts-common testelot thunder storm live-docs user-account)
function appendLog() {
    local module=${1}
    gitAssertRepoClean

    [[ ! $(gitAssertTagExists v${version})  ]] && logWarning "Could not find version tag v${version} in package: ${module}" && return 0
    moduleLog=`git log --pretty=oneline --decorate=no --invert-grep --grep="lint" --grep="version bumped" --grep="shit" --no-merges v${version}... | sed -E "s/[0-9a-f]*( .*)/  * \1\n/g"`

    [[ ! "${moduleLog}" ]] && logInfo "No changes found in package: ${module}" && return 0
    submodulesLog="${submodulesLog}${module}:\n ${moduleLog}\n\n"
}

submodulesLog=""
for module in ${modules[@]}; do
    pushd ${module} > /dev/null
        appendLog ${module}
    popd > /dev/null
done

[[ ! ${dryRun} ]] && bash ./dev-tools/scripts/git/git-push.sh --this -m="${submodulesLog}"
throwError "Error pushing Thunderstorm" $?

[[ ${dryRun} ]] && logDebug "Found log message: ${submodulesLog}"