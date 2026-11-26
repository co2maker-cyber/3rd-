# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-26, 16차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 6700줄): 브레드보드+회로도+PCB 편집·시뮬레이터. 사용자 요청마다 기능 추가·수정. 같은 저장소 `linux/`·`router/`·`windows/` 실습장, 루트 `index.html`

## 현황
- 브랜치 `ccr-957126bc-kqjtgb` = main (16차 push), `APP_VER='2026-11-26 · PCB 부품 놓기·층 쌓기'`. 아티팩트는 16차에 '현재판 전체 읽기' 요구로 publish 거절됨(현재판 = 15차 저장소판과 같음)
✓ 8~9차까지: 오류 알림, PCB(자동 배선·DRC·거버 zip), 연결 체크, 순서 카드, 저작권 가이드, 서명(`AUTHOR_SIG`), 라이선스 키(`LIC_*`, 공식 주소 외 `#licGate`), 로컬 버전
✓ 10차 릴레이·코일: PX 분류 `rly`(`rlyc` 큐브·`rlyd` DIP DPDT·`reed`·`rlyl` 래칭 c.s·`ssr`·`sol`), 코일 `coil:[i,j]`+`res`(R=cv²/cw), settle 끝 `coilUpd`(75% 붙음/10% 떨어짐) → 바뀌면 settle 재귀(깊이 4 넘으면 `SIM.buzz`). 분류 `ind`(`inda` 색띠·`indr`·`indt`·`bead`) = `thru`(직류 단락). 예제 Ⓟ5 `pasrly`
✓ 11차 다이오드: 분류 `dio`(`d4148`·`d4007`·`d5819`·`dz51`·`dge`·`brdg`), `DIOM` 꺾은선(vf·rs, 제너 vz·rz), resolve 한 방향 레벨 전파, analogStep 상태 가정→다시 풀기(12회). 경고: 저항 없이 단락·전류·역전압·제너 전력. 예제 Ⓟ6 `pasdio`(보드 3장)
✓ SPICE: `breadboard/spice/bbcad-parts.lib`(BB_ 일반 이름, 서명 포함)·`README.md`·`tb-relay/inductor/bridge.cir`, 다이오드 값은 `breadboard/tools/fit-diode.py`로 직접 산출. ngspice 검증(`apt-get install ngspice` 필요, 컨테이너 재시작 시 사라짐)
✓ 12차: 사용자가 준 부품 조사 문서(.md) → 원문 미보관, `breadboard/PARTS-GUIDE.md` 새로 씀(앱 [부품 고르기] 창 아래 버튼, `<script id="partsMd">` 사본). 부품 `duf`(UF4007)·`dbat`(BAT85급)·`indair`(공심, turns·dmm → 휠러식 `airL`). 버그 고침: px [속성] 버튼이 `#pc` 없으면 안 이어지던 것(가변저항 값 등 먹통이었음)
✓ 13차("왜 추가가 안될까?"): 파일 배치·AI 회로 목록 `normPart`가 px 부품 몰랐음 → `pxPart`(표준 번호·일반 이름, `D`는 값에 번호 있을 때만 다이오드)·`pinIndex` px 핀 이름, FILE-FORMAT A-2 표 추가, 부품 검색 영어 낱말(`PXKW`)
✓ 14차 PCB: 선택 도구 마우스·펜 빈 곳 끌기 = 범위 선택(`pbox`, Shift 더하기), psel `multi`(`pSets`/`pSelOf`), 함께 옮기기(`pGroupDrag`/`pGroupMove`, 붙은 선 끝 따라옴, 안 옮기는 부품 패드 위 끝은 고정), 손가락 1개 = 화면 이동. 지우개 `data-pt="erase"`·E키(`pEraseAt`, 문지르기 1회 = 되돌리기 1회, 부품은 안 지움). Delete 여러 개 = 선·비아만
✓ 16차 PCB 부품 놓기·층 쌓기·거버: [부품](`#pAdd`, A키) → 부품 고르기 창 `PCBTREE`(맨 앞 'PCB 기구' 장착 구멍 `MHK` mh25·mh3·mh4 + SCHTREE에서 전원 기호 뺌) → `pcbPick`·`ptool='place'`·미리보기 `pGhost`·R 돌리기 → `pcbPlaceAt`: 회로 부품은 `schAddPart`(링크면 브레드보드에도), 구멍은 `PCB.xp`(PCB에만, np 패드·NPTH). 하나 골라 Delete/`pDelFp` = 회로도에서도 뺌. `pPush(ssnap())` → 되돌리기 때 회로도도 복원(`pSwap`, bid 바뀌면 열쇠 다시 매김). `pcbToSch`: PCB에서 구리로 이은 연결 → 회로도 선([점검] 창 [회로도에 반영]). 층: `PCB.nl` 1·2·4·6(`pLayers`, 1층 = B만), `PCB.inner` In1~4 신호/GND·VCC 판(`pPlane`, 판 연결 패드·비아는 pcalc에서 판 노드로 묶음 → 래츠 빠짐), `PCB.th` 두께, `pStack` 층 표(옆 창 '층 쌓기', 눈 = `pvis`). 자동 배선 신호 층 n장(`pSig`), 층 버튼·V = 다음 층. DRC: 같은 섬 패드·비아는 간격 예외, 1층 비아·판 층 선 오류. 거버: 층마다 `Copper,Ln,Top/Inr/Bot,Signal/Plane`(In = `.g1`~`.g4`), 판 = 영역+LPC 안티패드+서멀 살, 드릴 PTH(`Plated,1,n`)·NPTH 따로, README 층 순서. 시험 `tests/ui/pcb-layers.js`(23종째)
✓ 시험 전부 통과(16차 직후, sig-check 드릴 서명 검사식 새 형식으로): tests/ui 23종, verify-parts 133/133, verify74 106/106, sig-check, guide-sync, spice-check
✗ 미검증: Claude 미리보기에서 키 창 뜨는지, 실제 아이폰·윈도우 크롬 저장, 거버 외부 뷰어(특히 판 층 LPC·서멀, 안쪽 층 .g1~ 이름 — 업체 업로드 확인 필요, gerbonara 설치는 권한 거절됨)

