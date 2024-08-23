#!/bin/sh
set -eu
_fn="$(basename "${0}")"

_ip="my.tunnel.address"
_port="12345"
_user="user"
_server="tcp://localhost:58494"

_log() {
    printf '[\033[36m%s\033[0m] %s\n' "${_fn}" "${1}"
}

_log 'Starting server...'
ssh -l "${_user}" -p "${_port}" "${_ip}" '/home/igor/hid/scripts/server.sh'

_log 'Waiting for rpicam-vid to settle...'
sleep 3

_log "Connecting ffplay to ${_server}..."
( ffplay -loglevel fatal -strict experimental -vf setpts=0 -fflags nobuffer -flags low_delay -framedrop -i "${_server}" & ) > /dev/null 2>&1

_log 'Starting keyboard...'
ssh -l "${_user}" -p "${_port}" "${_ip}" -t 'node /home/igor/hid/src/main.js'

_log 'Exited.'
