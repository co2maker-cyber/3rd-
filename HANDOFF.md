# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-26, 20차 완료)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 7600줄): 브레드보드+회로도+PCB 편집·시뮬레이터. 사용자 요청마다 기능 추가·수정. 같은 저장소 `linux/`·`router/`·`windows/` 실습장, 루트 `index.html`

## 현황
- main = 작업 브랜치 `ccr-957126bc-kqjtgb`(20차 반영, 전체 시험 통과 후). 아티팩트 v71. `APP_VER='2026-11-26 · 아날로그 IC·금속 캔 부품'`
✓ ~15차: 오류 알림, PCB(자동 배선·DRC·거버 zip), 연결 체크, 순서 카드, 저작권 가이드, 서명 `AUTHOR_SIG`, 라이선스 키 `LIC_*`, 릴레이·코일, 다이오드 `DIOM`, SPICE `breadboard/spice/`, `PARTS-GUIDE.md`, 목록 배치 `pxPart`, PCB 범위 선택·지우개
✓ 16~18차: PCB 부품 놓기 `pcbPick`/`pcbPlaceAt`(회로도·보드에도), 장착 구멍 `PCB.xp`, `pcbToSch`, 층별 보기 `pview`/`#pLbar`, [층 쌓기] `#pStackB`, 트랜지스터 9종 PX `sub:'tr'`(`q3904`·`q2222`·`qbc547`·`q3906`·`qbc557`·`qtip`·`m7000`·`mnpow`·`mppow`), 예제 Ⓟ7 `pastr`
✓ 19차 검토 3회(사용자 "소자부터 검토 3번"): 1차 소자·시뮬·PCB, 2차 1차수정+화면 조작, 3차 2차수정+새 기능 — 모두 수정·시험 통과·main 반영
✓ 19차 PCB 표준 기능 1단계(사용자 명세 .md, 원문 미보관): 넷 이름표 `lbl`(`isSchSym`·`lblName`, GND/VCC 이름표=전원 기호 줄), ERC `schERC`/`#ercDlg`, 번호 정리 `schAnnotate`, 동박 채우기 `PCB.pour[L]`(`pourRaster` 0.25mm, 거버 `pourCu` Mixed), 정렬 `pAlign`, 둥근 모서리 `PCB.rc`(`inRRect`/`boardPoly`, 판·채움 `cornerClears`), 선 저항·허용 전류 `trR`/`trImax`, 묶음 BOM `pcbBOMRows`(lk·tol·mat·pw·dk 구분), 조립도 `pcbAssemblySVG`
✓ 19차 [거버 받기] `#gbrDlg`(`pcbExport`→`gbrDownload`, 막히면 파일별 [보기] `showFallback(fn,data,true)`). 버그 고침: 막힌 화면에서 성공 알림이 실패 알림 덮어쓰던 것
✓ 19차 층 수 무제한(`normNL` 1·짝수, `PCB_MAXL`=128, `LNAME`/`LSHORT`/`PCOL` Proxy `In\d+`, `pDefInner`, `pMinTh`, `#pNLn`), 자동 배선 층 자동 늘리기 `PCB.autoL`(`routeBest`·`pAddLayerPair`·`pTrimLayers`, 14초), 층 주 방향 dirP, 배치 최적화 `pcbOptimizePlace`(담금질 HPWL+넓이), [자동 설계] `#pAuto`, [배치 최적화] `#pOpt`
✓ 시뮬 구조(19차): 트랜지스터 스위치/아날로그 모드 `r.an`(이미터·소스 strong 아니면 VCCS beta·포화 0.2V / MOSFET gm·lin), 한 번에 서로 물리지 않은 것만 일괄 바꿈, 릴레이 `SIM.rr`(4)·전체 `SIM.rd`(24, 상한 28) 따로, `uf2`(트랜지스터 접점 뺀 연결)로 베이스 눌러 끄기, 직류 길 없는 미지 줄 volt 제외(떠 있음=null), 아날로그 줄 닿은 LED는 다이오드 `ledL`/`ledA`(색별 vf, 켜짐=전류 `rt(c).ai`>0.2mA)
✓ 실행 취소: `ssnap()`에 보드 `bb` → `sApply`가 보드 그대로 되돌림(+`pushHist`), `schAutoSync` 보드 바뀌면 PCB `phist` 비움, 자동 동기화는 실행 취소 단계 아님, `boardToSch`가 이름표·부품 차례 유지, `#clr` 되돌리면 `_pcb`·`_name` 복원
✓ 시험 전부 통과(20차): tests/ui 26종, verify-parts 172/172, verify74 107/107, sig-check, guide-sync, spice-check
✓ 20차 부품 26종(명세 .md 원문 미보관): `PXSUB` `ana`·`blk` 추가. BJT `q3055`·`q2955`(TO-3, `fp:'to3'`, 다이오드 `bep`)·`q2222m`·`q2907m`(TO-18)·`q2219`(TO-39), JFET `jfn`(`tr.jf`, nmos vth −2.5), 다이오드 `d914`(`sig80`)·`d5711`(`ss70`)·`d4004`(`rect400`)·한 줄 브리지 `br600`(`br6`), 연산 증폭기 `oa2j`·`oa2b`(`hdl` 아래 여유)·`oa4`·`oa1p`(TO-99 `fp:'to99'`), 비교기 `cmp2`, 레귤레이터 `reg317`, DAC `dac8`(~CS·~WR 래치 `r.dcode`), 블록 `bmix`·`bvco`·`bifa`·`blog`·`batt`·`bdefl`·`bhv`(`blk:1`), CPU `cpu64`(DIP-64, `rw:22.86` 발자국 줄 간격), 74LS174. 모두 `nid` → `pxPart`가 알아들음. 속성 창 `anaTx`, 전원 없음 경고(핀 이름), JFET 게이트 경고, 회로도 상자에 상태, 예제 Ⓟ8 `paana`(트리머 → 비교기·증폭기 LED), 시험 `tests/ui/analog-ic.js`, verify-parts '아날로그 IC' 묶음(전체 172개)
✓ 20차 아날로그 IC 계산 틀(`a77dda9`): `anaL`(settle, PX 필드 `ana:{oa:[{o,p,n}],cmp:[{o,p,n}],reg:{adj,out,in,vref,drop,ro},dac:{io1,io2,vref,rfb,vdd,gnd,bits,R},vcc,vee,gnd,A,ro,hd,vmin,ron}`), analogStep 도장(가짜 GND 줄 -1, `vccs` 정의 앞으로 옮김), 상태(oa lin/hi/lo, cmp 0/1, reg reg/drop), 가지치기, `r.ast` 기록. 회로도 시뮬(SIM_S)은 아날로그 계산 안 함(상태 '—')
✗ 미검증: 실제 아이폰·윈도우 크롬 저장, 거버 외부 뷰어(gerbonara 설치 권한 거절됨)

