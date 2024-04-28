#!/bin/sh

_ip="192.168.0.30"

ssh "${_ip}" '/home/igor/hid/scripts/server.sh'
printf 'Waiting for libcamera-vid to settle...\n'
sleep 4
printf 'Starting ffplay...\n'
ffplay -loglevel error -fflags nobuffer -flags low_delay -framedrop -i "tcp://${_ip}:8494"
