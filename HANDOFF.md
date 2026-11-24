# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-24)

## 목표
- 저장소 `co2maker-cyber/3rd-`의 `breadboard/`: 브레드보드에 IC·부품 꽂고 배선해 시험하는 단일 HTML 사이트. 사용자 요청마다 기능 추가.

## 현황
✓ 본체: `/home/user/3rd-/breadboard/index.html` 한 파일(1894줄, 외부 스크립트 없음, Google Fonts만) + `breadboard/README.md`
✓ 시뮬레이션: 디지털 3값 논리(L/H/X + Z·단락), union-find 넷, 저항=약한 연결, 순차 IC 에지 감지
✓ 아날로그: 커패시터 닿은 넷만 RC 풀이(`analogStep`, 후진 오일러, 0.5ms 부분스텝) → NE555 동작
✓ 칩 46종(`CHIPS`): 74HC 10종, 74LS 다수(00~283, 76, 90/93, 112, 192/193, 47/46/48 등), CD4511, NE555
✓ 단독 게이트 7종(`GATES`, 전원 불필요), 7세그 공통 캐소드/애노드(`c.ca`)
✓ CAD 화면: 도구 막대, 위쪽 부품 리본(`renderRibbon`, `CATALOG`), 캔버스(휠 줌·팬), 오른쪽 탭(속성/점검/객체), 명령줄, 상태줄, 다크/라이트
✓ 데이터시트 핀 배치도(`pinoutSVG`), 선택 IC 다리에 핀 이름표
✓ 틴커캐드식 편집: 지우개(`erase`), 선택 막대(`renderFbar`), 오른쪽 클릭 메뉴(`openCtx`), 구멍 끌어 전선(`wireDrag`), 꺾는 점(`c.pts`, `handleDbl`), 범위/다중 선택(`SEL`), 방향키, 복사·붙여넣기·복제, 리본→보드 끌어다 놓기
✓ 보드 여러 장: `S.boards=[{id,type,x,y}]`, 종류 `BTYPES`(std 50열·full 63·half 30·mini 17 레일 없음), `buildHoles()`, 이름표 끌기/메뉴
✓ 파일로 부품 배치: `openImport`→`parseSpec`(텍스트 목록)→`autoLayout`(full 보드, IC 홈, 2단자 e–f 걸침, 넷별 전선, IC 전원 핀 자동 레일)
✓ 예제 9개(`EXAMPLES`: nand, dff, counter, adder, gates, ls47, ls90, t555, sync10), 링크 해시 `#sync10` 등으로 바로 열림
✓ 자동차 관련 전부 삭제(`car1/`, `car2/`, 루트 `index.html` 문구) — 사용자 요청
✓ main 반영 완료: `origin/main` = `ccr-957126bc-kqjtgb` = `c4a1216`
✓ 미리보기 아티팩트 v9 게시(capabilities: `sample{images:true}`, `downloads:true`)
✗ 회로도 사진 → Claude 읽기(`askClaude`, `claude.use('sample')`) 실동작 미검증 — 헤드리스 환경에 window.claude 없음
✗ 아티팩트 [저장](downloads capability) 실동작 미검증
? GitHub Pages 켜짐 여부 미확인 — `co2maker-cyber.github.io` 프록시 403

## 결정사항
- 단일 HTML 유지 — 저장소 기존 실습장(`router/`, `windows/`, `linux/`)과 같은 방식
- 구멍 id: 보드 1은 `a12`, 다른 보드는 `2:a12`(`pref(b)`) — 기존 저장 회로·예제 호환
- IC 좌표는 `c.col`+`c.b`, 다른 부품은 `c.pins`(구멍 id 배열) — `pinHoles(c)`로 통일
- 더블클릭 직접 감지(`lastTap`, 0.4초·6px) — pointerdown 중 재렌더로 브라우저 click/dblclick 미발생
- 선택 막대 캔버스 위쪽 고정 — 선택 부품 위에 띄우면 부품·전선 가림
- 마우스: 보드 밖 끌기=범위 선택, 팬=오른쪽 버튼/휠 버튼/Space. 터치: 한 손가락 끌기=팬
- confirm()/alert() 사용 금지 — 아티팩트에서 막힘, 실행 취소로 대체
- TTL(74LS, `d.ttl`) 떠 있는 입력=HIGH, CMOS=X
- 전원: 레일 있는 모든 보드 레일에 5V/GND(`RAILS`)

## 이슈/주의
- 사용자: 한국어, 비전문가용 쉬운 말투(~해요), 요청 즉시 구현 선호. 결과마다 아티팩트 링크 요구
- main 자동 반영(2026-11-24 사용자 지시 "앞으로는 자동으로 main으로 업데이트") — 변경마다 작업 브랜치 push 후 main에도 fast-forward push. PR은 요청 시에만
- 커밋 메시지 끝: `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 아티팩트 재게시: 같은 `file_path`로 Artifact 호출(URL 유지). `capabilities` 생략 시 기존 선언 유지
- 코드 수정은 Python 문자열 치환 스크립트 방식 사용(치환 대상 개수 검사). 파일이 한 줄이 긴 minified풍 JS라 Edit 전 Read 필요
- 자동 배치는 전선 겹침 정리 안 함. 구멍 모자라면 `report.fail`
- 시험 스크립트(Playwright)는 스크래치패드에만 있음 — 재부팅 시 소실 가능, 저장소 미포함

## 다음 할 일
1. 사용자 새 요청 대기(직전 요청 "main에도 반영해"까지 완료)
2. 요청 시: 사진 읽기·저장을 아티팩트에서 사용자와 함께 확인
3. 변경 후 순서: 회귀 시험(`node t.js`, `t7.js`, `t13.js` 등) → 커밋 → `git push -u origin ccr-957126bc-kqjtgb` → Artifact 재게시

## 참조
- 파일: `/home/user/3rd-/breadboard/index.html` — 본체 / `/home/user/3rd-/breadboard/README.md` — 설명서 / `/home/user/3rd-/index.html` — 실습장 목록 첫 화면
- 시험: `/tmp/claude-0/-home-user-3rd-/0e796133-b619-5612-af72-c86b90ba9a5e/scratchpad/` — t.js(예제 4종), t5.js(74LS 단위+ls90), t6.js(555), t7.js(sync10 검증), t8.js(편집 기능), t11.js(보드 여러 장), t12.js(리본·모바일 폭), t13.js(파일 배치)
- 명령: `cd <스크래치패드> && node t13.js` (Playwright 기본 설치, `chromium.launch()` 옵션 불필요)
- 시뮬레이터 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ (예제 직접 열기: 끝에 `#sync10`)
- 검증 보고서 아티팩트: https://claude.ai/artifact/KdtCZcLRXr4k1VJe29Uho8 (원본 `<스크래치패드>/verify-sync10.html`)
- 브랜치: `ccr-957126bc-kqjtgb` (= main `c4a1216`), 저장소 `co2maker-cyber/3rd-`
