#!/bin/bash

source ../core/transpiler.sh
addTranspilerPath `pwd`/../graphics

function _cloud2() {
    echo -e "    .--
   (   )
  (   .  )
(   (   ))
\`- __.'"
}

#function execute() {
#    delimiter=K
#    animObj="`_cloud2`"
#    temp=(`echo -e "${animObj}" | sed -E "s/ /${delimiter}/g" | sed -E "s/ *(.*) *$/\1/g"`)
#    linesTemp=()
#    emptyX=()
#    for (( i=0; i<=${#temp[@]}; i+=1 )); do
#        line="${temp[${i}]}"
#        linesTemp[${i}]="$(echo "${line}" | sed -E "s/${delimiter}/ /g")"
#        xTemp="$(echo "${linesTemp[${i}]}" | sed -E "s/(^ *).*/\1/")"
#        echo "pah${xTemp}zevel"
#        emptyX[${i}]=${#xTemp}
#    done
#    lines=("${linesTemp[@]}")
#
#    echo "${emptyX[0]}- ${lines[0]}"
#    echo "${emptyX[1]}- ${lines[1]}"
#    echo "${emptyX[2]}- ${lines[2]}"
#    echo "${emptyX[3]}- ${lines[3]}"
#    echo "${emptyX[4]}- ${lines[4]}"
#
#}

delimiter=K
animObj="`_cloud2`"
lines=
offset=

function execute() {
    local temp=(`echo -e "${animObj}" | sed -E "s/ /${delimiter}/g" | sed -E "s/(.*)$/\1/g"`)
    local linesTemp=()
    local spacesTemp=()

    height=${#temp[@]}
    for (( i=0; i<=${#temp[@]}; i+=1 )); do
        spacesTemp[${i}]="$(echo "${temp[${i}]}" | sed -E "s/(^${delimiter}*).*/\1/")"
        spacesTemp[${i}]=${#spacesTemp[${i}]}

        linesTemp[${i}]="$(echo "${temp[${i}]}" | sed -E "s/^${delimiter}*(.*)$/\1/" | sed -E "s/${delimiter}/ /g")"
    done


    lines=("${linesTemp[@]}")
    offset=("${spacesTemp[@]}")

}

execute
for (( i=0; i<=${height}; i+=1 )); do
    echo ${offset[$i]}
done
for (( i=0; i<=${height}; i+=1 )); do
    echo ${lines[$i]}
done
#new Canvas2D canvas
#new Drawable2D cloud
#
#canvas.width = 100
#canvas.height = 8
#canvas.clean
#canvas.clean
#
#cloud.animObj = "`_cloud2`"
#cloud.