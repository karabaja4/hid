#!/bin/sh
set -eu

_ip="192.168.0.30"
_port="28801"
_user="igor"

ssh -l "${_user}" -p "${_port}" "${_ip}" '/home/igor/hid/scripts/server.sh'

printf 'Waiting for rpicam-vid to settle...\n'
sleep 3

printf 'Starting ffplay...\n'
( ffplay -loglevel fatal -strict experimental -vf setpts=0 -fflags nobuffer -flags low_delay -framedrop -i "tcp://${_ip}:8494" & ) > /dev/null 2>&1

printf 'Starting keyboard...\n'
ssh -l "${_user}" -p "${_port}" "${_ip}" -t 'node /home/igor/hid/src/main.js'
