#!/bin/sh
set -eu
_fn="$(basename "${0}")"

_log() {
    printf '[\033[35m%s\033[0m] %s\n' "${_fn}" "${1}"
    printf '[%s][%s] %s\n' "${_fn}" "$(date -Is)" "${1}" >> /var/log/hid.log
}

cd /sys/kernel/config/usb_gadget/ || exit 1

# https://www.kernel.org/doc/Documentation/usb/gadget_configfs.txt
if [ -d "logi" ]
then
    _log "Gadget exists, removing..."
    cd logi || exit 1
    echo "" > UDC
    sleep 2
    rm configs/c.1/hid.usb0
    rmdir configs/c.1/strings/0x409
    rmdir configs/c.1
    rmdir functions/hid.usb0
    rmdir strings/0x409
    cd ..
    rmdir logi
    _log "Gadget removed."
    sleep 2
fi

_log "Adding gadget..."

mkdir -p logi
cd logi || exit 1

echo 0x1d6b > idVendor
echo 0x0104 > idProduct
echo 0x0100 > bcdDevice
echo 0x0200 > bcdUSB

mkdir -p strings/0x409
echo "2347-15213" > strings/0x409/serialnumber
echo "Logitech" > strings/0x409/manufacturer
echo "Logitech USB Keyboard" > strings/0x409/product

mkdir -p configs/c.1/strings/0x409
echo "Configuration 1" > configs/c.1/strings/0x409/configuration
echo 250 > configs/c.1/MaxPower
echo 0xa0 > configs/c.1/bmAttributes

mkdir -p functions/hid.usb0
echo 1 > functions/hid.usb0/protocol
echo 1 > functions/hid.usb0/subclass

# if kernel supports it, enable wakeup_on_write
if [ -f "functions/hid.usb0/wakeup_on_write" ]
then
    echo 1 > functions/hid.usb0/wakeup_on_write
    _log "Enabled wakeup_on_write."
else
    _log "Warning: wakeup_on_write is not supported."
fi

echo 8 > functions/hid.usb0/report_length
printf "\x05\x01\x09\x06\xa1\x01\x05\x07\x19\xe0\x29\xe7\x15\x00\x25\x01\x75\x01\x95\x08\x81\x02\x95\x01\x75\x08\x81\x03\x95\x05\x75\x01\x05\x08\x19\x01\x29\x05\x91\x02\x95\x01\x75\x03\x91\x03\x95\x06\x75\x08\x15\x00\x25\x65\x05\x07\x19\x00\x29\x65\x81\x00\xc0" > functions/hid.usb0/report_desc
ln -s functions/hid.usb0 configs/c.1/

ls /sys/class/udc > UDC

while [ ! -c /dev/hidg0 ]
do
  _log "Waiting for hid to settle..."
  sleep 1
done

chmod 666 /dev/hidg0
_log "Gadget added."
