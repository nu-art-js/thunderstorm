#!/bin/bash

copyScss() {
  local absoluteSourcesFolder="${1}"
  local absoluteOutputDir="${2}"
  echo "${absoluteSourcesFolder} => ${absoluteOutputDir}"
  cd "${absoluteSourcesFolder}"
    find . -name '*.scss' | cpio -pdm "${absoluteOutputDir}" > /dev/null
    find . -name '*.svg' | cpio -pdm "${absoluteOutputDir}" > /dev/null
  cd -
}

copyDist() {
  local absoluteOutputDir="${1}"
  local distFolder=".dependencies/${2}"
  echo "${1} ${2} ${3}"

  if [[ -e "${3}/app-backend/${distFolder}" ]]; then
    rm -rf "${3}/app-backend/${distFolder}"
    cp -r "${absoluteOutputDir}" "${3}/app-backend/${distFolder}"
  fi

  if [[ -e "${3}/app-frontend/${distFolder}" ]]; then
    rm -rf "${3}/app-frontend/${distFolder}"
    cp -r "${absoluteOutputDir}" "${3}/app-frontend/${distFolder}"
  fi
}


copyScss "${1}" "${2}"
copyDist "${2}" "${3}" "${4}"

date +%Y-%m-%d--%H-%M-%S > "${4}/app-backend/src/main/dummy"
