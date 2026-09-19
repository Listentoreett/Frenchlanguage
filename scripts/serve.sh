#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

if command -v python3 >/dev/null 2>&1; then
  echo "Serving with Python at http://127.0.0.1:5173/app/pronunciation-coach/"
  exec python3 -m http.server 5173 --bind 127.0.0.1
fi

if command -v python >/dev/null 2>&1; then
  echo "Serving with Python at http://127.0.0.1:5173/app/pronunciation-coach/"
  exec python -m http.server 5173 --bind 127.0.0.1
fi

if command -v node >/dev/null 2>&1; then
  exec node ./scripts/server.mjs
fi

echo "Install Python 3 or Node.js, or open app/pronunciation-coach/index.html directly." >&2
exit 1
