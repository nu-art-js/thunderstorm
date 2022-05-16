#!/bin/bash

copyScss() {
  local absoluteSourcesFolder="${1}"
  local absoluteOutputDir="${2}"
  echo "${absoluteSourcesFolder} => ${absoluteOutputDir}"
  cd "${absoluteSourcesFolder}"
    find . -name '*.scss' | cpio -pdm "${absoluteOutputDir}" > /dev/null
  cd -
}

copyScss "${1}" "${2}"

date +%Y-%m-%d--%H-%M-%S > ../app-backend/src/main/dummy
