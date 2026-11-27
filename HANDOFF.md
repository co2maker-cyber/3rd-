# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-27, 24차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 8800줄): 브레드보드+회로도+PCB 편집·시뮬레이터. 사용자 요청마다 기능·부품·예제 추가

## 현황
- **29차: 부품의 실제 특성.** `partSeed`(꽂은 자리 해시 → 오차, 늘 같음), 저항 `resEff`(허용 오차 60% 안) · `partStress`(P=V²/R, 정격 초과 '뜨거움', 2배 '탐' → `rt.burnt`, 계산에서 빠짐), 커패시터 `capEff`(유전체 오차·X7R 직류 바이어스) · `capEsr`(직렬, 동반 모델 G=1/(h/C+ESR)) · `capLeak`(병렬, 고장 2Ω·거꾸로 500Ω) · 정격 1.3배 → `rt.fail`. 상태 바뀌면 setTimeout으로 한 번 더 settle. [속성] `partLive`(실제 값·전류·전력·에너지)·[새 부품으로 바꾸기]. 보드 표시 `partMark`. 저항 논리값: 저항만 거친 줄은 논리 충돌(X·SH)일 때만 전압으로(`anaNets`), 칩 출력 바뀌면 analogStep 한 번 더. 시험 `tests/ui/real.js`(시험 회로의 레일 구멍은 6의 배수 열 없음 주의)
- **28차:** IC 몸통 36px에 핀 번호·기능 늘 표시(VCC 빨강·GND 파랑·`~`는 윗줄), 전선 호버 `wireTip`(전압 + 같은 줄의 IC 핀 번호·기능), 경고 카드 왼쪽 아래·작성 중(tool≠select·pending·drag) 안 띄움, 신호 보기는 고른 색 유지 + 가운데 신호 줄(`sigCol`), `addComp` 뒤 선택 도구(한 개씩, 전선 제외), 풀 보드 2장 묶음(`addBoardPair`, `B.grp`, `boardGroup`, move·slide 함께, 메뉴 [묶음 풀기]), **저항을 아날로그 계산에 넣음**(`Rl`을 마디 씨앗에, 저항만 있어도 analogStep, 커패시터 없으면 1단계) → 전압 나누기·LED 전류·밝기(`br`). 시험 `tests/ui/r28.js`
- **27차: 부품 검색·회로도.** `pqNorm`(74 뒤 LS·HC… 빼고 비교, 7490 → 74LS90), 결과 점수순(정확·앞부분·포함), `PFIRST` + `#partQ` Enter → 첫 카드 ondblclick(IC·게이트·계측기는 place, px는 `autoPx` 빈자리, 나머지는 도구만). 회로도 우클릭(`contextmenu` → `ssel` + openMenu 90° 돌리기·삭제, `schDown`은 오른쪽 단추 무시). `i_ok`가 모든 핀 통과 → 회로도 IC에 VCC·GND·NC 보임, 브레드보드→회로도 가져오기도 전원 핀을 이어 그림(NC만 건너뜀). 시험 `tests/ui/search-sch.js`. ic-examples `lud`는 실제 시간이 섞여 가끔 흔들림(다시 돌리면 통과)
- **26차: 트랜지스터 11종 추가**(`bjDef` 도우미, 핀 순서 문자열로 tr·dio·contacts): `qbc337` `qbc327`(CBE) `q4401` `q4403` `qmpsa13`(EBC, 달링턴) `qtip31` `qtip32` `qtip125`(BCE) `qbd139` `qbd140`(TO-126 `to126`, ECB) `mbs170`(DGS). verify-parts SPEC 표에 넣어 223/223. **아두이노 보드 그림 2판**: `AG` 도우미(실제 크기 비율), 직결형은 mm 배치(`ardDipDraw` kx·ky), 점퍼형은 USB 변환 칩·퓨즈·SOIC·실크 테두리·큰 이름표, Due 두 번째 USB·ERASE
- **25차: 아두이노 호환 보드 15종**(사용자 제공 「아두이노 데이터시트·CAD 레퍼런스」대로). 직결형 px `sub:'ard'` 8종 — Nano 폼팩터 `ano` `anoevery` `anor4`(5V) `ano33iot` `ano33ble` `anorp` `anoesp`(3.3V, 12번 VUSB) 2×15 600mil **c·h줄**, MKR `amkr` 2×14 800mil **b·i줄**(`d.rows`, `pxHolesAt`가 읽음). 점퍼 연결형 7종 — 계측기처럼 보드 밖(`INST`에 등록, `ARDX[t]`, `ISZ` 실제 mm×7.874): UNO `auno3` `aunor4m` `aunor4w`(LED 매트릭스) `aleo`, Mega `amega` `adue` `agiga`. 헤더 좌표 `ardHeaders`(D7–D8 4.064mm, 위·아래 48.26mm, Mega 2×18). 전기 `ardDrive`(USB·VIN → 5V·3V3·VCC·IOREF, GND), 점검 `ardWarns`(VIN 초과·부족, 3.3V 보드 핀 > 3.6V). 그림 `ardDipDraw`·`ardExtSVG`(MG 도우미 재사용, `Z` 배율). `termAt` 가장 가까운 단자. 예제 ⓐ1 `ard1`. 시험 `tests/ui/ard.js`, verify-parts 212. 코드 실행은 없음(사용자가 24차에 마이컴 코드 기능 삭제)
- **24차: 사용자 요청 "마이컴 전부 없애" → 마이컴 보드 5종·해석기 `MCUC`·편집기·디버거·예제 Ⓜ1·Ⓜ2·`tests/ui/mcu.js` 모두 삭제.** 아래 23차 ①~④·⑧ 마이컴 항목은 지난 기록(git 이력 `f39ac27`에 남음). 남은 것: 스펙트럼 분석기(Ⓟ11은 함수 발생기 구형파·사인파 2대로 바꿈), 보드 돌리기. 시험 `tests/ui/spa-rot.js`
- 22차까지 main 반영 끝(`412ff85`). 23차(마이컴 보드·편집기·디버거·스펙트럼 분석기·보드 돌리기) = 이 메모와 같은 커밋 → main·아티팩트 반영
- `APP_VER='2026-11-27 · 스펙트럼 분석기 · 보드 돌리기'`
✓ 23차 ① 마이컴 보드 5종(px `sub:'mcu'`, DIP 홈 걸치기): `uno` 표준형 26핀·`nano` 소형 30핀·`pro` 프로 미니형 24핀(USB 없음)·`mega` 대형 76핀·`wifi` 와이파이형 30핀(3.3V, int 32비트, ADC 12비트). 설정 `MCUB`, 핀표 `mcuMap`. 부품 고르기 최상위 `PTREE[7]` `mcu`(SCHTREE에도)
✓ ② 코드 해석기 `MCUC`(맨 앞 별도 `<script>`): lex→prep(#define 값·함수)→parse→annotate(자료형·칸 번호)→제너레이터 실행. 문장마다 yield → 중단점·한 줄씩. 내장 `BI`(pinMode~pulseIn·map·random…)·`SER`(Serial)·`STRM`(String). 포인터·클래스·#include 라이브러리 없음
✓ ③ 시뮬 연결: settle의 resolve에서 `mcuDrive`(출력·USB 5V/3V3·GND, 그다음 풀업), 칩 반복 고리에서 `mcuPw`(전원)→`r.mpw`. 20ms 시계에서 `mcuTick`(시각까지 실행, 예산 60000문장, digitalRead 때 출력 바뀌었으면 settle). PWM·tone은 평균 전압(srcV)
✓ ④ 편집기·디버거 `#mcuWin`(`mcuOpen`, `MCUED`): 업로드(번역 오류면 안 올림)·디버그 시작(첫 줄 멈춤)·계속·일시 정지·한 줄씩 F10·들어가기 F11·나오기·리셋, 줄 번호 누르면 중단점(`c.bp` 저장), 탭 변수·호출 스택·핀·시리얼 모니터(입력 `m.serIn`), 예제 코드 9개 `MCUEX`
✓ ⑤ 스펙트럼 분석기 계측기 `spa`(INST, 310×250, 단자 RF IN): `spaSrc`(fg·clk·마이컴 tone/PWM은 푸리에 급수 선 스펙트럼 `spaLines`, 아니면 20ms 표본 FFT) → `spaPoint`(가우스 RBW, 잡음 바닥 −112+10log RBW+감쇠, 믹서 −10dBm 넘으면 눌림) → 스윕 그리기 `spaTick`. 마커는 0Hz 근처 건너뜀. [신호 찾아 맞추기] `spaAuto`
✓ ⑥ 보드 돌리기 `B.rot`(90·180·270): `rotXY`, 구멍 `h.x/y`=화면, `h.lx/ly`=돌리기 전. 부품은 `compSVGr`/`inLocal`로 돌리기 전 자리에서 그린 뒤 rotate, `bodyRect`도 돌려서. `gridAt`·`gapSnap` 역회전. 보드 메뉴에 90°·−90°·180°. 끌기 5px(Alt 1px), 보드 간격 2px까지
✓ ⑦ 예제(목록 맨 아래 optgroup "마이컴 보드 · 스펙트럼 분석기"): Ⓜ1 `mbasic`(소형, 버튼 토글·가변저항→PWM·시리얼), Ⓜ2 `mlight`(표준형 신호등), Ⓟ11 `pspec`(분석기 2대: 마이컴 음계 tone, 함수 발생기 2Hz 구형파)
✓ ⑧ 보드 그림 품질(사용자 "생김새 그려서"·"퀄리티 올려"): `MG` 그리기 도우미·`MGDEFS` 그라데이션(DEFS 안), `mgTraces` 배선 무늬, 표준형·대형 암 헤더, PWM `~`, 보드마다 `xl·xr·bh` 몸통. 와이파이형 핀 순서 실제대로 고침(VIN↔3V3, EN↔GPIO23)
✓ 시험: `tests/ui/mcu.js` 47항목 + verify-parts 207/207(마이컴 핀 순서·LED 전압 포함) + 전체 PASS → main `f39ac27`, 아티팩트 v76

## 결정사항
- "Arduino"·보드 제품명·칩 회사 형번은 이름에 안 씀 → "마이컴 보드 · 표준형/소형/프로 미니형/대형/와이파이형". 설명·분류에 "아두이노 호환 함수"만(호환 표기). COPYRIGHT 8절·3절 기록
- 표준형·대형은 실제로 점퍼선 연결 보드지만 앱에서는 헤더를 홈에 걸쳐 꽂게 함(핀 순서는 이 프로그램이 정함, 설명에 밝힘)
- "HP 8566B 하나로 합쳐 제대로 작동" → 이름 없이 스윕 동조형 분석기 계측기 한 대로 구현(Ⓟ10 보드 6장의 역할을 모음). 실제 GHz 대역 대신 시뮬 신호(수 Hz~수십 kHz)
- "브레드보드 배치 자유롭게" → 회전 + 촘촘한 이동 + 붙여 놓기. 부품을 보드 밖에 자유롭게 두는 것은 아직 아님(요청 뜻이 그쪽이면 다음에)
- 시험 통과 즉시 main 반영 + 아티팩트 publish, 묻지 않음 — "물어보라고 하기 전까지" 계속(CLAUDE.md)

## 이슈/주의
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, **답마다 아티팩트 링크**, main 반영 시 깃허브 페이지 주소
- 마이컴: 회로도 화면 시뮬(SIM_S)에서는 코드가 안 돎(브레드보드에서만). attachInterrupt 미지원(오류 안내). 시간은 문장당 1.5µs로 셈 — 쉬지 않는 긴 반복은 시간 건너뜀(`m.slow`)
- fg 최대 10Hz라 분석기 기본은 마이컴 tone(수백 Hz~kHz)으로 보여 줌
- psu(서플라이)는 0V 이상만. psu 하나라도 놓으면 보드 자동 5V 레일 꺼짐(마이컴 USB 5V 핀은 그래도 전원을 냄)
- 코드 수정 = Python 치환(개수 assert). 한 줄짜리 코드 중간에 `//` 주석 넣으면 뒤가 주석 처리됨
- Playwright 시험에서 `confirm()`은 `p.on('dialog',d=>d.accept())` 없으면 취소됨(예제 코드 불러오기)
- pcb-examples 못 이음 수는 실행마다 다름, 오류 0이면 통과. sweep-lists `sch bad2~4`는 정상

## 다음 할 일
1. 사용자 요청 대기. 후보: 회로도 시뮬에 마이컴, 부품을 보드 밖에 자유 배치, 마이컴 I2C/서보·LCD 같은 주변 부품, 음전원 서플라이, TO-3 실제 치수

## 참조
- 파일: /home/user/3rd-/breadboard/index.html · COPYRIGHT.md · FILE-FORMAT.md · PARTS-GUIDE.md(안내서 사본은 `node tests/guide-sync.js --fix`) · /home/user/3rd-/CLAUDE.md
- 시험: `cd breadboard && for f in tests/ui/*.js; do node $f | tail -1; done; node tests/verify-parts.js | tail -1; node tests/verify74.js | tail -1` — 23차는 tests/ui/mcu.js
- 커밋 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ · 깃허브 페이지: https://co2maker-cyber.github.io/3rd-/breadboard/
