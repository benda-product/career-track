#!/bin/sh
set -e

if [ -d /benda-infotech/packages/ecosystem-auth ]; then
  mkdir -p /app/node_modules/@benda
  ln -sfn /benda-infotech/packages/ecosystem-auth /app/node_modules/@benda/ecosystem-auth
fi

# Dev tools (ts-node-dev) live in devDependencies — force include even if NODE_ENV=production.
npm install --include=dev --no-package-lock --no-audit --no-fund || echo "npm install warning (continuing)"

if [ -d /benda-infotech/packages/ecosystem-auth ]; then
  mkdir -p /app/node_modules/@benda
  ln -sfn /benda-infotech/packages/ecosystem-auth /app/node_modules/@benda/ecosystem-auth
fi

exec npm run dev
