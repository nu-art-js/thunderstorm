#!/bin/bash

echo "ZEVEL ${*}"
if [[ "${2}" == "new" ]]; then
  bash dev-tools/scripts/dev/typescript-oo/build-and-install.sh "${1}" "${@:3}"
else
  bash dev-tools/scripts/dev/typescript/build-and-install.sh "${@}"
fi
