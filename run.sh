docker stop f2lb-backend
docker rm f2lb-backend
docker build . -t f2lb-backend-image
docker run --name f2lb-backend -p 4000:4000 -d f2lb-backend-image