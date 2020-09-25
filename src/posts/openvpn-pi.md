---
title: "Running OpenVPN server with Docker on a Raspberry Pi with NoIP"
date: "2020-02-22"
---

![OpenVPN](./openvpn.png)

Want to run an OpenVPN server on your Raspberry Pi inside a Docker container? Want to use NoIP because you don’t have a static IP address? You’ve come to the right place.

## Setting up a NoIP hostname

NoIP is a dynamic DNS service where you can get up to 3 free hostnames. However, you must remember to confirm that you want to keep each hostname every 30 days.
After creating a NoIP account, download & compile the NoIP Dynamic Update Client on the Raspberry Pi with the following commands. This will update NoIP with your current public IP address that your ISP assigns to you.
(You don’t need to type the ‘$’, this is just the beginning of your terminal line.)

```
$ cd /usr/local/src
$ sudo wget http://www.no-ip.com/client/linux/noip-duc-linux.tar.gz
$ sudo tar xzf noip-duc-linux.tar.gz
$ cd noip-2.1.9-1
$ sudo make
$ sudo make install
```

Log in with your NoIP account when prompted during the `make install` command. You will also be asked how often you want to update NoIP with your IP address. The minimum is 5 (this interval is in minutes). Personally, I went with the default 30 minutes. It will also ask if you want to run a script on a successful update, I chose the default No option.

Now we will set up the service that will start the DUC client when the Pi boots.

```
$ cd /usr/local/src
$ sudo wget https://github.com/SenorGrande/noip-duc-raspbian/archive/v1.0.tar.gz
$ sudo tar xzf v1.0.tar.gz
$ cd noip-duc-raspbian-1.0
$ sudo ./service.install.sh raspbian
```

If everything worked, the command line should display `./service.install.sh: installing noip2 service for raspbian... OK!`

To confirm that the service is working, run `sudo noip2 -S`

To uninstall the service run `$ ./service.uninstall.sh rasbian` in the same directory where you ran the install script.

Execute `$ sudo noip2 -S` to see the process has stopped.

## Docker container OpenVPN server

We are going to use the following Docker image available on Docker Hub. This one works with devices with ARM processors, such as the Raspberry Pi.
Pull this image by running `$ docker pull giggio/openvpn-arm` in your terminal.

Create the following environment variable in the terminal.
`$ OVPN_DATA="ovpn-data"` (This will be the name of the Docker volume that will hold our OpenVPN server configuration and client certificates).
The following commands will create temporary Docker containers to generate the OpenVPN server files we need and store them in the Docker volume.
Replace `VPN.SERVERNAME.COM` with your NoIP hostname.

```
$ docker volume create --name $OVPN_DATA
$ docker run -v $OVPN_DATA:/etc/openvpn --rm giggio/openvpn-arm  ovpn_genconfig -u udp://VPN.SERVERNAME.COM
$ docker run -v $OVPN_DATA:/etc/openvpn --rm -it giggio/openvpn-arm ovpn_initpki nopass
```

Once that is all finished, you can start up your new OpenVPN server with this Docker run command: `$ docker run -v $OVPN_DATA:/etc/openvpn -d --name openvpn -p 1194:1194/udp --cap-add=NET_ADMIN giggio/openvpn-arm`

To create a “user” and generate an OpenVPN client certificate, run the following command which will spin up a temporary Docker container. This will create the certificate and save it to the OpenVPN volume:
(Replace `CLIENTNAME` with a name of your choosing)

```
$ docker run -v $OVPN_DATA:/etc/openvpn --rm -it giggio/openvpn-arm easyrsa build-client-full CLIENTNAME nopass
```

To retrieve the client certificate and store it in a .ovpn file, the following command will create a temporary Docker container like the previous command. However, it will pipe the output of the client certificate we just created into a “.ovpn” file in your current directory.

```
$ docker run -v $OVPN_DATA:/etc/openvpn --rm giggio/openvpn-arm ovpn_getclient CLIENTNAME > CLIENTNAME.ovpn
```

I hope you found this useful.
Chur.

Resources:
[How to properly install no ip dynamic update client duc under raspian](https://sizious.com/2017/04/30/how-to-properly-install-no-ip-dynamic-update-client-duc-under-raspbian/)
[OpenVPN Docker Image for ARM](https://hub.docker.com/r/giggio/openvpn-arm)
