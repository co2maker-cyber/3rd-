# HANDOFF — 네트워크관리사 2급 실습장 3종 (2026-11-21)

## 목표
- 네트워크관리사 2급 실기 연습용 브라우저 시뮬레이터(라우터·윈도우·리눅스) 제작·유지

## 현황
✓ router/ (이전 세션 작성) — Cisco IOS 콘솔, 실습 14개, 명령 415개, README
✓ windows/index.html — Windows Server 2016 GUI 시뮬, 과제 21개, 자동 채점, README(706줄)
✓ 피드백 반영 — 기대 값/현재 값 비교 박스, DHCP 권한 부여 채점, gpmc.msc(Default Domain Policy 편집기), Pre-Win2000 로그온 이름, MX FQDN 안내, Default Web Site 제거 허용
✓ linux/index.html — CentOS 7 터미널 시뮬(가상 FS, 계정, ifcfg/nmcli, systemctl, firewalld, rpm/yum, 프로세스, mkfs/mount/fstab, tar, cron, vi), 과제 21개, README
✓ 메인 /home/user/3rd-/index.html에 세 실습장 링크 카드 추가
✓ PR #1 머지 완료 (merge commit 6dcd182)
✓ 루트 README.md 작성·푸시 (커밋 91a165f), HANDOFF.md 커밋·푸시 (58ba1ec) — 둘 다 main 미반영
✓ Playwright 테스트: 윈도우·리눅스 42개 과제 UI로 풀어 전부 만점, 리눅스 명령 300여 개 내부 오류 0, 휴대폰 가로 넘침 0

## 결정사항
- 단일 index.html 구조 유지 — router/와 같은 저장소 관례
- 분할 소스 조각은 저장소에 없음, 빌드 결과만 커밋 — 이후 수정은 index.html 직접 편집
- Windows 시뮬은 밝은 Windows 화면 고정, 셸 패널만 다크 모드 대응
- 리눅스는 항상 root, 권한 검사 없음 / fdisk 대화형 없음(/dev/sdb1 미리 존재) — 범위 축소
- 서비스 포트·DocumentRoot는 start 시점 스냅샷(v.ports, v.docroot) — 설정 후 restart 안 하면 채점 실패하게

## 이슈/주의
- 아티팩트 배포본은 doctype/html/head/body 제거한 사본 필요 (스크래치패드에서 생성)
- 리눅스 소스에 '<body' 문자열 포함(curl 가짜 HTML) → 제거 검사 시 문자열 끝만 확인할 것
- file://로 열면 폴더 링크(router/ 등)가 디렉터리 목록으로 열림, 웹 서버에선 정상
- Stop hook: 추적 안 된 파일 있으면 커밋·푸시 요구함
- 사용자: 한국어 응답, 커밋은 영어 메시지 + 지정 attribution

## 다음 할 일
1. 사용자에게 확인: README.md·HANDOFF.md를 main에 올릴 새 PR 생성 여부 (HANDOFF.md는 머지 전 제거할지도 확인)
2. 요청 시 PR 생성: head ccr-d42f0856-xi7r31 → base main

## 참조
- 파일: /home/user/3rd-/router/index.html, /home/user/3rd-/router/README.md
- 파일: /home/user/3rd-/windows/index.html, /home/user/3rd-/windows/README.md
- 파일: /home/user/3rd-/linux/index.html, /home/user/3rd-/linux/README.md
- 파일: /home/user/3rd-/README.md — 저장소 전체 개요
- 브랜치: ccr-d42f0856-xi7r31 (main에서 재시작, 58ba1ec 푸시됨)
- 저장소: co2maker-cyber/3rd- / PR #1 https://github.com/co2maker-cyber/3rd-/pull/1 (merged)
- 아티팩트: 윈도우 https://claude.ai/artifact/Q8EUcHDJrttKFmU7cCwrv7 (v2), 리눅스 https://claude.ai/artifact/9DV59CisRDzH1dQV4cPKoB (v1)
- 테스트: Playwright `require('playwright')`, chromium.launch() 기본 옵션
