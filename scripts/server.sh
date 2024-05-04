#!/bin/sh
set -eu

#!/bin/sh
set -eu

if pgrep -x 'rpicam-vid' > /dev/null
then
    printf 'rpicam-vid is already running.\n'
    exit 1
fi

( rpicam-vid -t 0 --awbgains 1.2,1.2 --width 1280 --height 720 --framerate 30 --nopreview --listen -o tcp://0.0.0.0:8494 & ) > /dev/null 2>&1
