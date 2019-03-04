#!/bin/bash

git stash
git remote add public git@github.com:nu-art-js/typescript-boilerplate.git
git pull
git merge public/master
git stash pop