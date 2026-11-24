# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-24, 3차)

## 목표
- 저장소 `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 3299줄): 브레드보드에 IC·부품·계측기 꽂고 배선·시뮬레이션 + 회로도 편집기. 사용자 요청마다 기능 추가

## 현황 (이번 세션 완료, 모두 main 반영 = `9298c42`, 아티팩트 v29)
✓ 시작 = 빈 표준 보드 1장. 직전 회로는 저장 창 '지난번 하던 회로'(store `last`, 회로도 `sch` 포함)
✓ 슬로우 모드 `SLOW`/`setSlow`(O, ½·¼·⅒): 시간 느리게 + `settle` 칩 계산 1회/단계, `findFlows`→`#gF` 전선 위 빛 흐름
✓ 전선 각도 `opt.ang` 180(기본)/45/free, A 키 토글. `snapDir`·`elbow`·`angRoute`·`routeFromPath`
✓ 전선 길 `autoRoute`: 구멍 사이 틈(`gapYs`,`gapSnap`), 틈 안 차선 ±5, 위·아래 절반 건너기 `crossRoute`(보드 돌기 금지), 부품 줄(`compAt`) 끝은 y축으로 보드 밖(`outY`,`freeLane`). 구간 끌기 `drag.kind='seg'`. [길 다시 찾기] `rerouteSel`
✓ 선택 도구에서 구멍 톡 → 전선 시작/완성 `selTap`. 전선 밑 빈 구멍 누르기 허용. 신호 보기에서 Z 전선은 제 색
✓ 부품 고르기 = 한 창 계층 `PTREE`/`pnav`(부품→IC→종류→칩), 회로도면 `SCHTREE`(계측기 대신 VCC·GND)
✓ IC 106종(+59: `hcClone`, `ocGate` 03·05·07·09, 126·132·73·109·273·373·374·595·165·194·163·393·42·148·158·83·688·244·240)
✓ 회로도(별도 `<script>`): `setVM('bb'|'sch')`, `SCH{parts,wires,nextId,power,link,sig}`, `symOf`·`wireRoute`·`schSettle`, 자체 실행 취소 `shist`
✓ 양방향 동기: 회로도로 갈 때 `schAutoSync`→`boardToSch(true)`(기호 `bid`, 자리·회전 유지) / 회로도 편집 시 `sCommit`→`schApplyToBoard`(지운 부품 제거, 값 복사, 새 부품 `schPlaceOnBoard`, 끊은 연결 전선 삭제, 이은 연결 전선 추가). [보드로 보내기] `schToBoard`(autoLayout 전체 재배치), [보드에서 가져오기]
✓ 예제·보드로 보내기 전선 90° `orthoWires`. `allBox`에 전선 꺾는 점 포함
✓ 손잡이 크기 줌 연동 `hScale()` 연속값, 꺾는 점 네모 `cornerOnWire`
✓ 튜토리얼 `TUT` 9단계, 첫 접속 자동(`navigator.webdriver`면 안 뜸), [건너뛰기]·Esc, 제목 줄 [?] `#tutBtn`
✓ 계측기 우클릭 → `openCtx`에서 속성 창
✓ 회귀 시험 44개 + `node breadboard/tests/verify74.js` 106/106 통과
✗ 실기기 미검증: 아이폰·아이패드 핀치, 아티팩트 [파일로 내려받기], 회로도 사진 읽기 `askClaude`

## 결정사항
- 단일 HTML 유지 — 저장소 기존 실습장과 같은 방식
- 회로도 IC 전원 핀 숨김 — 회로도 관례, 보드로 보낼 때 레일 자동 연결
- 회로도→보드는 차분 반영 — 보드 재배치하면 사용자 배치 파괴
- 같은 세로줄 두 다리 분리는 자동 불가 → 안내만
- 회로도 시뮬레이션에 555·커패시터 아날로그 없음 — 보드에서만
- confirm()/alert() 금지(아티팩트에서 막힘), 삭제·덮어쓰기는 두 번 누르기

## 이슈/주의
- 사용자: 한국어, 비전문가 쉬운 말투(~해요), 요청 즉시 구현, 결과마다 아티팩트 링크, 휴대폰(삼성) 스크린샷으로 피드백
- `CLAUDE.md`: 시험→커밋→`git push -u origin ccr-957126bc-kqjtgb`→`git push origin HEAD:main`(ff 아니면 덮어쓰지 말고 알림). PR은 요청 시만
- 커밋 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 부품·문구 추가 시 `breadboard/COPYRIGHT.md` 5절(데이터시트 문장 복사 금지, 상표·타사 제품명 금지)
- 코드 수정 = Python 문자열 치환(개수 검사). 한 줄 긴 JS → grep `-o`/`cut -c`로 읽기
- 시험 중 `ERR_TUNNEL_CONNECTION_FAILED`(Google Fonts) 출력 = 네트워크, 무시
- 시험 스크립트 t*.js는 스크래치패드에만 있음 — 재부팅 시 소실 가능(저장소에 없음)
- 74LS192 10~15 상태표 기억 기반(미확인). `router/`·`windows/` 명칭 저작권 건 답 대기, `LICENSE` 없음
- 아티팩트 재게시: `file_path` 같게 + `url`. 새 대화 첫 게시는 거절 후 재시도(라이브 확인 절차)

## 다음 할 일
1. 사용자 새 요청 대기(직전 요청 전부 완료·게시)
2. 변경 후: 회귀 전체 + `node breadboard/tests/verify74.js` → 커밋 → 두 브랜치 push → 아티팩트 재게시
3. 여유 시 제안: t*.js 저장소 `breadboard/tests/ui/`로 옮기기(소실 방지)

## 참조
- 파일: `/home/user/3rd-/breadboard/index.html` 본체 / `breadboard/README.md` 설명서 / `breadboard/COPYRIGHT.md` / `breadboard/tests/verify74.js` IC 검증 / `/home/user/3rd-/CLAUDE.md` 규칙
- 시험: `/tmp/claude-0/-home-user-3rd-/0e796133-b619-5612-af72-c86b90ba9a5e/scratchpad/` t t5 t6 t7 t8 t11 t13~t16 t18~t44
- 명령: `cd <스크래치패드> && for t in t t5 t6 t7 t8 t11 t13 t14 t15 t16 t18 t19 t20 t21 t22 t23 t24 t25 t26 t27 t28 t29 t30 t31 t32 t33 t34 t35 t36 t37 t38 t39 t40 t41 t42 t43 t44; do node $t.js 2>&1 | tail -1; done`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ (예제 바로 열기: 끝에 `#nand` `#counter` `#adder` `#sync10` 등)
- 브랜치: `ccr-957126bc-kqjtgb` = main `9298c42`
