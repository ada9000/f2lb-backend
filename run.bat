docker stop f2lb
docker rm f2lb
docker build . -t node-f2lb
docker run --name f2lb -p 4000:4000 -d node-f2lb