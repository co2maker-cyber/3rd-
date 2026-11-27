#!/bin/sh
# 브레드보드 CAD를 내 컴퓨터에서 열기: 이 폴더를 작은 웹 서버(파이썬 3)로 띄우고 브라우저를 연다. 끝내려면 Ctrl+C
cd "$(dirname "$0")" || exit 1
PORT=${PORT:-8765}
PY=$(command -v python3 || command -v python)
if [ -z "$PY" ]; then echo "파이썬이 없어요. index.html 을 더블클릭해서 여세요."; exit 1; fi
URL="http://localhost:$PORT/index.html"
( sleep 1; (command -v xdg-open >/dev/null && xdg-open "$URL") || (command -v open >/dev/null && open "$URL") || echo "브라우저에서 $URL 을 여세요" ) &
echo "브레드보드 CAD: $URL  (끝내려면 Ctrl+C)"
exec "$PY" -m http.server "$PORT" --bind 127.0.0.1
