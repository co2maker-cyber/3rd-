# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-27, 30차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 9000줄): 브레드보드+회로도+PCB 편집·시뮬레이터. 사용자 요청마다 기능·부품·예제 추가

## 현황
- 작업 브랜치 `ccr-957126bc-kqjtgb` = main = `169cac1`. 아티팩트 v81 = 같은 판. 전체 시험 PASS(verify-parts 223/223)
- `APP_VER='2026-11-27 · 저항·커패시터 실제 특성(오차·전력·ESR·누설·정격 전압·극성)'`
✓ 23차 마이컴 보드·해석기·디버거 → 24차 사용자 요청으로 전부 삭제(git `f39ac27`에 남음). 코드 실행 기능 없음
✓ 스펙트럼 분석기 계측기 `spa`(INST), 예제 Ⓟ11 `pspec`(함수 발생기 2대). 보드 돌리기 `B.rot`(90·180·270)
✓ 25~26차 아두이노 호환 보드 15종: 직결형 px `sub:'ard'` 8종(Nano 폼팩터 `ano` `anoevery` `anor4` `ano33iot` `ano33ble` `anorp` `anoesp` c·h줄 600mil, MKR `amkr` b·i줄 800mil, `d.rows`), 점퍼 연결형 INST 7종(`auno3` `aunor4m` `aunor4w` `aleo` `amega` `adue` `agiga`, `ARDX`, 실제 mm 헤더 `ardHeaders` D7–D8 4.064mm). `ardDrive`·`ardWarns`(VIN·3.3V 핀 5V 경고). 그림 `ardDipDraw`·`ardExtSVG`·`AG`·`MG`. 예제 ⓐ1 `ard1`
✓ 트랜지스터 11종 추가(`bjDef`): qbc337 qbc327 q4401 q4403 qmpsa13 qtip31 qtip32 qtip125 qbd139 qbd140(`to126`) mbs170
✓ 27차: 검색 `pqNorm`(7490 → 74LS90)·Enter 첫 결과 바로 놓기(`PFIRST`, `autoPx`), 회로도 우클릭 메뉴(삭제·돌리기), 회로도 IC 모든 핀(`i_ok`=true, 가져오기도 전원 핀 이음)
✓ 28차: IC 몸통 36px 핀 번호·기능 상시 표시, 전선 호버 `wireTip`, 경고 카드 왼쪽 아래·작성 중 숨김, 신호 보기 선 색 유지(`sigCol` 가는 줄), `addComp` 뒤 선택 도구(한 개씩), 풀 보드 2장 묶음 `addBoardPair`·`B.grp`·`boardGroup`
✓ 저항 옴의 법칙: `Rl`을 아날로그 마디 씨앗에, 저항만 있어도 analogStep, 커패시터 없으면 1단계. 논리값은 `anaNets`(커패시터·pxR·다이오드·트랜지스터·아날로그 IC 줄)만 전압으로, 저항만 거친 줄은 X·SH일 때만 전압으로. 칩 출력 바뀌면 analogStep 한 번 더(7세그 한 박자 늦음 고침)
✓ 29차 실제 특성: `partSeed`(자리 해시 오차, `opt.tol===false`면 0), `resEff`·`partStress`(P>정격 뜨거움, >2배 `rt.burnt` 탐), `capEff`(오차·X7R 바이어스)·`capEsr`·`capLeak`, 정격 1.3배 `rt.fail` 단락, 극성 반대 `rt.rev`. 속성 `partLive`·[새 부품으로 바꾸기]·[부품 오차 반영] 토글. 보드 표시 `partMark`

✓ 30차 코일 임피던스: 인덕터 `thru` 합치기 없앰(`d.ind`면 settle 합치기 건너뜀) → `indL` 후진 오일러(R=DCR, L 오차 ±10% `indModel`, 병렬 손실 `IND_RP` 100k), 포화 `indImaxOf` 넘으면 L 줄어듦·경고, 역전압 `vpk`(끊길 때 바깥 저항 Rth를 `A0`로 따로 풀어 i×min(Rth,√(L/C)), `IND_CP` 20pF), 코일 있으면 시간 단계 L/(R+1000)/4·최대 240. 함수 발생기 잘게 나눈 단계마다 다시 읽음. `gsolve` 분리. 속성 `indLive`(|Z|·위상·FG 주파수·공진 f₀·전류). LED 과전류 경고는 계산 전류 `ai`로. 시험 tests/ui/coil.js

## 결정사항
- 제품 상표·로고 안 씀, "UNO/Nano 폼팩터 호환 보드 · 특징"으로 이름 — COPYRIGHT 2절, 8절 기록
- 시험(verify-parts·analog-ic)은 `opt.tol=false` — 공식 확인용, 오차 켜면 이득 2.025 등으로 흔들림
- Ⓟ10 감지 저항 10Ω→47Ω 5W — 전력 계산으로 10Ω은 12W라 탐
- 저항만 거친 줄 논리값 유지 — 전압으로 바꾸면 LED 애노드 2V가 LOW로 읽혀 IC 예제 깨짐

## 이슈/주의
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, **답마다 아티팩트 링크**, main 반영 시 깃허브 페이지 주소. "물어보라고 하기 전까지" 시험 통과 즉시 main + publish (CLAUDE.md)
- 레일 구멍은 6의 배수 열 없음(tn6·tn12 등) — 시험 회로에서 전선이 빠지는 함정
- ic-examples `lud`는 실제 시간이 섞여 가끔 흔들림(다시 돌리면 통과)
- 한 줄 코드에 `//` 주석 넣으면 뒤가 주석 처리됨 — 이번에도 한 번 터짐
- Playwright `confirm()`은 `p.on('dialog',d=>d.accept())` 필요
- 사용자가 마지막에 "저항이 제대로 작동이 안됨" → v81(옴의 법칙 반영판) 올린 뒤 구체 회로 요청함, 답 대기

## 다음 할 일
1. 사용자 답 확인: 저항 문제가 남으면 회로(또는 저장 파일)로 재현 → 고침
2. 변경 후 전체 시험 → `git push origin HEAD:main` → 아티팩트 publish → 링크 2개 전달

## 참조
- 파일: /home/user/3rd-/breadboard/index.html · COPYRIGHT.md · FILE-FORMAT.md · PARTS-GUIDE.md(사본 `node tests/guide-sync.js --fix`) · /home/user/3rd-/CLAUDE.md · /home/user/3rd-/HANDOFF.md
- 시험: `cd breadboard && for f in tests/ui/*.js; do node $f | tail -1; done; node tests/verify-parts.js | tail -1; node tests/verify74.js | tail -1` — 새 시험 tests/ui/ard.js search-sch.js r28.js real.js spa-rot.js
- 커밋 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ · 깃허브 페이지: https://co2maker-cyber.github.io/3rd-/breadboard/
