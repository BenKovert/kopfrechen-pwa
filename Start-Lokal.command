#!/bin/bash
set -u

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

PROJECT_DIR="/Users/benkovert/kopfrechen-pwa"
PORT=8080
URL="http://localhost:$PORT"
LOG_FILE="/tmp/kopfrechen-pwa-server.log"

cd "$PROJECT_DIR" || {
  echo "Fehler: Ordner $PROJECT_DIR wurde nicht gefunden."
  exit 1
}

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Lokaler Webserver auf Port $PORT läuft bereits."
else
  echo "Starte lokalen Webserver in $PROJECT_DIR auf Port $PORT..."
  nohup python3 -m http.server "$PORT" >"$LOG_FILE" 2>&1 </dev/null &
  SERVER_PID=$!

  i=0
  while [ "$i" -lt 20 ]; do
    if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
      break
    fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      echo "Fehler: Webserver konnte nicht gestartet werden. Details in $LOG_FILE"
      exit 1
    fi
    sleep 0.1
    i=$((i + 1))
  done
fi

echo "Öffne $URL im Standardbrowser..."
open "$URL"
