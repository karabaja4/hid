#!/bin/sh

_ip="192.168.0.30"

ssh "${_ip}" '/home/igor/hid/camera/server.sh'
printf 'Waiting for libcamera-vid to settle...\n'
sleep 5
ffplay "tcp://${_ip}:8494" -fflags nobuffer -flags low_delay -framedrop