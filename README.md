### raspian image
```
(download: Alpine Raspberry Pi ARM64)
7z x alpine-rpi-3.19.1-aarch64.img.gz
dd if=alpine-rpi-3.19.1-aarch64.img of=/dev/sdd bs=4M conv=fsync
```

### debian vm vbox stuff
```
apt install linux-headers-amd64
apt install gcc make perl
(install guest additions)
reboot
```

### setup sudo and shared folders
```
/sbin/usermod -a -G vboxsf igor
/sbin/usermod -a -G sudo igor
(power settings)
```

### install build stuff
```
apt install git bc bison flex libssl-dev make libc6-dev libncurses5-dev
apt install crossbuild-essential-arm64
reboot
```

### clone
```
git clone --depth=1 https://github.com/raspberrypi/linux
git clone https://github.com/karabaja4/hid.git
```

### patch the kernel
```
cd linux
patch -p1 < ../hid/config/wakeup.patch
```

### configure
```
KERNEL=kernel8
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- bcm2711_defconfig
```

### build
```
make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- Image modules dtbs
```

### copy new kernel to sd
```
mkdir mnt
mkdir mnt/fat32
mkdir mnt/ext4
sudo mount /dev/sdb1 mnt/fat32
sudo mount /dev/sdb2 mnt/ext4

sudo env PATH=$PATH make ARCH=arm64 CROSS_COMPILE=aarch64-linux-gnu- INSTALL_MOD_PATH=mnt/ext4 modules_install

sudo cp arch/arm64/boot/Image mnt/fat32/vmlinuz-rpi
sudo cp arch/arm64/boot/dts/broadcom/*.dtb mnt/fat32/
sudo cp arch/arm64/boot/dts/overlays/*.dtb* mnt/fat32/overlays/
sudo cp arch/arm64/boot/dts/overlays/README mnt/fat32/overlays/
sudo umount mnt/fat32
sudo umount mnt/ext4
```

### configure modules
```
echo "dwc2" | tee -a /etc/modules
echo "libcomposite" | tee -a /etc/modules
```

### configure usercfg.txt
```
(copy usercfg.txt to /boot/usercfg.txt)
(already includes "dtoverlay=dwc2")
```

### setup rcc
```
wget https://raw.githubusercontent.com/karabaja4/arch/master/scripts/openrc.sh
chmod +x /root/openrc.sh
ln -s /root/openrc.sh /usr/bin/rcc
```

### setup libcamera on alpine
```
cd /etc/apk/keys/
wget https://avacyn.radiance.hr/alpine/signature/igor-66365347.rsa.pub
cd
apk add --repository=https://avacyn.radiance.hr/alpine/packages/libcamera/ raspberrypi-libcamera raspberrypi-libcamera-raspberrypi rpicam-apps
```

### setup udev
```
addgroup igor video
setup-devd udev
nano /etc/udev/rules.d/dmaheap.rules
SUBSYSTEM=="dma_heap", GROUP="video", MODE="0660"
```

### disk image
```
dd if=/dev/sdd conv=sync,noerror bs=64K | gzip -c > /path/to/backup.img.gz
gunzip -c /path/to/backup.img.gz | dd of=/dev/sdd
```