## 결정사항
- 저작권(COPYRIGHT.md 14절): 외부 조사 자료는 사실·수치·공식만, 문장·표·남의 SPICE 값 복사 금지, 회사 전용 형번·상표 대신 종류 이름. 1N4148 등 다회사 표준 번호는 급 표기로만 — 사용자 "저작권법 문제 없게" 지시
- 인덕터는 직류 단락(thru)으로만 계산 — 앱 아날로그 h≈0.5ms라 LC 동작 의미 없음
- 지우개는 부품 안 지움. 부품 지우기는 하나 골라 Delete(회로도에서도 뺌), 여러 개 Delete = 선·비아만
- PCB에서 놓은 회로 부품은 늘 회로도에 기호를 더함(PCB만의 회로 부품 없음) — 회로도·브레드보드·PCB 한 회로 유지. PCB 전용은 장착 구멍뿐
- 1층 보드 = 뒷면(B) 구리만(스루홀 부품 앞에 꽂고 뒤 납땜). 층 수 바꾸면 안쪽 층 기본값(4층 In1 GND·In2 VCC 판, 6층 신호·GND·VCC·신호)으로, 못 쓰게 된 층 선은 지움
- 손가락 1개 빈 곳 끌기 = 화면 이동 유지(범위 선택은 마우스·펜만) — 휴대폰 이동 수단 보존
- 비밀 열쇠 저장소 밖, CAD 안 AI 호출 금지, showSaveFilePicker 안 씀, PCB 격자 1.27mm

## 이슈/주의
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, **업데이트마다 아티팩트 링크 무조건**, main 반영 시 깃허브 페이지 주소, 요청이 짧고 모호함 → 스크린샷/어디서 안 되는지 물어보기
- CLAUDE.md: 시험→커밋→`git push -u origin ccr-957126bc-kqjtgb`→`git push origin HEAD:main`. 커밋 끝 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 아티팩트 새 대화에서 올릴 때: publish 한 번 거절(현재판 diff = 열람 처리) → 같은 파일 두 번 더 publish
- 코드 수정 = Python 문자열 치환(개수 assert). 속성 창 시험은 `sel={type:'comp',id}` 필수(type 없으면 안 그려짐)
- 예제 만들 때 레일 열 6의 배수(6,12,…,36)는 구멍 없음 → 전선 사라짐. ledKit LED는 e·f 두 줄 다 차지
- `sweep-lists` 끝 줄 `sch bad4 {"ex":""…}`는 정상, `ic-examples` 동시 실행 시 가끔 FAIL(단독 재실행 PASS)
- 백그라운드 시험은 Bash `run_in_background`로(그냥 `&`는 알림 없음)
- 부품·문구 추가 시 COPYRIGHT.md 5절 점검표, 서명 ID 바꾸지 않음

## 사용자 지시 기록 (COPYRIGHT.md 10절 근거)
- ~11-25: 시뮬레이터 방향, AI 호출 금지, 부품 220종, 자동 main, 오류 알림, PCB, 업데이트마다 링크, 깃허브 페이지
- 11-26: 연결 체크·초기화, 순서 카드, md 내려받기, 저작권 가이드, 라우터 일반화, 서명, 라이선스 키, 로컬 버전, 릴레이·코일, 조사 문서 저작권 안전 반영(2회), "왜 추가가 안될까?", PCB 드래그·지우개, 진행 메모(15차), PCB 부품 배치·층 쌓기·거버(16차)

## 다음 할 일
1. 사용자 다음 요청 대기 — 최근 "왜 추가가 안될까?"는 목록 배치 원인으로 추정해 고침(미확인), 여전하면 어디서 무엇을 추가했는지 확인
2. 후보: 트랜지스터 부품, 회로 → SPICE 넷리스트 내보내기, PCB 범위 선택 후 회전, 끌어 옮긴 뒤 늘어난 선 다시 배선, 판 나누기(분할 판)·뒷면 부품·SMD 발자국, 거버 미리보기 화면
3. 사용자 결정 대기: 저작자 실명/상호, 오픈소스 여부, 저장소 비공개 전환

## 참조
- 파일: `/home/user/3rd-/breadboard/index.html` · `COPYRIGHT.md` · `FILE-FORMAT.md` · `PARTS-GUIDE.md` · `spice/` · `tools/fit-diode.py` · `license-admin.html` / `/home/user/3rd-/CLAUDE.md` · `HANDOFF.md`
- 시험: `for f in breadboard/tests/ui/*.js; do node $f | tail -1; done`(23종, 약 18분), `node breadboard/tests/verify-parts.js`·`verify74.js`·`sig-check.js`·`guide-sync.js`(`--fix`)·`spice-check.js`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ
- 깃허브 페이지: https://co2maker-cyber.github.io/3rd-/breadboard/ · `/breadboard/spice/bbcad-parts.lib` · `/breadboard/license-admin.html`
