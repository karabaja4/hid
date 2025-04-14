#!/bin/sh
set -eu
_fn="$(basename "${0}")"

_name='ffmpeg'
_camera='/dev/video0'
_resolution='1280x720'
_port='8494'
_address="tcp://0.0.0.0:${_port}"

_log() {
    printf '[\033[35m%s\033[0m] %s\n' "${_fn}" "${1}"
}

if pgrep -x "${_name}" > /dev/null
then
    _i=1
    _killed=0
    _log "${_name} is already running, terminating..."
    killall -TERM "${_name}"
    sleep 1
    while pgrep -x "${_name}" > /dev/null
    do
        if [ "${_i}" -ge 11 ] && [ "${_killed}" -eq 0 ]
        then
            _log "${_name} did not exit after 10 seconds, killing..."
            killall -KILL "${_name}"
            _i=1
            _killed=1
        fi
        _log "Waiting for ${_name} to exit (${_i})..."
        sleep 1
        _i=$((_i + 1))
    done
    _log "${_name} has exited."
fi

_log "Starting ${_name} on ${_address}..."
( ffmpeg -f v4l2 -input_format mjpeg -video_size "${_resolution}" -i "${_camera}" -preset ultrafast -vcodec libx264 -tune zerolatency -b:v 500k -maxrate 500k -bufsize 1M -f mpegts "${_address}?listen" & ) > /dev/null 2>&1

_log "Waiting for ${_name} to settle"
sleep 5

_log "Focusing camera"
v4l2-ctl --device "${_camera}" --set-ctrl=auto_exposure=1
v4l2-ctl --device "${_camera}" --set-ctrl=exposure_time_absolute=250
v4l2-ctl --device "${_camera}" --set-ctrl=focus_automatic_continuous=0
v4l2-ctl --device "${_camera}" --set-ctrl=focus_absolute=90
