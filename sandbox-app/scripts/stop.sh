#!/usr/bin/env bash
# Stop the background server started with start.sh
cd "$(dirname "$0")/.." || exit 1
if [ -f .server.pid ] && kill -0 "$(cat .server.pid)" 2>/dev/null; then
  kill "$(cat .server.pid)" && echo "Stopped (PID $(cat .server.pid))"
else
  echo "Not running"
fi
rm -f .server.pid