## 결정사항
- 저작권(COPYRIGHT.md 14절): 외부 자료는 사실·수치·핀 번호만, 문장·표 복사 금지, 상표·회사 전용 번호 대신 기능 이름 — 20차 부품은 문서의 중립 ID(`OPAMP_DUAL_JFET_25VUS` 등)를 `nid`로, 앱에 "HP" 표기 금지
- 20차 부품 범위: 74LS174(6채널 D FF, 핀 1 ~CLR·2 1Q·3 1D·4 2D·5 2Q·6 3D·7 3Q·8 GND·9 CLK·10 4Q·11 4D·12 5Q·13 5D·14 6D·15 6Q·16 VCC) CHIPS 시뮬 / 연산증폭기 4·비교기·레귤레이터·DAC = `ana` 아날로그 / BJT 5(TO-3·TO-18·TO-39)·JFET(depletion = nmos vth≈-2.5)·다이오드 3·브리지 600V = 기존 tr/dio / CPU DIP-64·RF·IF·CRT 블록 8 = 블랙박스(핀만, 시뮬 없음)
- 인덕터 직류 단락, 지우개 부품 안 지움, 손가락 1개=화면 이동, CAD 안 AI 호출 금지, showSaveFilePicker 안 씀, PCB 격자 1.27mm
- 층 자동 늘리기: 새 층은 뒷면 위에 붙임 — 기존 In 이름 유지
- 트랜지스터는 스위치+아날로그 혼합 — 전면 아날로그(LED 포함)는 디지털 예제 다수 영향

