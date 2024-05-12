#!/bin/sh
set -eu
_fn="$(basename "${0}")"

_name='rpicam-vid'

_log() {
    printf '[\033[35m%s\033[0m] %s\n' "${_fn}" "${1}"
}

if pgrep -x "${_name}" > /dev/null
then
    _log "${_name} is already running, killing..." 
    killall -TERM "${_name}"
    while pgrep -x "${_name}" > /dev/null
    do
        _log "Waiting for ${_name} to exit..."
        sleep 1
    done
    _log "${_name} has been killed."
fi

_log "Starting ${_name}..."
( rpicam-vid -t 0 --awbgains 1.2,1.2 --width 1280 --height 720 --framerate 30 --nopreview --listen -o tcp://0.0.0.0:8494 & ) > /dev/null 2>&1
