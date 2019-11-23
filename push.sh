#!/bin/bash

bash ./dev-tools/scripts/git/git-pull.sh -a -f
bai --lint
bash ./dev-tools/scripts/git/git-push.sh --this -m="${1}"
