#!/bin/bash

source ./dev-tools/scripts/git/_core.sh
source ./dev-tools/scripts/_core-tools/_source.sh

if [[ "${1}" == "" ]]; then
    throwError "Missing commit message" 2
fi

bash ./dev-tools/scripts/git/git-pull.sh -a -f
throwError "Error pulling Thunderstorm" $?

bash ./build-and-install.sh --lint
throwError "Error linting ans building Thunderstorm" $?

bash ./dev-tools/scripts/git/git-push.sh --this -m="${1}"
throwError "Error pushing Thunderstorm" $?

