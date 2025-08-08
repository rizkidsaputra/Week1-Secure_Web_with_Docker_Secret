FROM redis:7-alpine

COPY redis-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/redis-entrypoint.sh

ENTRYPOINT ["redis-entrypoint.sh"]
