FROM caddy:2.7.6-alpine

RUN apk add curl

EXPOSE 80

CMD ["/usr/bin/caddy", "run", "--config", "/etc/caddy/Caddyfile"]
