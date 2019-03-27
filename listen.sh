#!/bin/bash
killall 9 fswatch
pids=()

fswatch -o -0 nu-art-core/src | xargs -0 -n1 -I{} bash build-and-install.sh --lib=nu-art-core &
pids+=($!)
fswatch -o -0 nu-art-fronzy/src | xargs -0 -n1 -I{} bash build-and-install.sh --lib=nu-art-fronzy &
pids+=($!)
fswatch -o -0 nu-art-server/src | xargs -0 -n1 -I{} bash build-and-install.sh --lib=nu-art-server &
pids+=($!)
fswatch -o -0 app-frontend/src | xargs -0 -n1 -I{} bash build-and-install.sh --lib=app-frontend &
pids+=($!)
fswatch -o -0 app-backend/src | xargs -0 -n1 -I{} bash build-and-install.sh --lib=app-backend &
pids+=($!)


for pid in "${pids[@]}"; do
    wait ${pid}
done
