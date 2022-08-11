#!/bin/bash

array=($(lsof -ti:9201,9202,9203,9204,9206))
if [[ "${1}" ]]; then
  ((${#array[@]} > 0)) && kill -9 "${array[@]}"
else
  ((${#array[@]} > 0)) && kill -2 "${array[@]}"
fi
