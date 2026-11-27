@echo off
rem 브레드보드 CAD를 내 컴퓨터에서 열기: 이 폴더를 작은 웹 서버(파이썬 3)로 띄우고 브라우저를 연다. 끝내려면 이 창을 닫으세요
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8765
where py >nul 2>nul && (set PY=py -3) || (where python >nul 2>nul && (set PY=python) || goto nopy)
start "" "http://localhost:%PORT%/index.html"
echo 브레드보드 CAD: http://localhost:%PORT%/index.html  (끝내려면 이 창을 닫으세요)
%PY% -m http.server %PORT% --bind 127.0.0.1
goto :eof
:nopy
echo 파이썬이 없어요. index.html 을 더블클릭해서 여세요.
start "" "%~dp0index.html"
pause
