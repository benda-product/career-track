#!/bin/sh
set -e

if [ -d /benda-infotech/packages/ecosystem-auth ]; then
  mkdir -p /app/node_modules/@benda
  ln -sfn /benda-infotech/packages/ecosystem-auth /app/node_modules/@benda/ecosystem-auth
fi

exec npm run dev
