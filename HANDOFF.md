# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-26, 8차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 6100줄): 브레드보드+회로도+PCB 편집·시뮬레이터. 사용자 요청마다 기능 추가·수정

## 현황 (모두 main 반영 = `dc92878`, 아티팩트 v53, `APP_VER='2026-11-26 · md 내려받기'`)
✓ 기존: 안내서 `breadboard/FILE-FORMAT.md`(+index.html 사본 `<script id="guideMd">`), [AI 회로](AI 호출 없이 안내·붙여넣기), [전선 정리], `autoLayout`, 표시기 잔상, 불러오기 버그 수정, 예제 36개(부품 220가지 모두 사용)
✓ 오류 알림: 경고에 부품 id(`W_[i][2]`) → 알림 카드 `notifyWarns`(3초 안 반복 X, 전원 꺼짐 제외)·깜박 테두리 `warnRings`·[보기]/점검 목록 클릭 `focusComp`
✓ PCB 탭(VM='pcb'): `#pcbbar`·`#pw`·`#pside`. SCH+`schNets`로 넷, IC VCC/GND 강제 전원망, J1 전원 헤더 자동, clk→헤더(OUT,GND). `fpDef`(mm), `PCB={w,h,fps[{key,x,y,rot}],tr[{l,w,a,b}],vias,clr,tw}` 저장 키 'pcb'·파일 `pcb`. `pcalc`/`pcbDRC`(캐시), `pcbAutoRoute`/`routeOnce`(1.27mm A*, 비아, 4회 재시도, 8초 제한), 손 배선 `routeClick`(V=비아), `pcbGerbers`+`makeZip`(거버6+드릴+BOM+pos+README), SVG. loadComps 때 PCB 비움
✓ 연결 체크 막대: `#bcbar`/`#scbar`(진행·[초기화] 두 번·[끝내기]), 확대 버튼 위 ✓ `#hchk`/`#schk2`(휴대폰에서 도구 막대 끝 버튼 안 보이던 문제). `chkBar`·`chkReset`
✓ 순서 카드: 체크 막대 [순서 카드] → `#plan`. `planSteps` = 부품 카드(INST→IC→표시기→나머지) + 연결 카드(핀의 줄 `stripOf`=baseRep에서 나가는 전선을 이어서 따라감, 전선 1회씩). `planOverlay`·`planShow`(카드 위 화면에 맞춰 확대), [다 했어요]=c.done. body.planon이면 막대 숨김·토스트 위로
✓ 내려받기: `saveAny` = downloads 기능 → 휴대폰 공유 창(navigator.share) → 틀 안이면 `showFallback`(#fbDlg [전체 복사]) → a[download](터치는 octet-stream). `saveBinFile`도 saveAny
✓ 깃허브 페이지 켜져 있음(공개 저장소, main push 1분 뒤 자동 배포): https://co2maker-cyber.github.io/3rd-/breadboard/ — README 맨 위·CLAUDE.md에 기재
✓ 시험 전부 통과: 회귀 45 + verify74 106/106 + verify-parts 111/111 + guide-sync + tests/ui 18종(alerts, check-reset, plan-cards, save-file, pcb-edit, pcb-examples, sweep-* 등)
✗ 실기기 미검증: 아이폰 핀치·공유 창 저장, 윈도우 크롬 실제 .md 저장
✗ 거버 외부 뷰어 검증 못 함 — `pip install gerbonara` 권한 거부, 자체 구조 검사만
△ PCB 자동 배선: 36예제 DRC 오류 0, 못 이음 199/2878(큰 LED·스위치 모음). 0.635mm 격자 시도 → 대각선 간격 0.05mm 위반·50초 → 되돌림

## 사용자 지시 기록 (사람의 창작 기여 — COPYRIGHT.md 10절, 계속 덧붙일 것)
- ~11-24: 브레드보드+회로도 시뮬레이터 기능 방향, CAD 안 AI 직접 호출 금지(안내만), 부품 220종 모두 예제에 쓰기, 자동 main 반영
- 11-25: 오류 난 부품 알림, PCB 설계 기능, 업데이트마다 접속 링크, 깃허브 페이지로 바로 열기
- 11-26: 브레드보드 연결 체크 + 초기화 버튼, 핀에서 이어지는 전선을 카드로 순서대로, 안내 md 내려받기 고침(윈도우 저장 창 스크린샷), 전보체 진행 메모, 「저작권법 준수 가이드」(8항목) 적용 → 재검토 지시

## 결정사항
- CAD 안 AI 호출 금지 — 사용자 지시
- `showSaveFilePicker` 안 씀 — 윈도우에서 .md 확장자 빠짐(사용자 스크린샷)
- PCB 격자 1.27mm 유지 — 0.635mm는 DRC 위반·느림
- ASC4-16 자리 0=왼쪽 유지 — 사용자에게 물었으나 답 없음(?)
- 건전지·PSU 있으면 레일 자동 5V 없음, 미사용 게이트 입력 비움 — 실제와 같게

## 이슈/주의
- 미답: `router/index.html` 부팅 화면에 실제 회사 부팅 문구(cisco Copyright 등) 그대로 — 브레드보드 범위 밖이라 안 고침, 고칠지 사용자 확인 필요
- `tests/ui/ic-examples.js`는 다른 시험과 동시에 돌리면 가끔 FAIL(시간 의존) — 단독 재실행하면 PASS
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, **업데이트마다 아티팩트 링크 무조건**, main 반영 시 깃허브 페이지 주소도, 휴대폰·PC 스크린샷 피드백
- CLAUDE.md: 시험→커밋→`git push -u origin ccr-957126bc-kqjtgb`→`git push origin HEAD:main`(ff 아니면 알림), PR은 요청 시만. 커밋 끝 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 코드 수정 = Python 문자열 치환(개수 assert). 긴 줄은 `cut -c`
- 레일은 6의 배수 열 구멍 없음 — 시험 우회 열도 피할 것
- 회귀: 각 스크립트 끝 줄이 `errors []`면 정상(폰트 접속 되면 나옴). t20은 시간 의존
- iframe 시험은 setContent 말고 임시 wrapper .html 파일로(about:blank는 file:// 못 띄움)
- 아티팩트 재게시: 같은 file_path, 새 대화 첫 게시는 거절 후 재시도. 바꾸면 `APP_VER` 올리기
- "안 바뀜" → 새로고침·[AI 회로] 창 버전표시 확인 안내

## 다음 할 일
1. 사용자 피드백 대기(직전: 안내서 .md 컴퓨터 내려받기 고침 → main·게시 완료)
2. PCB 개선 후보: 자동 배선 성공률, GND 구리 채우기, 뒷면 부품, 3D 미리보기
3. 미답: ASC4-16 자리 0=오른쪽으로 바꿀지(바꾸면 예제 ledasc 수정)
4. 변경마다: 회귀+verify74+verify-parts+guide-sync+tests/ui 전체 → 커밋 → 두 브랜치 push → 아티팩트 재게시 → 링크 2개 안내

## 참조
- 저작권: `breadboard/COPYRIGHT.md` 0절 고지·3절 자체 구현 표·11절 체크리스트. 외부 글꼴·라이브러리 없음 유지. 부품·문구·에셋 추가 땐 5절 점검
- 파일: `/home/user/3rd-/breadboard/index.html` 본체 / `breadboard/FILE-FORMAT.md` / `breadboard/README.md` / `breadboard/COPYRIGHT.md` / `/home/user/3rd-/CLAUDE.md` / `/home/user/3rd-/HANDOFF.md`
- 시험: `node breadboard/tests/verify74.js`, `node breadboard/tests/verify-parts.js`, `node breadboard/tests/guide-sync.js`(고치면 `--fix`), `for f in breadboard/tests/ui/*.js; do node $f | tail -1; done`(전체 약 15분, 백그라운드)
- 회귀(스크래치패드, 소실 가능): `/tmp/claude-0/-home-user-3rd-/0e796133-b619-5612-af72-c86b90ba9a5e/scratchpad/` t*.js, 기준 `reg8.txt` — `for t in t t5 t6 t7 t8 t11 t13 t14 t15 t16 t18 t19 t20 t21 t22 t23 t24 t25 t26 t27 t28 t29 t30 t31 t32 t33 t34 t35 t36 t37 t38 t39 t40 t41 t42 t43 t44 t45 t46 t47 t48 t49 t50 t53 t54; do node $t.js 2>&1 | grep -v TUNNEL | tail -1; done`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ (예제는 끝에 `#lg2` 등)
- 깃허브 페이지: https://co2maker-cyber.github.io/3rd-/breadboard/
- 브랜치: `ccr-957126bc-kqjtgb` = main `dc92878`
