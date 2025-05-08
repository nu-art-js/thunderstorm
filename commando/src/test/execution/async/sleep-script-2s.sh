#!/bin/bash
trap "echo \"Caught SIGINT (2)\"; exit 2" SIGINT
trap "echo \"Caught SIGTERM (15)\"; exit 15" SIGTERM
trap "echo \"Caught SIGHUP (1)\"; exit 1" SIGHUP

echo "Start"
sleep 2
echo "End"
