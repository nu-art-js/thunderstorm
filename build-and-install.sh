#!/bin/bash

if [[ "${2}" == "old" ]]; then
  echo Running old script
  sleep 2s
  bash dev-tools/scripts/dev/typescript/build-and-install.sh "${1}" "${@:3}"
else
  bash dev-tools/scripts/dev/typescript-oo/build-and-install.sh "${@}"
fi
