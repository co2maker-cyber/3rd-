# 작업 규칙

- 변경을 마치면 시험 → 커밋 → 작업 브랜치 push 후, **묻지 않고 `main`에도 반영**한다(fast-forward push: `git push origin HEAD:main`). 사용자가 2026-11-24에 "앞으로는 자동으로 main으로 업데이트"하라고 지시함.
- fast-forward가 안 되면(main에 모르는 커밋이 있으면) 강제로 덮어쓰지 말고 사용자에게 알린다.
- PR은 사용자가 요청할 때만 만든다.
- 사용자에게는 한국어, 쉬운 말투(~해요)로 답하고, 결과마다 미리보기 아티팩트 링크를 함께 준다.
- **업데이트를 하면 무조건 접속 링크(아티팩트 주소 https://claude.ai/artifact/MESkx63X1tB2CcvhD3hqSJ)를 답에 넣는다.** 시험이 덜 끝났거나 main 반영 전이어도 링크는 빠뜨리지 않는다(사용자 2026-11-25 지시).
- `main`에 반영했으면 깃허브 페이지 주소 https://co2maker-cyber.github.io/3rd-/breadboard/ 도 함께 준다(main push 뒤 1분쯤 지나 자동 배포됨).
- 진행 상황과 세부 결정은 `HANDOFF.md` 참고.
- `breadboard/`에 부품·설명 문구·예제·외부 에셋을 추가할 때는 `breadboard/COPYRIGHT.md` 5절 점검표를 따른다(데이터시트·강좌 문장 복사 금지, 제조사 상표·타사 제품명을 제품명처럼 쓰지 않기, 외부 에셋은 라이선스 확인 후 7절 표에 기록).
