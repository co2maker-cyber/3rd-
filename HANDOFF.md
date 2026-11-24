# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-24, 4차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 4500줄): 브레드보드+회로도 편집·시뮬레이터. 사용자 요청마다 기능 추가

## 현황 (모두 main 반영 = `883024f`, 아티팩트 v37)
✓ 예제 전선 겹침 없음 `gridWires`(10격자 A*), 회로도 선 겹침 없음 `schRoutes`(시간 한도 1.5초, 실패 시 `wireRouteOld`)
✓ 회로도 선 색: 기능별 자동 `schFnNets`/`FNC`(전원 빨강·접지 검정·클럭 노랑·입력 초록·출력 주황·신호 파랑) ↔ 신호 색 `scolMode`, 선별 색 `w.col`, 범례 `#sLeg`
✓ 연결 체크: 회로도 `schk`/`w.done`, 보드 `bchk`/`c.done`(누르면 ✓, 미완료 흐림)
✓ LED·표시 소자 8분류 `LSUB`, 공통 표시 엔진 `disp:'gen'`(`gd`,`els`,`look`,잔상 0.15초,색 섞기) + 드라이버(`ledcat`, `timed` 20ms 스캔) 60여 종, `led3`(3핀 2색, 한 줄), `DRV-14SEG`/`DRV-16SEG`(`FONT14`)
✓ LED 속성 `lk`(blink/res/low/bip)·`pk` 모양 17·`ln` 렌즈 4, 아이콘 `dispIco`/`ledIco`, 회로도 기호 안 실제 표시면 `faceSVG`
✓ 수동 소자·스위치 4분류 `PXSUB`, 새 타입 `t:'px'`(`PX[kind]`: pins/lay row|dip/contacts/res/tap/draw) 34종: 가변저항 9(A/B/C `TAPER`, 분압은 `analogStep`에 `pxR`), SIP 2, 스위치·인코더·셀렉터
✓ 저항 `pw`/`mat`/`tol`/`ser`(E계열 `snapE`,`bands5`, 전력 60% 경고), 커패시터 `dk`/`vr`(`CAPDK`, 전해 1.5배·탄탈 2배 규칙)
✓ 값 고르기 창 `openValPop`/`valSpec`(저항 1Ω~10MΩ E6~E96, 커패시터 1pF~10mF, EDLC 0.1~100F, 가변저항+위치·커브), 보드·회로도 탭 시
✓ 회로도 기호 겹침 정리 `schTidy`/`schFreeSpot`(나선 탐색), `placePw` 범위 확대, 큰 회로 flow 배치
✓ 예제 24개: 기존 10 + LED `ledpk ledfn ledcbi ledseg ledmat ledbar ledsmart leddrv ledbig ledasc` + 수동 `pasres paspot pascap passw`. 여러 보드 `{comps,boards}`
✓ 예제 도우미 `ledKit` 현실화: 부품 먼저·연결 나중(`Q`→`fin`), 몸통 아래 구멍 금지(`cover`), 저항 2~6칸(`resVia`,`nearStrip`,`farStrip`)
✓ 회귀 46개 + `node breadboard/tests/verify74.js` 106/106 통과(disp·ledcat 칩은 제외 → UI 시험)
△ ledbar 회로도: 이름표 근접 1곳, 일부 선 기호 통과(시간 한도) — 허용
✗ 실기기 미검증: 아이폰·아이패드 핀치, 아티팩트 파일 내려받기

## 결정사항
- 제조사·제품명 미사용, 핀 배치는 자체 정의 — `breadboard/COPYRIGHT.md` 5절
- 2색 LED 4핀형(LED-2C3-*)은 "홈 걸치기 4핀형"으로 유지, 진짜 3핀은 `led3`
- 5V 아닌 PSU + 는 회로도 VCC로 안 묶음 — 12V가 5V 레일에 단락되던 버그
- 보드 가변저항 탭 = 값 창(좌우 회전 제거)
- confirm()/alert() 금지(아티팩트 차단)

## 이슈/주의
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, 결과마다 아티팩트 링크, 휴대폰 스크린샷 피드백, 문서(md) 주면 "모두 넣기" 기대
- `CLAUDE.md`: 시험→커밋→`git push -u origin ccr-957126bc-kqjtgb`→`git push origin HEAD:main`(ff 아니면 알림), PR 요청 시만
- 커밋 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 코드 수정 = Python 문자열 치환(개수 assert). 한 줄 긴 JS → `cut -c`로 읽기
- 레일 구멍은 6의 배수 열 없음(6,12,…). 시험 스크립트에서 `tn12` 등 쓰면 settle 오류
- 페이지는 시작 시 store `last` 복원 → 예제 생성 시점 HOLES에 의존 금지(`ledKit.px`는 자체 계산)
- 시간 의존 시험(t5 t6 t7 t13 t18~t24) 출력은 매번 조금 다름 → 정상
- 시험 스크립트 t*.js는 스크래치패드에만 있음(재부팅 시 소실 가능)
- 아티팩트 재게시: 같은 file_path. 새 대화 첫 게시는 거절 후 재시도

## 다음 할 일
1. 사용자 새 요청 대기(직전 요청 전부 완료·게시)
2. 변경 후: 회귀 전체 + verify74 → 커밋 → 두 브랜치 push → 아티팩트 재게시
3. 여유 시 제안: t*.js를 `breadboard/tests/ui/`로 옮기기

## 참조
- 파일: `/home/user/3rd-/breadboard/index.html` 본체 / `breadboard/README.md` / `breadboard/COPYRIGHT.md` / `breadboard/tests/verify74.js` / `/home/user/3rd-/CLAUDE.md`
- 시험: `/tmp/claude-0/-home-user-3rd-/0e796133-b619-5612-af72-c86b90ba9a5e/scratchpad/` t t5 t6 t7 t8 t11 t13~t16 t18~t50 t53~t57, 점검 `real.js <예제키>`(겹침·저항 길이), `schov.js`(회로도 겹침)
- 기준 출력: `/tmp/claude-0/-home-user-3rd-/f8441982-a5ee-4c8a-8bae-a6e6a58e6934/scratchpad/n8/`
- 명령: `cd <시험폴더> && for t in t t5 t6 t7 t8 t11 t13 t14 t15 t16 t18 t19 t20 t21 t22 t23 t24 t25 t26 t27 t28 t29 t30 t31 t32 t33 t34 t35 t36 t37 t38 t39 t40 t41 t42 t43 t44 t45 t46 t47 t48 t49 t50 t53 t54; do node $t.js 2>&1 | grep -v TUNNEL | tail -1; done`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ (예제: 끝에 `#paspot` `#ledseg` 등)
- 브랜치: `ccr-957126bc-kqjtgb` = main `883024f`
