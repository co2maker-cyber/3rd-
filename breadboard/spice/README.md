# 브레드보드 CAD 부품 SPICE 라이브러리

브레드보드 CAD에서 만든 회로를 다른 회로 시뮬레이터(ngspice, KiCad, LTspice, QSPICE)로 한 번 더 확인하고 싶을 때 쓰는 모델 모음이에요. 앱의 다이오드·릴레이·코일 부품과 같은 기준으로 만들었어요.

- `bbcad-parts.lib` — 모델 라이브러리
- `tb-relay.cir` · `tb-inductor.cir` · `tb-bridge.cir` — 확인용 시험 회로(ngspice에서 `ngspice -b tb-relay.cir`)
- 자동 확인: `node breadboard/tests/spice-check.js` (ngspice가 깔려 있을 때)

> 값은 **대표값을 어림한 것**이에요. 실제 부품은 회사·제조 시기마다 다르니, 정확한 설계에는 그 부품을 만든 회사가 공개한 자료와 모델을 따로 확인하세요.

## 앱 부품 ↔ SPICE 모델

| 앱 부품 (kind) | SPICE 이름 | 핀 순서 |
|---|---|---|
| 1N4148 신호용 (`d4148`) | `BB_D_SIG` (다이오드 모델) | A K |
| 1N4007 정류용 (`d4007`) | `BB_D_RECT` | A K |
| 1N5819 쇼트키 (`d5819`) | `BB_D_SCHOT` | A K |
| 1N4733A 제너 5.1V (`dz51`) | `BB_D_ZEN51` | A K |
| 1N34A 게르마늄 (`dge`) | `BB_D_GE` | A K |
| 브리지 정류기 (`brdg`) | `BB_BRIDGE_1A` | AC1 AC2 POS NEG |
| 큐브형 SPDT 릴레이 (`rlyc`) | `BB_RLY_SPDT_CUBE` | A1 A2 COM NO NC |
| DIP DPDT 릴레이 (`rlyd`) | `BB_RLY_DPDT_DIP` | A1 A2 COM1 NO1 NC1 COM2 NO2 NC2 |
| 리드 릴레이 (`reed`) | `BB_RLY_REED_NO` | A1 COM NO A2 |
| (앱에 없음) DIP 6핀급 SPDT | `BB_RLY_SPDT_DIP` | A1 A2 COM NO NC |
| SSR 직류 입력 (`ssr`) | `BB_SSR_DC` | INP INN OUT1 OUT2 |
| 솔레노이드 (`sol`) | `BB_SOLENOID` | P1 P2 |
| 축형 인덕터 100µH (`inda`) | `BB_IND_AXIAL_100U` | IN OUT |
| 레이디얼 인덕터 100µH (`indr`) | `BB_IND_RADIAL_100U` | IN OUT |
| 토로이드 1mH (`indt`) | `BB_IND_TOROID_1M` | IN OUT |
| 다른 값의 인덕터 | `BB_IND L= RDC= SRF= Q= FQ=` | IN OUT |
| 브레드보드 접점·레일 | `BB_CONTACT R=` · `BB_RAIL INCH= RC=` | A B |

- 릴레이는 `VC`(코일 정격 전압)·`PC`(코일 전력)를 바꿔 12V·24V 코일도 쓸 수 있어요. 예: `X1 a b com no nc BB_RLY_SPDT_CUBE VC=12`
- 래칭 릴레이(`rlyl`)는 아직 SPICE 모델이 없어요(상태를 기억하는 부분을 표준 소자만으로 만들기 어려워서).
- 페라이트 비드(`bead`)는 넣지 않았어요. 브레드보드가 다루기 어려운 높은 주파수(수십 MHz 이상)에서만 효과가 있어서예요.

## 모델이 하는 일

