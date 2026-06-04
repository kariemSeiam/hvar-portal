#!/bin/sh
set -e

# Substitute environment variables in nginx.conf
# BACKEND_HOST and BACKEND_PORT are used for upstream configuration

export BACKEND_HOST=${BACKEND_HOST:-backend}
export BACKEND_PORT=${BACKEND_PORT:-5000}

# Use envsubst to replace variables in nginx config
envsubst '${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/nginx.conf > /tmp/nginx.conf.tmp
mv /tmp/nginx.conf.tmp /etc/nginx/nginx.conf

# Start nginx
exec nginx -g "daemon off;"
