#!/bin/bash
set -e
npm install
if node -e "process.exit(require('./package.json').scripts?.['db:push'] ? 0 : 1)" 2>/dev/null; then
  npm run db:push
else
  echo "Skipping db:push: no db:push script defined in package.json."
fi
