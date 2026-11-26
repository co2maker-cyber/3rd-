# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-26, 9차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 6200줄): 브레드보드+회로도+PCB 편집·시뮬레이터. 사용자 요청마다 기능 추가·수정. 같은 저장소에 `linux/`·`router/`·`windows/` 실습장, 루트 `index.html`(처음 화면)

## 현황
- 작업 브랜치 `ccr-957126bc-kqjtgb` = `a6de2e5`(push 완료) / **main = `604c7ab`** — `369f53c` 서명·`dbc0a1a` 라이선스·`a6de2e5` 로컬 버전 3개 커밋 main 미반영
- 아티팩트 v58 게시 완료, `APP_VER='2026-11-26 · 로컬 버전'`
✓ 기존(8차까지): 오류 알림, PCB 탭(자동 배선·DRC·거버 zip), 연결 체크 막대·초기화, 순서 카드, 내려받기 `saveAny`(저장 창 안 씀), 깃허브 페이지 배포
✓ 저작권 가이드 적용: 외부 웹폰트 제거(5개 페이지 모두 시스템 글꼴, 외부 요청 0), `index.html` 맨 위 고지 주석, 화면 [속성] © 줄, `FILE-FORMAT.md` 끝 고지, "데이터시트 기준" 표기 전부 "표준 핀 번호", PCB 점검 창·zip README 거버 교차 확인 면책, `COPYRIGHT.md` 0·3(자체 구현 표)·9(배포)·10(AI 협업)·11(체크리스트)절
✓ 라우터 일반화: 시스코 부팅 문구·형번(ISR4331 등)·이미지 파일·일련번호·MAC(OUI)·연습 비번(`cisco`→`class`, `Cisco123`→`Admin123`) → 가상 장비 PR-4000·PR-3000·PS-2400·SER-2P, `pr4000-practice-1.0.bin`, MAC `0200.00a1.0a0x`(EUI 상수 같이 변경). `rommon`·`cdp` 명령 이름 유지
✓ 저작자 서명: ID `C2M-2026-BC51AA6C-{BBCAD|HOME|LINUX|ROUTER|WINSRV}` — 맨 위 주석, `<meta author/copyright/generator>`, 상수 `AUTHOR_SIG`(콘솔 고지), 출력물(json `generator`, 거버 `G04 Generator:`, 드릴 `; Generator:`, PCB README, SVG 주석). 검사 `node breadboard/tests/sig-check.js`. `COPYRIGHT.md` 12절 SHA-256 기록
✓ 라이선스 키: 공식 주소(`co2maker-cyber.github.io`, claude.ai·claudeusercontent·틀 바깥 주소·`window.claude`)는 통과, 그 밖(file://·다른 사이트)은 `#licGate`. ECDSA P-256, `LIC_PUB`(kid `BBCAD-K1`)·`LIC_OFFICIAL`·`LIC_REVOKED`·`licVerify`/`licCheck`. 키 = `BBCAD1.`+base64url(내용 {v,id,to,dom,exp,ed,iat})+서명. 발급 `breadboard/license-admin.html`·`node breadboard/tools/issue-license.js --key … --to … --dom file --exp …`
✓ 로컬 버전: `const LIC_EMBED=null;` 줄에 키 넣은 파일 → 더블클릭으로 키 창 없이 오프라인 실행, 이름·키 번호 표시. 발급 페이지 [로컬 버전 파일 만들기]→[⬇ 내려받기] 링크, CLI `--build 파일.html`. 파일 이름 `breadboard-CAD-local-L-….html`(영문)
✓ 시험: verify74 106/106, verify-parts 111/111, guide-sync, sig-check, `tests/ui/license.js` 20항목 PASS(시험용 열쇠 쌍)
△ 전체 시험: `369f53c`까지 tests/ui 18종 PASS. 라이선스·로컬 버전 이후 회귀+tests/ui 전체 재실행 중이었음(백그라운드 b6pl3ksk5, 회귀 34/45에서 결과 미확인)
✗ 미검증: Claude 미리보기에서 키 창 안 뜨는지(주소 미확인), 실제 아이폰·윈도우 크롬 저장, 거버 외부 뷰어(gerbonara 설치 권한 거부)

## 결정사항
- 비밀 열쇠(`bbcad-license-PRIVATE.jwk.json`) 사용자에게 파일 전달 후 컨테이너 사본 삭제, 저장소엔 공개 열쇠만 — 위조 방지. `.gitignore`에 `*PRIVATE*.jwk.json`
- 자동 시험(navigator.webdriver)은 키 창 건너뜀, 키 창 시험만 `__licForceGate`·`__licTestPub` — 시험이 진짜 비밀 열쇠 없이 돌게
- 로컬 버전 파일 이름 영문 — 헤드리스 크로미움이 한글 파일 이름을 `download`로 바꿈
- 외부 글꼴 제거(OFL이었지만 가장 안전한 쪽), 저작자 표기 `co2maker-cyber`(실명 미정), 라이선스 "All rights reserved"(LICENSE 파일 없음)
- CAD 안 AI 호출 금지, `showSaveFilePicker` 안 씀(윈도우 .md 확장자 빠짐), PCB 격자 1.27mm

## 사용자 지시 기록 (COPYRIGHT.md 10절 — 계속 덧붙일 것)
- ~11-25: 시뮬레이터 방향, AI 호출 금지, 부품 220종 예제, 자동 main, 오류 알림, PCB, 업데이트마다 링크, 깃허브 페이지
- 11-26: 연결 체크·초기화, 순서 카드, md 내려받기 고침, 전보체 메모, 저작권 가이드 적용·재검토, 라우터 부팅 문구 일반화, 코드 저작권 서명, 복사 막는 라이선스 키, 로컬 버전, 진행 메모(9차)

## 이슈/주의
- 라이선스는 기술적 보호조치일 뿐 — 공개 소스라 수정 우회는 못 막음(저작권법 제104조의2로 보호). 더 강하게 = 저장소 비공개(Pages 유료)
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, **업데이트마다 아티팩트 링크 무조건**, main 반영 시 깃허브 페이지 주소, 스크린샷 피드백
- CLAUDE.md: 시험→커밋→`git push -u origin ccr-957126bc-kqjtgb`→`git push origin HEAD:main`(ff 아니면 알림). 커밋 끝 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 코드 수정 = Python 문자열 치환(개수 assert). 여러 파일 일괄 치환 중 실패하면 앞 파일만 바뀐 채 남음 → `git checkout --` 후 재실행
- `tests/ui/ic-examples.js` 다른 시험과 동시 실행 시 가끔 FAIL(시간 의존) — 단독 재실행 PASS
- 회귀 끝 줄 `errors []`면 정상. 시험 스크립트는 실행 폴더 주의(`path.resolve('index.html')`)
- 서명·저작자 이름 바꿀 땐 주석·메타·`AUTHOR_SIG`·출력물·`sig-check.js` OWNER 함께. 서명 ID는 바꾸지 않음

## 다음 할 일
1. 백그라운드 시험 결과 확인(없으면 회귀+tests/ui 전체 재실행) → 통과면 `git push origin HEAD:main` → 브레드보드·발급 페이지(https://co2maker-cyber.github.io/3rd-/breadboard/license-admin.html) 주소 안내
2. 사용자에게 Claude 미리보기에서 키 창 뜨는지 확인 요청(뜨면 `licOfficial` 주소 추가)
3. 사용자 결정 대기: 저작자 실명/상호, 오픈소스 여부, 저장소 비공개 전환, ASC4-16 자리 순서
4. PCB 개선 후보: 자동 배선 성공률, GND 구리 채우기, 뒷면 부품

## 참조
- 파일: `/home/user/3rd-/breadboard/index.html` · `license-admin.html` · `tools/issue-license.js` · `COPYRIGHT.md` · `FILE-FORMAT.md` · `README.md` / `/home/user/3rd-/router/index.html` · `CLAUDE.md` · `HANDOFF.md` · `.gitignore`
- 시험: `node breadboard/tests/verify74.js`, `verify-parts.js`, `guide-sync.js`(`--fix`), `sig-check.js`, `for f in breadboard/tests/ui/*.js; do node $f | tail -1; done`(19종, 약 15분)
- 회귀(스크래치패드, 소실 가능): `/tmp/claude-0/-home-user-3rd-/0e796133-b619-5612-af72-c86b90ba9a5e/scratchpad/` t*.js
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ
- 깃허브 페이지: https://co2maker-cyber.github.io/3rd-/breadboard/ · `/router/` · `/breadboard/license-admin.html`
