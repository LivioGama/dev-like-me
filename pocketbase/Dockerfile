FROM alpine:latest

ARG PB_VERSION=0.26.6

RUN apk add --no-cache \
    unzip \
    ca-certificates

# Download and unzip PocketBase
ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb/

EXPOSE 8080

# Start PocketBase with args to handle encryption key
CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8080"]
