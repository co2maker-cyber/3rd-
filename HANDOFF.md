# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-24, 2차)

## 목표
- 저장소 `co2maker-cyber/3rd-`의 `breadboard/`: 브레드보드에 IC·부품·계측기 놓고 배선해 시험하는 단일 HTML 사이트. 사용자 요청마다 기능 추가.

## 현황
✓ 본체 `/home/user/3rd-/breadboard/index.html` 2417줄(외부 스크립트 없음, Google Fonts만). `origin/main` = `ccr-957126bc-kqjtgb` = `76135b3`
✓ 아티팩트 v17 게시(capabilities `sample{images:true}`, `downloads:true` 유지)
✓ 보드 이동: 몸통(구멍 없는 곳) 끌기 `startBoardDrag`/`slideBoard`, [보드 이동] 도구 `move`(M)
✓ 겹치지 않게 자동 배치: `ghostAt`/`gateGhost`→`fitsHere`/`bodyRect`, 찬 구멍은 같은 줄 빈 구멍 `landing`
✓ 전선: 직선+둥근 꺾임 `wirePath`, 자동 차선 분리 `buildRoutes`→`ROUTES`(`routePts`/`ownPts`), 가운데 손잡이 `data-mid`, 그리면서 꺾기 `pendPts`, 끌고 간 길 따라 놓기 `wireDrag.path`→`tracePts`(`rdp`,`offRow`,`offCol`)→`declash`
✓ 전선 길(180·45 모드, 손 꺾는 점 없을 때 `autoRoute`): 한 줄 위면 곧게(`pts` 없음). 위·아래 절반 건너면 `crossRoute`(가로 틈 yu→빈 세로 틈 xc(끝 구멍 열 포함)→yv, 부품 몸통·기존 전선 겹침 `legTest` 피함, 보드 돌기 금지 — 사용자 지시). 끝 줄에 부품 다리 있으면(`compAt`) 같은 쪽은 y축으로 보드 밖(`outY`)까지 빼서 연결, 바깥 차선 `freeLane`로 20씩 비킴. 그 외 a 옆 가로 틈(`gapYs`) 중 안 겹치는 것, 다 막히면 ㄱ자. 꺾는 점·손잡이 `gapSnap`(구멍 사이 20 격자), 두 꺾는 점 사이 구간 끌기 `drag.kind='seg'`. 계측기 단자는 `onBd` 거짓(b:0)
✓ 전선 각도 `opt.ang` '180'(기본)/'45'/'free'(`ANGN`, `setAng`/`toggleAng`, A 키, 전선 옵션 막대 `data-ang`): `snapDir`(꺾는 점을 앞 점 기준 허용 방향으로), `elbow`(끝 구멍까지 한 번 꺾기), `angRoute`(클릭 배치·미리보기), `routeFromPath`(끌기 배치: 180·자유=`tracePts`, 45=`rdp`→`angRoute`). 한 줄에 있으면 `pts` 없음→자동 차선 유지
✓ 계측기 `INST`(psu/bat/fg/osc): 몸통 `c.x,c.y` 먼저 배치(`instGhost`), 단자 구멍 `@k:i`(`syncTerms`,`termAt`,`isTerm`,`c.k`)에서 전선 연결. 예전 형식은 `migrateInst`가 변환
✓ 계측기 속성 전부 숫자 입력(`numIn`, `input[data-n]`, `instProps`): PSU 0~100V, 건전지 0.1~48V, FG 파형 4종·0.1~10Hz·Vpp·오프셋 `off`·듀티 `duty`, 스코프 `tdiv`/`vdiv`/`vdiv2`/`pos1`/`pos2`/`on1`/`on2`
✓ PSU·건전지 있으면 레일 자동 5V 꺼짐(`resolve`의 `srcV`). + 레일에 클럭/FG 물리면 그 레일 자동 5V 해제(`clkNets`), 점검에 `info` 항목
✓ 일시 정지 `simNow()`/`setPaused`(버튼 `#pause`, P)
✓ 슬로우 모드 `SLOW{on,rate,ms,last}`/`setSlow`/`toggleSlow`(버튼 `#slow`, O, 배지 `#sbadge` ½·¼·⅒): `simNow`=simBase+경과×rate(`rebaseTime`). `settle`이 `SLOW.ms`마다 칩 계산 1회만(그 외 0회)→`SIM.pending`, 타이머가 계속 한 단계씩. 단계 간격=min(140ms/rate, 최고 클럭 실시간 반주기/3). `findFlows`가 전선별 레벨 `WLV` 비교→바뀐 줄을 구동점(칩 출력·레일·계측기·클럭, 없으면 저항)에서 BFS→`FLOWQ`, `render`가 `launchFlows`로 `#gF` 층에 흐르는 빛+출력 바뀐 칩 주황 테두리(`tickFlows` rAF)
✓ 화면: 페이지 스크롤 없음(100dvh), 리본 숨김(`.ribbon{display:none!important}` — DOM·`renderRibbon` 잔존), 부품은 `#partOpen`→`#partDlg`(`PCATS`,`renderParts`)만, 속성·점검·객체는 `#dock` 팝업(`openDock`/`closeDock`, 도구 막대 `[data-dock]`), 도구 옵션 `#optCard.optbar`
✓ 시작 화면 = 빈 표준 보드 1장(칩·전선 없음). 직전 자동 저장 `circuit`은 시작 시 `last` 키로 옮겨 저장 창 맨 위 '지난번 하던 회로'로 제공, 시작 시 `curName` 비움. `#예제` 링크는 그대로 동작. t.js는 `#nand`로 열도록 수정, t26(빈 시작)·t27(슬로우)·t28(전선 각도)·t29(전선 길)·t30(부품 고르기)·t31(구멍 톡 전선)·t32(틈 안 차선)·t33(전선 밑 구멍) 추가
✓ 저장·불러오기 `#saveDlg`(`savedList`,`saveLocal`,`saveToFile`; localStorage 키 `bblab.v1.saves`), Ctrl+S
✓ 7세그먼트 새 모양(기운 획·핀 번호·이름), 터치 핀치 `tpinch`(touch 이벤트 직접 처리), 좁은 화면 도구 막대 한 줄
✓ 전선 밑 빈 구멍: pointerdown에서 전선(g) 위라도 빈 구멍 중심 가까이(마우스 6.5/터치 8, 전선 잇는 중이면 9/11)면 g=null로 보고 구멍 처리
✓ 틈 안 차선: 같은 쪽 경로는 틈마다 [가운데, ±5] 차례로 시험(먼 틈으로 돌지 않음 — 사용자 지시), `crossRoute`도 가로·세로 틈 ±5 후보. 전선 고르면 [길 다시 찾기] `rerouteSel`(자기 빼고 `angRoute` 다시)
✓ 선택 도구에서 구멍 톡 = 전선 시작/완성 `selTap`(잠깐 tool='wire'로 `place` 호출; `endPan`·`finishWire`·`finishBox`의 톡 경로). 신호 보기(`sigMode`, 저장됨)에서 Z(안 이어진) 전선은 제 색 유지 — 사용자가 '전선이 회색으로 변함' 신고
✓ 부품 고르기 = 한 창 계층 이동 `PTREE`(기본 부품/계측기·전원/기본 게이트/IC→`ic-*` 종류→칩), `pnav` 경로, `#partCats`=경로 줄(‹ `data-up`, `data-go`), 폴더 `data-pf`, 칩 `data-pt`, 검색은 전체. 휴대폰은 폴더 한 줄(`.pgrid.folds`)
✓ IC 106종(+59): HC판 복제 `hcClone`, 오픈 컬렉터 `ocGate`(03·05·07·09), 126·132·73·109·273·373·374·595·165·194·163·393·42·148·158·83·688·244·240. 분류 `CATS`에 `shift` 추가
✓ IC 검증 `breadboard/tests/verify74.js` 106/106 통과(새 칩 기준 모델 추가, 일부러 넣은 버그 잡는 것 확인). 수정: RBO(`ls47`·74LS48), `UP192`/`DN192`, 프리셋·클리어 X 처리, 칩별 전원 범위 경고, NE555 문턱 VCC 추종
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
- 시험 중 Google Fonts 접속 실패(ERR_TUNNEL_CONNECTION_FAILED)가 errors에 찍힐 수 있음 — 네트워크 문제, 코드 오류 아님
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
- 명령: `cd <스크래치패드> && for t in t t5 t6 t7 t8 t11 t13 t14 t15 t16 t18 t19 t20 t21 t22 t23 t24 t25 t26 t27 t28 t29 t30 t31 t32 t33; do node $t.js | tail -1; done`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ (예제 바로 열기: 끝에 `#scope`, `#sync10` 등)
- 브랜치: `ccr-957126bc-kqjtgb` (= main `76135b3`), 저장소 `co2maker-cyber/3rd-`
