#!/bin/bash

#start redis and wait for confirmation that is is running
service redis-server start
while ! service redis-server status | grep -m1 'redis-server is running.'; do
    sleep 1
done
#run the app
node index.js