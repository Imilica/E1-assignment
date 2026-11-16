#!/usr/bin/env bash
# Start the server in the background. Logs: server.log, PID: .server.pid
cd "$(dirname "$0")/.." || exit 1
if [ -f .server.pid ] && kill -0 "$(cat .server.pid)" 2>/dev/null; then
  echo "Already running (PID $(cat .server.pid))"; exit 0
fi
nohup node server.js > server.log 2>&1 &
echo $! > .server.pid
for _ in $(seq 1 30); do
  grep -q "Sandbox running" server.log 2>/dev/null && { cat server.log; exit 0; }
  kill -0 "$(cat .server.pid)" 2>/dev/null || { echo "Failed to start:"; cat server.log; rm -f .server.pid; exit 1; }
  sleep 0.2
done
echo "Started (PID $(cat .server.pid))"