## 이슈/주의
- 전원(psu)은 0V 이상만 → 연산 증폭기는 단전원(VEE=GND)·가상 접지로 시험. 음전원 없음
- TO-3 발자국 치수는 어림(다리 ±5.46, 장착 구멍 ±15.09 같은 줄)
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, **업데이트마다 아티팩트 링크 무조건**, main 반영 시 깃허브 페이지 주소. 요청 짧고 모호 → 스크린샷·어디서 안 되는지 물어봄
- CLAUDE.md: 시험→커밋→`git push -u origin ccr-957126bc-kqjtgb`→`git push origin HEAD:main`(fast-forward만). 커밋 끝 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 새 대화에서 아티팩트 publish 거절되면: 현재판 = 저장소 전 판인지 diff 확인 → 사용자에게 덮어쓰기 물어 `force:true`
- 코드 수정 = Python 문자열 치환(개수 assert). 변수 이름 겹침 주의(`oldW` 사례로 스크립트 전체 멈춤)
- 시험 예제: 레일 열 6의 배수 구멍 없음, `psu` 놓으면 레일 자동 5V 꺼짐, `EXAMPLES.nand()`는 배열(`e.comps||e`)
- `ic-examples` 동시 실행 시 가끔 FAIL(단독 PASS), `sweep-lists` 끝 `sch bad4`는 정상
- 백그라운드 시험은 Bash `run_in_background`로(`&`는 알림 없음)
- PX 부품 추가 시 verify-parts.js가 `Object.keys(PX)` 전부 확인 → 새 kind마다 rec 필요, CHIPS 추가 시 verify74.js REF 필요(`add([...],{pins,vcc,gnd,outs,test})`)
- 다이오드 시험 기대: 9mA에서 게르마늄 > 쇼트키 가능(LED 아날로그 포함 후) — 실제 특성
- 남은 알려진 문제: 예제·파일 불러오기 실행 취소 시 회로도 전용 기호 안 돌아옴, 동박 채움 0.025mm² 조각, 큰 보드 pour pcalc 느림(500mm 약 580ms)

## 사용자 지시 기록 (COPYRIGHT.md 10절 근거)
- ~11-25: 시뮬레이터 방향, AI 호출 금지, 부품 220종, 자동 main, 오류 알림, PCB, 업데이트마다 링크, 깃허브 페이지
- 11-26: 연결 체크·초기화, 순서 카드, md 내려받기, 저작권 가이드, 라우터 일반화, 서명, 라이선스 키, 로컬 버전, 릴레이·코일, 조사 문서 반영(2회), "왜 추가가 안될까?", PCB 드래그·지우개, PCB 부품 배치·층 쌓기·거버, 트랜지스터, 층 쌓기 버튼, 층별 보기, 검토 3번, PCB 표준 기능 명세, 거버 다운, 층 자동 늘리기·무한·효율 배치·배선, HP 8566B 기반 부품 명세 추가(20차 완료)

## 다음 할 일
- 사용자 다음 요청 대기. 후보: 음전원(−V 서플라이) 지원, 회로도 시뮬에 아날로그 IC, SPICE 라이브러리에 새 부품 모델, TO-3 발자국 실제 치수 확인

## 참조
- 파일: `/home/user/3rd-/breadboard/index.html` · `COPYRIGHT.md` · `FILE-FORMAT.md` · `PARTS-GUIDE.md` · `spice/` · `tools/fit-diode.py` / `/home/user/3rd-/CLAUDE.md`
- 시험: `cd /home/user/3rd-/breadboard && for f in tests/ui/*.js; do node $f | tail -1; done` · `node tests/verify-parts.js` · `verify74.js` · `sig-check.js` · `guide-sync.js --fix` · `spice-check.js`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ
- 깃허브 페이지: https://co2maker-cyber.github.io/3rd-/breadboard/
