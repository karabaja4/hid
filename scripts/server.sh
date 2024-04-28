#!/bin/sh
set -eu

( libcamera-vid -t 0 --width 1280 --height 720 --framerate 30 --listen -o tcp://0.0.0.0:8494 & ) > /dev/null 2>&1
