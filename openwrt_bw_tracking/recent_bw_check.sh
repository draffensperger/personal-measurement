#!/bin/sh
# See
# Requires wrtbwmon, see https://github.com/pyrovski/wrtbwmon
# Also requires curl, use `opkg update && opkg install curl`
# Add to the OpenWRT crong job config:
#    */5 * * * * /root/recent_bw_check.sh
# In http://192.168.1.1/cgi-bin/luci/admin/system/crontab
# Then run `service cron restart`.
# Also set up the config files:
# echo "YOUR_KEY" > ~/record_event_key
# echo "MAC_ADDR1 MAC_ADDR2 MAC_ADDR3" > ~/record_event_macs

wrtbwmon update /tmp/usage.db
cur_date_unix=$(date +%s)

# Mac addresses to report events on
macs=$(cat ~/record_event_macs)
key=$(cat ~/record_event_key)

# Report event if time is less than this
min_elapsed_secs=600

for mac in $macs; do
  cur_date_unix=$(date +%s)
  # echo "checking $mac" >>/tmp/bw_check.log
  last_date=$(grep "$mac" </tmp/usage.db | cut -d ',' -f 8 | sort -r | head -n 1)
  # echo "last_date: $last_date"
  last_date_unix=$(date -d"$last_date" -D%d-%m-%Y_%H:%M:%S +%s)
  # echo "last date unix: $last_date_unix"
  elapsed_seconds=$((cur_date_unix - last_date_unix))
  # echo "elapsed $elapsed_seconds"
  if [ "$elapsed_seconds" -le "$min_elapsed_secs" ]; then
    # echo "Recording $mac" >>/tmp/bw_check.log
    body="{\"key\":\"${key}\",\"event\":\"Traffic for $mac in past ${min_elapsed_secs}s\"}"
    # echo "$body"
    curl -d "$body" -H "Content-Type: application/json" -X POST \
      https://us-central1-personal-measurement.cloudfunctions.net/recordEvent \
      &>/dev/null 2>&1
  fi
done
