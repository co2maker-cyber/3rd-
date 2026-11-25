# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-25, 5차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 5300줄): 브레드보드+회로도 편집·시뮬레이터. 사용자 요청마다 기능 추가·수정

## 현황 (모두 main 반영 = `0de6032`, 아티팩트 v47, 화면 버전표시 `APP_VER='2026-11-25 · 예제 v5'`)
✓ 안내서 `breadboard/FILE-FORMAT.md`(A 부품·연결 목록 / B 저장 .json / IC 핀 표) + index.html 안 사본 `<script id="guideMd">` — 고치면 `node breadboard/tests/guide-sync.js --fix`
✓ [AI 회로] 버튼: CAD는 AI 직접 호출 안 함(사용자 지시). 부탁 문장+안내서 복사·안내서 보기/내려받기, AI 답 붙여넣기/파일(.md/.txt/.json, 코드블록 섞여도 `pickPayload`) → [보드에 배치하기]. 사진·설명글은 `guideAskFor`로 부탁 칸에 옮겨 안내. 아티팩트 capability = downloads만(sample 제거)
✓ [전선 정리] `tidyWires`/`applyWireRules`: gridWires 길 + 기능별 색(`wireFnOf`, FNC). 목록 배치·회로도→보드 후 자동 적용
✓ `autoLayout` 재작성: 작은 부품을 핀 옆에 붙임(VCC/GND면 레일로 세움, 신호면 2~6칸 눕힘), 연결은 나무 모양(빈 구멍 남은 가장 가까운 줄)
✓ 표시기 잔상: `GLOW_SHORT=.15` 안 켜졌던 칸만 잔상 — 7→6에 '8' 보이던 버그(사용자 "98786") 수정
✓ 불러오기 버그 수정: `fixComp`(부품 값 검사), `schClean`(회로도 검사), `LOADMAP`+`schLoadIf(o,saved)`(id 재번호 bid 맞춤, 회로도는 quiet 로드, 저장 당시 sig 어긋나면 회로도 재생성) — 저장본 36개가 31개로 돌아오던 버그
✓ 핀 이름 실제화: DIP 스위치 1..2n 표준번호, DPDT `['1','2 (공통)','3','6','5 (공통)','4']`(4가 1 맞은편)
✓ 예제 36개: 기존 24 + 논리 IC 모음 12(`ICEX`: lg2 lg3 lbuf lff lcnt lud lshift lmux ldec larith lbus lbcd, 도우미 `icDemo`, `ledKit`에 `seg7` 추가) → 부품 220가지 전부 예제에 쓰임
✓ 시험 전부 통과: 회귀 45 + verify74 106/106 + verify-parts 111/111 + tests/ui 12종(sweep-*, ic-examples, import-layout, sch-to-board, wire-tidy, ai-file, display-glow)
✗ 실기기 미검증: 아이폰·아이패드 핀치, 아티팩트 파일 내려받기

## 결정사항
- CAD 안 AI 호출 금지, 안내만 — 사용자 명시 지시
- 건전지·PSU 있으면 레일 자동 5V 없음(실제와 같게) → lbcd는 PSU 5V를 네 레일에 전선
- 미사용 게이트 입력은 비워 둠 — 기존 예제와 같은 방식, 경고 없음
- 14/16세그 '1'의 위 대각선(j) 허용 — 실제 글꼴도 둘 다 씀
- ASC4-16 자리 0=왼쪽 유지(실제 비슷한 제품은 오른쪽) — 사용자에게 바꿀지 물었으나 답 없음(?)

## 이슈/주의
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, 결과마다 아티팩트 링크, 휴대폰 스크린샷 피드백
- `CLAUDE.md`: 시험→커밋→`git push -u origin ccr-957126bc-kqjtgb`→`git push origin HEAD:main`(ff 아니면 알림), PR 요청 시만. 커밋 끝 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 코드 수정 = Python 문자열 치환(개수 assert). 긴 줄 → `cut -c`
- 레일은 6의 배수 열 구멍 없음. 시험 스크립트 우회 열도 6의 배수 피할 것(42 실수 있었음)
- 시험 결과 t20은 시간 의존(매번 조금 다름), t13·t25 출력은 이번에 바뀐 게 정상(t25 31→36)
- 사용자가 "안 바뀜" 하면 먼저 미리보기 새로고침·[AI 회로] 창 제목 옆 버전표시 확인 안내
- 아티팩트 재게시: 같은 file_path, 새 대화 첫 게시는 거절 후 재시도. 바꾸면 `APP_VER` 올리기

## 다음 할 일
1. 사용자 새 요청 대기(직전 요청 "모든 부품 예제에" 완료·게시)
2. 미답: ASC4-16 자리 순서를 실제처럼 0=오른쪽으로? (바꾸면 예제 ledasc 같이 수정)
3. 변경 후: 회귀+verify74+verify-parts+tests/ui 전체 → 커밋 → 두 브랜치 push → 아티팩트 재게시

## 참조
- 파일: `/home/user/3rd-/breadboard/index.html` 본체 / `breadboard/FILE-FORMAT.md` / `breadboard/README.md` / `breadboard/COPYRIGHT.md` / `/home/user/3rd-/CLAUDE.md` / `/home/user/3rd-/HANDOFF.md`
- 시험(저장소): `node breadboard/tests/verify74.js`, `node breadboard/tests/verify-parts.js -v`, `node breadboard/tests/guide-sync.js`, `for f in breadboard/tests/ui/*.js; do node $f | tail -1; done`(sweep-examples·sch-to-board 각 수 분)
- 시험(스크래치패드, 소실 가능): `/tmp/claude-0/-home-user-3rd-/0e796133-b619-5612-af72-c86b90ba9a5e/scratchpad/` t*.js 회귀, 기준 `reg8.txt`, `real.js <예제키>`(겹침·저항 길이)
- 회귀 명령: `cd <스크래치패드> && for t in t t5 t6 t7 t8 t11 t13 t14 t15 t16 t18 t19 t20 t21 t22 t23 t24 t25 t26 t27 t28 t29 t30 t31 t32 t33 t34 t35 t36 t37 t38 t39 t40 t41 t42 t43 t44 t45 t46 t47 t48 t49 t50 t53 t54; do node $t.js 2>&1 | grep -v TUNNEL | tail -1; done`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ (예제: 끝에 `#lg2` `#lbcd` 등)
- 브랜치: `ccr-957126bc-kqjtgb` = main `0de6032`
