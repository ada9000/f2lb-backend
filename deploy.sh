#!/bin/bash
sudo cp f2lb.service /etc/systemd/system/f2lb.service
sudo systemctl daemon-reload
sudo systemctl restart f2lb
sudo systemctl enable f2lb
