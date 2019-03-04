#!/bin/bash

git stash
git remote add public git@github.com:nu-art-js/typescript-boilerplate.git
git fetch public
git merge public/master
git stash pop
git submodule update dev-tools