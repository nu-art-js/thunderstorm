#!/bin/bash

array=($(lsof -ti:8101,8102,8103,8104,8105,8106,8107,8108,8109,5009,5012,5013))
if [[ "${1}" ]]; then
  ((${#array[@]} > 0)) && kill -9 "${array[@]}"
else
  ((${#array[@]} > 0)) && kill -2 "${array[@]}"
fi
