#!/bin/sh

# 0 0 * * 1 /home/felfire-backend-master/cronjob/cloudflare-ufw.sh > /dev/null 2>&1

curl -s https://www.cloudflare.com/ips-v4 -o /tmp/cf_ips
curl -s https://www.cloudflare.com/ips-v6 >> /tmp/cf_ips

for cfip in `cat /tmp/cf_ips`; do ufw allow from $cfip comment 'Cloudflare IP'; done

ufw reload > /dev/null