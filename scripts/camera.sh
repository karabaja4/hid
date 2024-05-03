#!/bin/sh
set -eu

_ip="192.168.0.30"

ssh "${_ip}" '/home/igor/hid/scripts/server.sh'
printf 'Waiting for libcamera-vid to settle...\n'
sleep 3
printf 'Starting ffplay...\n'
ffplay -loglevel fatal -strict experimental -vf setpts=0 -fflags nobuffer -flags low_delay -framedrop -i "tcp://${_ip}:8494"
