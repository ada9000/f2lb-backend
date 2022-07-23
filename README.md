# F2LB backend
* The api used by f2lb

# Requirements
First you must install redis (debian example)
* install redis ```sudo apt install redis-server```
* start redis ```sudo systemctl restart redis.service```
* yarn is required ```sudo apt install nodejs npm && npm install --global yarn```

# Build
Ensure you have met the requirements. 
* ```cp .env.example .env```
* in .env change YOUR_API_KEY_HERE to your https://blockfrost.io/dashboard mainnet key 
* yarn install
* yarn start