- **다이오드**: 쇼클리 식 + 직렬 저항. 순방향 전압 곡선(IS·N·RS)은 `breadboard/tools/fit-diode.py`가 대표 특성점 세 개(예: 1mA·10mA·100mA에서의 순방향 전압)에 맞춰 새로 계산했어요.
- **릴레이**: 코일 저항(정격² ÷ 코일 전력)과 코일 인덕턴스 → 코일 전압을 RC로 늦춰 기계가 움직이는 시간을 흉내 냄 → 정격 75%에서 붙고 10% 밑에서 떨어지는 스위치. NC 접점은 NO보다 먼저 떨어지고 늦게 붙어서 COM이 두 쪽에 동시에 닿지 않아요. 코일을 끄는 순간의 큰 역전압도 그대로 나오니, 역전압 다이오드가 있을 때와 없을 때를 비교해 볼 수 있어요(`tb-relay.cir`: 다이오드 있음 약 5.8V, 없음 수천 V).
- **인덕터**: 선 저항(RDC) + 인덕턴스 + 코어 손실(RP) + 감은 선 사이의 작은 커패시턴스(CP). CP와 RP는 아래 식으로 정해져요.
  - CP = 1 ÷ ((2π × 자기 공진 주파수)² × L)
  - RP = Q × 2π × (Q를 잰 주파수) × L

## 브레드보드에 꽂을 부품을 고를 때

- **다리 굵기**: 브레드보드 구멍의 스프링은 가는 단선(대략 지름 0.4~0.8mm)에 맞춰져 있어요. 3A급 다이오드처럼 다리가 1mm를 넘는 부품을 억지로 꽂으면 스프링이 벌어져, 그 뒤로는 가는 선을 잘 물지 못해요.
- **핀 간격**: 구멍은 2.54mm 간격이고, 가운데 홈 양쪽 줄 사이는 7.62mm예요. 핀이 이 격자에 맞는 부품(DIP·한 줄 SIP·다리를 구부릴 수 있는 축형)만 바로 꽂혀요. 많이 쓰이는 상자형 5V 파워 릴레이 중에는 핀이 격자에 맞지 않는 것이 많아서, 모듈이나 변환 기판을 거쳐야 해요. 표면 실장(SMD) 부품도 변환 기판이 필요해요.
- **전류**: 스프링 접점과 레일에도 저항(접점마다 수십 mΩ)이 있어서, 큰 전류를 흘리면 전압이 떨어지고 열이 나요. 연속 전류는 1A 안쪽으로 두는 게 안전해요. 부품 정격이 3A여도 브레드보드가 먼저 버티지 못해요. 시뮬레이션에서는 `BB_RAIL`·`BB_CONTACT`를 전원 길에 넣어 보면 돼요.
- **주파수**: 나란한 금속 띠 사이의 작은 커패시턴스와 긴 다리의 인덕턴스 때문에, 수 MHz를 넘으면 회로가 계산대로 움직이지 않기 쉬워요. 고주파 회로는 기판(PCB)이나 만능 기판에서 확인하세요.
- **극성**: 다이오드가 들어 있는 리드 릴레이나 SSR 입력은 + / − 를 거꾸로 꽂으면 동작하지 않거나 망가질 수 있어요.

## 시뮬레이터에서 쓰는 법

- **ngspice**: 회로 파일에 `.include bbcad-parts.lib`를 넣고 `ngspice -b 파일.cir`로 실행해요.
- **KiCad**: 부품 기호 → [시뮬레이션 모델] → 파일에서 `bbcad-parts.lib`를 고르고 모델 이름(예: `BB_RLY_DPDT_DIP`)을 고른 다음, 기호의 핀 번호를 위 표의 핀 순서와 하나씩 맞춰요.
- **LTspice·QSPICE**: `.include bbcad-parts.lib`를 회로에 넣고, 다이오드는 D 기호의 값을 `BB_D_SIG`처럼, 서브서킷은 이름이 X로 시작하는 부품으로 불러요.

## 저작권

이 폴더의 파일은 브레드보드 CAD 저작자가 직접 만들었어요(All rights reserved). ngspice·KiCad·LTspice·QSPICE는 각 권리자의 이름·상표이고, 이 파일을 열 수 있는 프로그램을 알려 주려고만 적었어요(제휴·보증 관계 없음). 1N4148 같은 번호는 여러 회사가 같은 규격으로 만드는 표준 등록 번호로, 어떤 급의 부품인지 알려 주는 기술 표기예요. 다른 사람이 만든 SPICE 모델 파일·파라미터·문장을 옮겨 오지 않았고, 어떤 기준으로 만들었는지는 `breadboard/COPYRIGHT.md` 13절에 적어 두었어요.
