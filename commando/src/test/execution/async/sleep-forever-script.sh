#!/bin/bash
trap "echo \"Caught SIGINT (2)\"; exit 2" SIGINT
trap "echo \"Caught SIGTERM (15)\"; exit 15" SIGTERM
trap "echo \"Caught SIGHUP (1)\"; exit 1" SIGHUP

echo "Looping with PID $$"
while true; do
  echo sleep start
  sleep 20
  echo sleep end
done
