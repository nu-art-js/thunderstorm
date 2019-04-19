#!/bin/bash

npm list -g nodemon > /dev/null
throwError "nodemon package is missing... Please install nodemon:\n npm i -g nodemon"
