FROM nginx:1.25-alpine

# openssl: generate self-signed placeholder cert on first boot
RUN apk add --no-cache openssl

# Template is processed at startup by entrypoint.sh (envsubst is built into nginx:alpine)
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p /var/log/nginx /var/www/certbot && \
    touch /var/log/nginx/access.log /var/log/nginx/error.log

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
