FROM public.ecr.aws/o0l6m7s1/prod-base-caddy-repo:latest

RUN apk add curl

EXPOSE 80

CMD ["/usr/bin/caddy", "run", "--config", "/etc/caddy/Caddyfile"]
