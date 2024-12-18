#!/bin/sh
set -eu
_fn="$(basename "${0}")"
_parent_dir="$(dirname "$(dirname "$(readlink -f "${0}")")")"

_user="igor"
_ip="localhost"
_port="58801"
_info="${_user}@${_ip}:${_port}"

_log() {
    printf '[\033[36m%s\033[0m] %s\n' "${_fn}" "${1}"
}

_log "Starting ffmpeg server on ${_info}"
ssh -l "${_user}" -p "${_port}" "${_ip}" '/home/igor/hid/scripts/server.sh'

_log "Waiting for ffmpeg to settle on ${_info}"
sleep 3

_server="tcp://localhost:58494"
_log "Connecting ffplay to ${_server}"
( ffplay -loglevel fatal -strict experimental -vf setpts=0 -fflags nobuffer -flags low_delay -framedrop -i "${_server}" & ) > /dev/null 2>&1

_log "Starting keyboard emulator client"
node "${_parent_dir}/src/client.js"

_log 'Exited.'
