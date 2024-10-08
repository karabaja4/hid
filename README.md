### alpine image
```
(download: Alpine Raspberry Pi ARM64)
7z x alpine-rpi-3.19.1-aarch64.img.gz
dd if=alpine-rpi-3.19.1-aarch64.img of=/dev/sdc bs=4M conv=fsync
```

### disk image
```
dd if=/dev/sdc conv=sync,noerror bs=64K | gzip -c > /path/to/backup.img.gz
gunzip -c /path/to/backup.img.gz | dd of=/dev/sdc
dd if=/dev/zero of=/dev/sdc bs=1M
```

### configure modules
```
nano /etc/modules
dwc2
libcomposite
```

### configure usercfg.txt
```
(copy usercfg.txt to /boot/usercfg.txt)
(already includes "dtoverlay=dwc2")
```

### configure gpu_mem (only if no camera, camera needs 64M)
```
apk add raspberrypi-bootloader-cutdown
nano /boot/config.txt
gpu_mem=16
(only works from config.txt)
```

### setup rcc
```
cd
wget https://raw.githubusercontent.com/karabaja4/arch/master/scripts/openrc.sh
chmod +x /root/openrc.sh
ln -s /root/openrc.sh /usr/bin/rcc
```

### setup aports
```
apk add alpine-sdk (+reboot)
addgroup igor abuild (+logout)
git clone https://gitlab.alpinelinux.org/alpine/aports.git
copy to $HOME/.abuild/: abuild.conf igor-66365347.rsa igor-66365347.rsa.pub
copy to /etc/apk/keys/: igor-66365347.rsa.pub
```

### build libcamera aport
```
aports/testing/libpisp/
aports/testing/raspberrypi-libcamera/
aports/testing/rpicam-apps/
abuild -r
```

https://wiki.alpinelinux.org/wiki/User:Krystianch
https://gitlab.alpinelinux.org/alpine/aports/-/merge_requests/59410
https://gitlab.alpinelinux.org/krystianch/aports.git

### setup libcamera on alpine
```
cd /etc/apk/keys/
wget https://avacyn.radiance.hr/alpine/signature/igor-66365347.rsa.pub
cd
nano /etc/apk/repositories (enable community)
apk update
apk add --repository=https://avacyn.radiance.hr/alpine/packages/libcamera/ raspberrypi-libcamera raspberrypi-libcamera-raspberrypi rpicam-apps
```

### setup udev
```
setup-devd udev
```

### fix dma_heap
```
addgroup igor video
nano /etc/udev/rules.d/dmaheap.rules
SUBSYSTEM=="dma_heap", GROUP="video", MODE="0660"
```

### setup linux-rpi aport
```
aports/main/linux-rpi
pkgrel=99
https://raw.githubusercontent.com/karabaja4/hid/master/config/wakeup.patch
a6536ab83bf5efaf0ebda4bab256e9f0018e4c9287b8f482bda9d28f460858ad6e9e363f5ea2c44443b5cf2f4fa008d5a1040f69b6c910effe1c4d64167e3013
abuild -r
```

### install patched kernel
```
nano /etc/apk/repositories
https://avacyn.radiance.hr/alpine/packages/kernel2/
apk update
apk upgrade
nano /etc/apk/world
linux-rpi=6.6.31-r99
```

### setup local.d
```
ln -s /home/igor/hid/config/hid.sh /etc/local.d/hid.start
rcc enable local
```

### setup doas
```
copy hid.conf to /etc/doas.d/hid.conf
chown root:root hid.sh
```

### modules blacklist
```
nano /etc/modprobe.d/igor.conf

# needed for integrated wifi
blacklist brcmfmac
blacklist brcmutil

# needed for bt
blacklist btbcm
blacklist hci_uart
```

