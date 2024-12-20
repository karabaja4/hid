#!/bin/sh
set -eu
_fn="$(basename "${0}")"

_name='ffmpeg'

_log() {
    printf '[\033[35m%s\033[0m] %s\n' "${_fn}" "${1}"
}

if pgrep -x "${_name}" > /dev/null
then
    _log "${_name} is already running, killing..." 
    killall -TERM "${_name}"
    sleep 1
    while pgrep -x "${_name}" > /dev/null
    do
        _log "Waiting for ${_name} to exit..."
        sleep 1
    done
    _log "${_name} has been killed."
fi

_log "Starting ${_name}..."
( ffmpeg -f v4l2 -input_format mjpeg -video_size 1280x720 -i /dev/video0 -preset ultrafast -vcodec libx264 -tune zerolatency -f mpegts tcp://0.0.0.0:8494?listen & ) > /dev/null 2>&1

_log "Waiting for ${_name} to settle"
sleep 3

_log "Focusing camera"
v4l2-ctl --device /dev/video0 --set-ctrl=focus_automatic_continuous=0
v4l2-ctl --device /dev/video0 --set-ctrl=focus_absolute=95
