# HANDOFF — 브레드보드 CAD 시뮬레이터 (2026-11-27, 22차)

## 목표
- `co2maker-cyber/3rd-`의 `breadboard/index.html`(단일 HTML, 약 7900줄): 브레드보드+회로도+PCB 편집·시뮬레이터. 사용자 요청마다 기능·부품·예제 추가

## 현황
- 작업 브랜치 `ccr-957126bc-kqjtgb` = `0846cf4`(예제 목록 정리). main = `d1df684`(21차까지) → **22차(Ⓟ10·시뮬 고침·목록 정리) main 미반영**. 아티팩트 v73 = `0846cf4`와 같음. `APP_VER='2026-11-27 · 계측기 예제 프로젝트 Ⓟ10'`
△ 전체 시험(백그라운드, 로그 /tmp/claude-0/-home-user-3rd-/0e796133-b619-5612-af72-c86b90ba9a5e/scratchpad/full4.log) — 20/26개까지 모두 PASS, sweep-examples 이후 미확인. 새 세션에서는 다시 돌리기
✓ 20차: 계측기 부품 명세 → 아날로그 IC(`oa2j`·`oa4j`·`oa2n`·`oa2b`·`oa4`·`oa1p` TO-99·`cmp2`·`reg317`), 디지털·혼합(`dac10`·`cpu64`·`eprom`·`sram`·`gpib`), 블록 8(`batt`·`byto`·`bytx`·`bconv`·`bfilt`·`bif`·`bref`·`bcrt`, `blk:1`), BJT(`q3055`·`q2955` TO-3·`q2222m`·`q2907m`·`q18s` TO-18·`qp39` TO-39), JFET(`jfn` TO-18·`jfn92`), 다이오드(`d914`·`d5711`·`d4004`), 74LS174. 모든 부품 `nid`(문서 ID) → `pxPart`가 알아들음
✓ 21차: 전체 부품판 → 이미 있는 것은 `NIDALIAS`(res·cap·trim3296·sipi·inda·bead·reed 등, 값도 읽음), 새 26종(CAPDK `mica`, `ctrim`·`cfeed`·`indv`·`xfmr`·`xflb`·`xtal21`·`xtal10`·`dpin`·`dvar`·`dzref`·`rlyrf`·`rpg`·`kp44`·새 분류 `emc`: `coax`·`edge`·`fuse`·`ntc`·`tco`·`fan`·`emif`)
✓ 분류: `PXSUB`(수동·스위치 쪽, `emc` 추가) / `PXIC` = `ana`·`dig`·`blk` → 부품 고르기 최상위 [아날로그 · 혼합신호 IC · 모듈] `PTREE[6]` `aic`, SCHTREE에도
✓ 예제: Ⓟ8 `paana`(비교기·증폭기), Ⓟ9 `pasa`(보드 3장 계측기 구조), Ⓟ10 `pasys`(설계 명세서 시트 01~05 → 보드 6장, 5V·20V 서플라이, reg317 15V가 보드 3·5와 보드 6 아래 레일). 예제 목록 맨 아래 optgroup "새로 추가 · 아날로그 IC · 계측기 예제"에 Ⓟ8~10
✓ 시뮬 고침(22차, analogStep): `vK` 전원 없으면 `SIM.volt`(지난 settle) / 상태 변경 `chg` 모아 처음 3번 일괄·그 뒤 하나씩(`dIt<60`) — op-amp+달링턴 되먹임이 hi→lin→lo 맴돌던 것 수렴 / op-amp 상태 `r.ast`에서 이어 시작 / DAC 비트가 약한·아날로그 줄이면 전압 ≥2.4V
✓ 시험: verify-parts 202/202, analog-ic PASS(Ⓟ8·9·10 포함), verify74 107/107, sig-check·guide-sync·spice-check PASS(21차 기준 전체 통과)

## 결정사항
- 이미 있는 부품은 새로 안 만들고 문서 ID만 잇기 — 사용자 지시("이미 있는 부품은 추가하지 말고 분류해서")
- 앱에 "HP"·계측기 이름·회사 형번 금지, 문서 참조 등가 번호 안 씀 — COPYRIGHT 14절. 핀 모르는 블록·변압기·GPIB 등은 "이 프로그램이 정한 것" 명시
- Ⓟ10 문서와 다른 값: 감지 저항 10Ω(문서 1Ω), 적분 C 100nF(10nF), DAC 기준 +6.2V 제너(−10V) — 서플라이 음전압 없음·보기 좋은 값. COPYRIGHT 8절 기록
- 시험 통과 즉시 main 반영 + 아티팩트 publish, 묻지 않음 — 사용자 11-27 재지시, CLAUDE.md에 추가함

## 이슈/주의
- 사용자: 한국어 쉬운 말(~해요), 즉시 구현, **답마다 아티팩트 링크**, main 반영 시 깃허브 페이지 주소
- psu(서플라이)는 0V 이상만 → 연산 증폭기는 단전원·가상 접지. psu 하나라도 놓으면 보드 자동 5V 레일 꺼짐
- ledKit 예제: 한 열 빈 구멍 3~4개뿐 → 연결 많은 줄은 `K.at(b,top,col)` 빈 열을 이음점으로. `K.add(w(...))`로 레일 체인. 레일 열 6의 배수 구멍 없음. 같은 구멍 전선 둘 불가
- 코드 수정 = Python 치환(개수 assert). 한 줄짜리 코드 중간에 `//` 주석 넣으면 뒤가 주석 처리됨(22차에 한 번 터짐)
- pcb-examples 못 이음 수는 실행마다 다름(ldec 등), 오류 0이면 통과. sweep-lists `sch bad2~4`는 정상
- Bash 명령에 `$SP` 같은 변수+heredoc 섞으면 안전 검사에 막힘 → 경로 직접 쓰기

## 다음 할 일
1. `cd /home/user/3rd-/breadboard && for f in tests/ui/*.js; do node $f | tail -1; done; node tests/verify-parts.js | tail -1; node tests/verify74.js | tail -1` (백그라운드 `run_in_background`)
2. 전부 통과 → `git fetch origin main && git push origin HEAD:main` (fast-forward) → 아티팩트 publish(url 아래, file_path `breadboard/index.html`) → 링크 2개 전달
3. 이후 사용자 요청 대기. 후보: 음전원 서플라이, 회로도 시뮬(SIM_S)에 아날로그 IC, TO-3 발자국 실제 치수

## 참조
- 파일: /home/user/3rd-/breadboard/index.html · COPYRIGHT.md · FILE-FORMAT.md · PARTS-GUIDE.md(안내서 사본은 `node tests/guide-sync.js --fix`) · /home/user/3rd-/CLAUDE.md
- 시험: tests/ui/analog-ic.js(20~22차 부품·예제), tests/verify-parts.js(아날로그 IC 묶음·명세 ID 대조)
- 커밋 끝: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_01Y4YTP48vpTM29RzzpT3A5Y`
- 아티팩트: https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ · 깃허브 페이지: https://co2maker-cyber.github.io/3rd-/breadboard/
