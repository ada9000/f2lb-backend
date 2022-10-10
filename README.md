# F2LB backend

- The api used by f2lb

# Requirements

First you must install redis (debian example)

- install redis `sudo apt install redis-server`
- start redis `sudo systemctl restart redis.service`
- yarn is required `sudo apt install nodejs npm && npm install --global yarn`

# Build

Ensure you have met the requirements.

- `cp .env.example .env`
- in .env change YOUR_API_KEY_HERE to your [google api key](https://developers.google.com/sheets/api/guides/authorizing#APIKey)
- note the google api key may need [activating](https://console.cloud.google.com/apis/api/sheets.googleapis.com/)
- yarn install
- yarn start

# Notes

- Due to the use of a google sheet we need to use a google API key to scrape the data

# TODO

- [] refactor to use ts
- [] use sentry logging
- [] use firebase auth to allow for admin site
