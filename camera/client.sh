#!/bin/sh

ffplay tcp://192.168.0.30:8494 -fflags nobuffer -flags low_delay -framedrop