#!/bin/sh

v4l2-ctl --device /dev/video0 --set-ctrl=focus_automatic_continuous=0
v4l2-ctl --device /dev/video0 --set-ctrl=focus_absolute=95
