#!/bin/sh
set -eu

#!/bin/sh
set -eu

if pgrep -x 'libcamera-vid' > /dev/null
then
    printf 'libcamera-vid is already running.\n'
    exit 1
fi

printf 'xx'

( libcamera-vid -t 0 --awbgains 1,1 --width 1280 --height 720 --framerate 30 --listen -o tcp://0.0.0.0:8494 & ) > /dev/null 2>&1
