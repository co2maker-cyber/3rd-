# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-27, 35차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 9400줄): 브레드보드+회로도+PCB 편집·시뮬레이터. 사용자 요청마다 기능·부품·예제 추가

## 현황
- 작업 브랜치 `ccr-957126bc-kqjtgb` = main = `979d5ee`. 아티팩트 v87 = 같은 판. 전체 시험 PASS(verify-parts 252/252)
- `APP_VER='2026-11-27 · 센서·출력 장치 29종(OLED·LCD·TFT·서보·초음파 …) · 예제 ⓢ1~ⓢ4'`
✓ 30차 코일: 인덕터 `thru` 합치기 안 함(`d.ind`) → `indL` 후진 오일러(DCR·L ±10%·`IND_RP` 100k), 포화 `indImaxOf`, 역전압 `vpk`(Rth 별도 풀이 `A0`·`gsolve`, i×min(Rth,√(L/IND_CP)), |i|>5mA만), FG 잘게 나눈 단계마다 다시 읽음, 속성 `indLive`(|Z|·공진), LED 과전류는 계산 전류 `ai`
✓ 31차 도구 막대 '도구' 묶음 `.instg`(psu bat fg osc dmm spa). psu 3채널(단자 6, CH1=`c.v`·`c.on`, CH2·3=`c.ch[0..1]`, −100~100V, − 공통접지, `psuChs`), fg 3채널(`c.ch` wave hz vpp off duty ph on, `fgChs`·`fgOn`, [3상 만들기]), osc 4채널(`vdiv2~4` `pos1~4` `ph1~4` `on1~4` `split`, `oscTrace` CH1 기준 위상차)
✓ 32차 멀티미터 `dmm`(단자 COM·VΩ·A, `mode` v·a·o, 션트 0.1Ω `dmmSh`, 10A `rt.fuse`, 저항은 수동 소자망 `gsolve`, OL). 속성 창 부품 설명 맨 밑(`.pdesc`)
✓ 33·34차 계측기 표시 창(`data-ied`) 누르면 앞판 `openInstPop`(.ipanel: 채널 키 `IPCH`, LCD 줄, 노브·±·미세/크게, 빠른 값, 하드 키, 스크롤 없음, 키보드 숫자·Enter·↑↓·Tab·Esc). 숫자 키패드는 터치 화면만(`ipTouch`). 속성 [앞판 열기]. 풀 보드 2장 묶음 `addBoardPair` 위아래(y+420)
✓ 35차 센서·출력 장치 29종(`px` sub `sen`·`out`, PTREE `sio` 맨 뒤 push): 센서 sldr sntc sfsr slm35 sjoy shall smq2 smic ssoil susr spir sir stilt sreed sdht sbme smpu sbh17 / 출력 doled doledv dlcd16 dlcd16i dtft abuz pbuz asrv adcm dneo8 arel. 엔진 `vsL`(PX.vs 전압원+R, anaNets), `PX.upd`(true면 다시 계산), `PX.res(c,r)`, `sxPower`(pwr [+,−,최소,최대,절대] → r.ok r.fail r.rev), `PX.diag`(ctx.ard 핀 역할 `i2cRole` `spiRole`), 화면 `dispLines`(src demo·text·sense, sense=같은 보드 센서 `read`), `PX.tick` 다시 그리기, 속성 `senProps`·`senBind`(`sld` 슬라이더 — `sl`은 기존 트랜지스터 라벨이라 피함), 소리 `SND` 기본 꺼짐. 예제 sx1~sx4(가로등·서보 테스터·온도계 LCD·거리계 OLED)

## 결정사항
- 회사 전용 형번(초음파·OLED·LCD·TFT 컨트롤러·RGB LED·센서·서보)은 부품 이름에 안 씀 — COPYRIGHT 2·5절, 8절 기록. 검색 낱말(PXKW)에만
- ⓢ2 서보는 555 대신 함수 발생기 — 555 기본 발진은 듀티비 50% 미만 불가
- 서보 각도 = 듀티비(5%→0°, 10%→180°) — 시뮬 느려 ms 펄스 측정 불가
- 보드 코드 실행 없음 → 화면은 배선 맞을 때만 "보드 내장 표시 프로그램"으로 표시
- LCD·OLED 센서 값 영어(TEMP, DIST) — 실제 문자 LCD 한글 불가
- 시험(verify-parts·analog-ic)은 `opt.tol=false`

## 이슈/주의
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, **답마다 아티팩트 링크**, main 반영 시 깃허브 페이지 주소. "물어보라고 하기 전까지" 시험 통과 즉시 main + publish (CLAUDE.md)
- `node tests/guide-sync.js --fix`는 .md → index.html 방향. 문서는 FILE-FORMAT.md·PARTS-GUIDE.md를 고치고 --fix
- 레일 구멍 6의 배수 열 없음(tn6·tp30 등), 한 구멍에 전선 하나 — 시험 회로 함정
- Nano(`ano`) D13 등은 위 줄(c), A4·A5·D9·D10은 아래 줄(h) — 전선 구멍 줄 맞출 것
- 한 줄 코드에 `//` 주석 넣으면 뒤가 주석 처리됨(30차에도 터짐)
- ic-examples `lud`·`lcnt`, coil 역전압은 실제 시간 섞여 가끔 흔들림(다시 돌리면 통과)
- 아티팩트 publish 첫 시도는 "live version 미확인"으로 거절될 수 있음 → 같은 파일 다시 publish하면 됨
- 회로도·PCB에는 35차 새 부품 전용 기호 없음(기본 모양)

## 다음 할 일
1. 사용자 다음 요청 대기 → 구현 → 전체 시험 → 커밋 → `git push origin HEAD:ccr-957126bc-kqjtgb` · `git push origin HEAD:main` → 아티팩트 publish → 링크 2개 전달

## 참조
- 파일: /home/user/3rd-/breadboard/index.html · COPYRIGHT.md · FILE-FORMAT.md · PARTS-GUIDE.md · /home/user/3rd-/CLAUDE.md · /home/user/3rd-/HANDOFF.md
- 시험: `cd breadboard && for f in tests/ui/*.js; do node $f | tail -1; done; node tests/verify-parts.js | tail -1; node tests/verify74.js | tail -1; node tests/guide-sync.js | tail -1` — 새 시험 tests/ui/coil.js inst3.js dmm.js inst-pop.js sensor-disp.js
- 커밋 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ · 깃허브 페이지: https://co2maker-cyber.github.io/3rd-/breadboard/
