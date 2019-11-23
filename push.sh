#!/bin/bash

bai --lint
bash ./dev-tools/scripts/git/git-push.sh --this -m="${1}"
