#!/bin/sh
set -e
cd "$(dirname "$0")/.."
pnpm exec prisma migrate deploy
node dist/server.js
