# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-24, 2차)

## 목표
- 저장소 `co2maker-cyber/3rd-`의 `breadboard/`: 브레드보드에 IC·부품·계측기 놓고 배선해 시험하는 단일 HTML 사이트. 사용자 요청마다 기능 추가.

## 현황
✓ 본체 `/home/user/3rd-/breadboard/index.html` 2417줄(외부 스크립트 없음, Google Fonts만). `origin/main` = `ccr-957126bc-kqjtgb` = `76135b3`
✓ 아티팩트 v17 게시(capabilities `sample{images:true}`, `downloads:true` 유지)
✓ 보드 이동: 몸통(구멍 없는 곳) 끌기 `startBoardDrag`/`slideBoard`, [보드 이동] 도구 `move`(M)
✓ 겹치지 않게 자동 배치: `ghostAt`/`gateGhost`→`fitsHere`/`bodyRect`, 찬 구멍은 같은 줄 빈 구멍 `landing`
✓ 전선: 직선+둥근 꺾임 `wirePath`, 자동 차선 분리 `buildRoutes`→`ROUTES`(`routePts`/`ownPts`), 가운데 손잡이 `data-mid`, 그리면서 꺾기 `pendPts`, 끌고 간 길 따라 놓기 `wireDrag.path`→`tracePts`(`rdp`,`offRow`,`offCol`)→`declash`
✓ 계측기 `INST`(psu/bat/fg/osc): 몸통 `c.x,c.y` 먼저 배치(`instGhost`), 단자 구멍 `@k:i`(`syncTerms`,`termAt`,`isTerm`,`c.k`)에서 전선 연결. 예전 형식은 `migrateInst`가 변환
✓ 계측기 속성 전부 숫자 입력(`numIn`, `input[data-n]`, `instProps`): PSU 0~100V, 건전지 0.1~48V, FG 파형 4종·0.1~10Hz·Vpp·오프셋 `off`·듀티 `duty`, 스코프 `tdiv`/`vdiv`/`vdiv2`/`pos1`/`pos2`/`on1`/`on2`
✓ PSU·건전지 있으면 레일 자동 5V 꺼짐(`resolve`의 `srcV`). + 레일에 클럭/FG 물리면 그 레일 자동 5V 해제(`clkNets`), 점검에 `info` 항목
✓ 일시 정지 `simNow()`/`setPaused`(버튼 `#pause`, P)
✓ 화면: 페이지 스크롤 없음(100dvh), 리본 숨김(`.ribbon{display:none!important}` — DOM·`renderRibbon` 잔존), 부품은 `#partOpen`→`#partDlg`(`PCATS`,`renderParts`)만, 속성·점검·객체는 `#dock` 팝업(`openDock`/`closeDock`, 도구 막대 `[data-dock]`), 도구 옵션 `#optCard.optbar`
✓ 저장·불러오기 `#saveDlg`(`savedList`,`saveLocal`,`saveToFile`; localStorage 키 `bblab.v1.saves`), Ctrl+S
✓ 7세그먼트 새 모양(기운 획·핀 번호·이름), 터치 핀치 `tpinch`(touch 이벤트 직접 처리), 좁은 화면 도구 막대 한 줄
✓ IC 검증 `breadboard/tests/verify74.js` 47/47 통과. 수정: RBO(`ls47`·74LS48), `UP192`/`DN192`, 프리셋·클리어 X 처리, 칩별 전원 범위 경고, NE555 문턱 VCC 추종
✓ 저작권 문서 `breadboard/COPYRIGHT.md`(사용자 제공+7·8절), 업로드·면책 안내 삽입
✗ 실기기 미검증: 아이패드·아이폰 핀치 확대(에뮬레이터만 통과), 아티팩트 안 [파일로 내려받기], 회로도 사진 읽기 `askClaude`
? GitHub Pages 켜짐 여부 미확인

## 결정사항
- 단일 HTML 유지 — 저장소 기존 실습장과 같은 방식
- 계측기 = 떠 있는 몸통 + 단자 구멍 — 사용자 "먼저 위치, 나중에 전선" 요청. 단자는 `occ()`에서 제외(전선 여러 가닥 허용)
- 전원 장치 있으면 자동 5V 끔 — 실제 실험과 같게. 지우면 복귀
- 꺾는 점 없는 전선만 자동 차선(`c.pts` 없음=자동, 있음=수동)
- FG·클럭 최대 10Hz — 20ms 주기 실시간 갱신 한계
- confirm()/alert() 금지 — 아티팩트에서 막힘. 삭제·덮어쓰기는 두 번 누르기
- 리본 DOM은 숨기기만 — `renderRibbon` 의존 코드 많음

## 이슈/주의
- 사용자: 한국어, 비전문가용 쉬운 말투(~해요), 요청 즉시 구현, 결과마다 아티팩트 링크
- main 자동 반영(`CLAUDE.md` 규칙): 시험→커밋→`git push -u origin ccr-957126bc-kqjtgb`→`git push origin HEAD:main`. fast-forward 안 되면 덮어쓰지 말고 알림. PR은 요청 시만
- 커밋 끝: `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 코드 수정은 Python 문자열 치환 스크립트(치환 개수 검사) 방식. 한 줄이 긴 JS라 grep/sed `cut -c`로 읽기
- 아티팩트 재게시: `file_path` 같게 + `url` 지정. 새 대화 첫 게시는 거절 후 재시도 필요(라이브 버전 확인 절차)
- 부품·문구·에셋 추가 시 `breadboard/COPYRIGHT.md` 5절 점검표 준수. 타사 제품명("틴커캐드") 문구 금지
- 74LS192의 10~15 상태표는 기억 기반(PDF 미확인) — 확신 낮음
- `router/`·`windows/`에 Cisco·Windows 명칭 있음 — 저작권 기준 적용 여부 사용자 답 대기
- `LICENSE` 파일 없음 — 사용자 결정 사항
- UI 시험 스크립트 t*.js는 스크래치패드에만 — 재부팅 시 소실 가능

## 다음 할 일
1. 사용자 새 요청 대기(직전 요청 5건 모두 완료·게시)
2. 요청 시: 실기기 핀치 확대, 아티팩트 파일 내려받기를 사용자와 확인
3. 변경 후: 회귀 시험 전체 + `node breadboard/tests/verify74.js` → 커밋 → 두 브랜치 push → Artifact 재게시

## 참조
- 파일: `/home/user/3rd-/breadboard/index.html` 본체 / `/home/user/3rd-/breadboard/README.md` 설명서 / `/home/user/3rd-/breadboard/COPYRIGHT.md` / `/home/user/3rd-/CLAUDE.md` 작업 규칙
- 시험: `/tmp/claude-0/-home-user-3rd-/0e796133-b619-5612-af72-c86b90ba9a5e/scratchpad/` — t(예제) t5(74LS) t6(555) t7(sync10) t8(편집) t11(보드 여러 장) t13(파일 배치) t14(보드 이동·꺾기) t15(자동 배치) t16(전선 차선) t18(scope 예제) t19(일시 정지) t20(100V) t21(터치·계측기·길 따라 전선) t22(7세그·부품 창) t23(속성) t24(배치·클럭 레일) t25(저장)
- 명령: `cd <스크래치패드> && for t in t t5 t6 t7 t8 t11 t13 t14 t15 t16 t18 t19 t20 t21 t22 t23 t24 t25; do node $t.js | tail -1; done`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ (예제 바로 열기: 끝에 `#scope`, `#sync10` 등)
- 브랜치: `ccr-957126bc-kqjtgb` (= main `76135b3`), 저장소 `co2maker-cyber/3rd-`
