# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-27, 23차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 8800줄): 브레드보드+회로도+PCB 편집·시뮬레이터. 사용자 요청마다 기능·부품·예제 추가

## 현황
- 22차까지 main 반영 끝(`412ff85`). 23차(마이컴 보드·편집기·디버거·스펙트럼 분석기·보드 돌리기) = 이 메모와 같은 커밋 → main·아티팩트 반영
- `APP_VER='2026-11-27 · 마이컴 보드 코딩·디버깅 · 스펙트럼 분석기 · 보드 돌리기'`
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
