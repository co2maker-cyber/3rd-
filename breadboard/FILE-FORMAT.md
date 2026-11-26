# 브레드보드 CAD 파일 만들기 안내서

이 문서는 브레드보드 CAD(`breadboard/index.html`)가 **바로 불러올 수 있는 파일**을 만드는 방법을 정리한 거예요.
사람이 직접 써도 되고, 이 문서를 통째로 AI에게 주고 "이 형식으로 ○○ 회로 파일을 만들어 줘"라고 해도 돼요.

파일 형식은 두 가지예요.

| | A. 부품·연결 목록 (쉬움) | B. 회로 저장 파일 (정확함) |
|---|---|---|
| 확장자 | `.txt` `.csv` `.md` `.net` 또는 `.json` (`parts`/`nets`) | `.json` (`comps`) |
| 쓰는 내용 | 부품 이름과 "어떤 핀끼리 이어지는지"만 | 부품마다 꽂을 **구멍 위치**까지 |
| 배치 | CAD가 알아서 꽂고 전선을 이어요 | 쓴 그대로 꽂혀요 |
| 불러오는 곳 | 부품 리본 **[파일로 부품 배치]** (글을 붙여 넣어도 돼요) | 도구 막대 **[열기]** ▸ 파일에서 불러오기 |
| 추천 | 처음 만들 때, AI에게 시킬 때 | 보기 좋게 다듬은 배치를 그대로 남길 때 |

> 두 형식 모두 **[열기]** 로 골라도 되고 캔버스에 끌어다 놓아도 돼요. CAD가 내용을 보고 알아서 구분해요.
>
> 잘 모르겠으면 **A 형식**으로 만드세요. 틀린 줄이 있어도 CAD가 "확인이 필요한 부분"으로 알려 줘요.

---

## A. 부품·연결 목록 형식

### A-1. 기본 규칙

- 한 줄에 **부품 하나** 또는 **연결 하나**를 써요.
- `#` 또는 `//`로 시작하는 줄은 메모라서 무시해요. 줄 끝의 `← 설명`, ` // 설명`도 무시해요.
- 부품 줄: `이름 종류 [값]`
- 연결 줄: `[연결이름:] 이름.핀, 이름.핀, …` (쉼표, 공백, `-`, `->` 아무거나로 나눠도 돼요)
- 연결 이름이 `VCC`·`VDD`·`5V`·`전원` 이면 **+ 레일(5V)**, `GND`·`VSS`·`0V`·`접지` 면 **− 레일**에 이어져요.
- IC의 전원 핀(VCC·GND)을 안 쓰면 CAD가 자동으로 레일에 이어 줘요.

```text
# 부품
U1  74LS08
SW1 스위치 on
SW2 스위치
R1  저항 10k
R2  저항 10k
R3  저항 330
D1  LED green

# 연결
VCC: SW1.1, SW2.1
A:   SW1.2, R1.1, U1.1
B:   SW2.2, R2.1, U1.2
GND: R1.2, R2.2, D1.K
Y:   U1.3, R3.1
N1:  R3.2, D1.A
```

### A-2. 부품 종류 (두 번째 칸)

대소문자는 상관없어요. 한국어로 써도 돼요.

| 종류 | 이렇게 써요 | 값(세 번째 칸) | 핀 이름 |
|---|---|---|---|
| IC | `74LS08`, `74HC595`, `NE555`, `CD4511` … (부록 표의 이름) | 없음 | 핀 **번호** `1`~`n` 또는 핀 이름(`1A`, `VCC`, `~CLR` …) |
| 단독 게이트 | `AND` `OR` `NOT` `NAND` `NOR` `XOR` `XNOR` | 없음 | `A` `B` `Y` (NOT은 `A` `Y`) |
| 저항 | `저항` `R` `resistor` | `220` `330` `1k` `4.7k` `10k` `47k` `100k` `1M` | `1` `2` |
| LED | `LED` `D` | `red` `green` `yellow` `blue` (또는 빨강·초록·노랑·파랑) | `A`(+) `K`(−) |
| 토글 스위치 | `스위치` `SW` `switch` `DIP` | `on` 이면 켜진 채 시작 | `1` `2` |
| 푸시 버튼 | `버튼` `BTN` `button` `택트` | 없음 | `1` `2` |
| 커패시터 | `커패시터` `C` `capacitor` `콘덴서` | `10n` `100n` `1u` `10u` `47u` `100u` `470u` (또는 `104` 같은 3자리 코드) | `+` `-` |
| 클럭 발생기 | `클럭` `CLK` `clock` | Hz: `0.5` `1` `2` `4` `10` | `OUT` (아무 이름이나 하나) |
| 7세그먼트 | `7세그` `SEG7` `FND` | `cathode`(기본) / `anode` | `a`~`g`, `dp`, `COM` 또는 `1`~`10` |
| 다이오드 | `다이오드` `diode`, 또는 종류 칸에 번호 그대로(`1N4148` `1N4007` `UF4007` `1N5819` `1N34A` `BAT85`) · `D`는 값에 번호가 있을 때만 다이오드 | 번호(`1N4148` 등) 또는 `신호`·`쇼트키`·`제너` (없으면 1N4007) | `A`(+) `K`(−) |
| 제너 다이오드 | `제너` `zener` `ZD` `1N4733A` | 없음(5.1V) | `A` `K` |
| 브리지 정류기 | `브리지` `bridge` `BR` | 없음 | `+` `-` `AC1` `AC2` (또는 `1`~`4`) |
| 릴레이 | `릴레이` `relay` `K` | `5V`·`12V`·`24V`, `리드`(reed)·`DPDT`·`래칭`·`SSR` (없으면 큐브형 SPDT) | `A1` `A2`(코일) `COM` `NO` `NC` (DPDT는 `COM1` `NO1` `NC1` `COM2` …) |
| SSR | `SSR` `반도체릴레이` | 없음 | `+` `-`(입력) `출력` 핀은 `3` `4` |
| 솔레노이드 | `솔레노이드` `solenoid` `SOL` | `5V`·`12V`·`24V` | `1` `2` |
| 트랜지스터 | `트랜지스터` `transistor` `TR` `Q` `NPN` `PNP`, 또는 번호 그대로(`2N3904` `2N3906` `2N2222A` `BC547` `BC557` `TIP120`) | 번호, 또는 `PNP`·`달링턴` (없으면 2N3904) | `E` `B` `C` (`emitter` `base` `collector`도 돼요) |
| MOSFET | `MOSFET` `FET` `NMOS` `PMOS`, 또는 `2N7000` | `파워`·`로직`(TO-220 N채널), `P채널` (없으면 2N7000) | `G` `D` `S` (`gate` `drain` `source`도 돼요) |
| 코일·인덕터 | `코일` `인덕터` `inductor` `L` `choke` | 값 `100uH` `1mH` …, `축형`·`토로이드`·`공심`·`비드` (없으면 드럼 코어) | `1` `2` |
| 가변저항 | `가변저항` `POT` `VR` | `10k` 등 | `1` `2`(와이퍼) `3` |

- 저항·커패시터·클럭 값은 위 목록 중 **가장 가까운 값**으로 맞춰져요. 다른 값(예: 2.2kΩ, 가변저항, 2색 LED, 계측기)이 필요하면 배치한 뒤 CAD에서 바꾸거나 **B 형식**을 쓰세요.
- IC 핀 번호는 일반 DIP 순서(1번 왼쪽 아래에서 시작해 시계 반대 방향)예요. 핀 이름은 부록 표를 보세요.
- 앞에 `~`, `/`, `!` 를 붙이거나 끝에 `'`, `BAR`, `_N` 을 붙이면 "낮을 때 동작"하는 핀(예: `~CLR`)을 찾아요.

### A-3. CSV로 쓰기

부품 줄은 `ref,type,value` 형식도 읽어요. 첫 줄 머리글은 건너뛰어요.

```csv
ref,type,value
U1,74LS04,
R1,resistor,330
D1,led,red
```

연결은 CSV 아래에 A-1과 같은 연결 줄로 이어 쓰면 돼요.

### A-4. JSON으로 쓰기 (AI에게 시킬 때 편해요)

```json
{
  "title": "AND 게이트 시험",
  "parts": [
    {"ref": "U1",  "type": "74LS08",   "value": ""},
    {"ref": "SW1", "type": "switch",   "value": "on"},
    {"ref": "R1",  "type": "resistor", "value": "10k"},
    {"ref": "R3",  "type": "resistor", "value": "330"},
    {"ref": "D1",  "type": "led",      "value": "green"}
  ],
  "nets": [
    {"name": "VCC", "pins": ["SW1.1"]},
    {"name": "A",   "pins": ["SW1.2", "R1.1", "U1.1", "U1.2"]},
    {"name": "GND", "pins": ["R1.2", "D1.K"]},
    {"name": "Y",   "pins": ["U1.3", "R3.1"]},
    {"name": "N1",  "pins": ["R3.2", "D1.A"]}
  ],
  "notes": ["스위치를 켜면 LED가 켜져요"]
}
```

- `parts[].type`은 A-2 표의 아무 표기나 돼요.
- `nets[].pins`는 `"이름.핀"` 글자들이에요. VCC·GND가 아닌 연결은 핀이 **2개 이상**이어야 해요.
- 이 파일을 열면 목록 칸에 A-1 형식으로 바뀌어 들어가고, **[보드에 배치하기]** 를 누르면 꽂혀요.

### A-5. 회로를 목록으로 바꿀 때 지키면 좋은 규칙

1. **입력 단자**(A, B, PR, CLR 같은 이름표, 로직 입력)는 `스위치`(VCC ↔ 신호) + `저항 10k`(신호 ↔ GND)로 바꿔요. 평소 High여야 하는 `~PR`·`~CLR`은 스위치를 `on`으로 시작해요.
2. **클럭 입력**은 `클럭 1` 부품으로 바꿔요.
3. **출력 표시**(프로브, 출력 이름표)는 `LED`(애노드가 신호 쪽) + `저항 330`(캐소드 ↔ GND)로 바꿔요.
4. 지원하지 않는 IC는 핀 배치가 같은 가장 가까운 IC로 바꾸고 메모(`#`)에 적어요.
5. 보이지 않는 연결은 지어내지 않아요.

---

## B. 회로 저장 파일 형식 (`.json`)

CAD에서 **[저장] ▸ 파일로 내려받기**를 하면 나오는 파일과 같은 형식이에요. 부품마다 꽂을 구멍을 직접 적어요.

### B-1. 전체 모양

```json
{
  "app": "breadboard-lab",
  "v": 2,
  "name": "내 회로",
  "boards": [{"id": 1, "type": "std", "x": 0, "y": 0}],
  "comps": [ … 부품들 … ]
}
```

| 칸 | 꼭 필요? | 뜻 |
|---|---|---|
| `comps` | **필수** | 부품·전선 목록(배열). 이게 있어야 회로 파일로 알아봐요 |
| `boards` | 선택 | 브레드보드 목록. 없으면 표준 50열 1장 |
| `name` | 선택 | 회로 이름(40자까지) |
| `app`, `v` | 선택 | 형식 표시. 그대로 써 두면 좋아요 |
| `sch` | 선택 | 회로도 편집 내용. **빼면** CAD가 보드를 보고 회로도를 새로 그려요 |
| `pcb` | 선택 | PCB 편집 내용(부품 자리·구리 선·비아, 단위 mm). 층 쌓기 `nl`(1·2·4·6, 없으면 2), 안쪽 층 `inner`(`{"t":"sig"}` 신호 또는 `{"t":"plane","net":"GND"}`·`"VCC"` 판), 두께 `th`(mm), 장착 구멍 `xp`(`{"key":"m1","kind":"mh3"}`, kind = `mh25`·`mh3`·`mh4`)도 들어가요. 선의 층 `l` = `F`·`In1`~`In4`·`B`. **빼면** PCB 화면을 열 때 회로도를 보고 새로 놓아요. AI가 만들 때는 빼 두세요 |

부품의 `id`는 쓰지 않아도 돼요. 불러올 때 1번부터 다시 매겨요.

### B-2. 브레드보드 (`boards`)

```json
"boards": [
  {"id": 1, "type": "full", "x": 0, "y": 0},
  {"id": 2, "type": "full", "x": 0, "y": 450}
]
```

| `type` | 크기 | 열 수 | 전원 레일 |
|---|---|---|---|
| `std` | 표준 50열 | 1~50 | 있음 |
| `full` | 830홀 | 1~63 | 있음 |
| `half` | 400홀 | 1~30 | 있음 |
| `mini` | 170홀 | 1~17 | **없음** |

- `id` 1번 보드가 꼭 있어야 해요. 여러 장이면 `y`를 450씩 늘려 아래로 놓으면 겹치지 않아요.
- `x`, `y`는 화면 위치(점 단위). 구멍 사이 간격이 20이에요.

### B-3. 구멍 이름

```
[보드번호:]줄열        예) a12   e3   tp10   2:f7   2:bn21
```

- 1번 보드는 앞에 아무것도 안 붙여요(`a12`). 2번 보드부터 `2:a12`처럼 붙여요.
- 줄(위에서 아래 순서):

| 줄 | 뜻 | 이어지는 방식 |
|---|---|---|
| `tn` | 위쪽 − 레일 (GND) | 가로로 한 줄 전체가 이어짐 |
| `tp` | 위쪽 + 레일 (5V) | 가로로 한 줄 전체가 이어짐 |
| `a` `b` `c` `d` `e` | 위쪽 반 | **같은 열**의 a~e 다섯 칸이 이어짐 |
| (가운데 홈) | | 위·아래 반은 서로 안 이어짐 |
| `f` `g` `h` `i` `j` | 아래쪽 반 | **같은 열**의 f~j 다섯 칸이 이어짐 |
| `bn` | 아래쪽 − 레일 (GND) | 가로로 이어짐 |
| `bp` | 아래쪽 + 레일 (5V) | 가로로 이어짐 |

- ⚠️ **레일에는 6의 배수 열(6, 12, 18, 24, 30, 36, 42, 48, 54, 60) 구멍이 없어요.** `tp12` 같은 이름을 쓰면 그 부품은 빠져요.
- 레일은 전원을 켜면 + 레일 5V, − 레일 0V가 자동으로 걸려요. 다른 전압을 쓰려면 파워 서플라이(B-5)를 놓고 전선으로 이으세요.
- **한 구멍에는 핀 하나만** 꽂을 수 있어요. 두 부품이 같은 구멍을 쓰면 뒤에 쓴 부품이 빠져요. 같은 열의 다른 구멍(a~e 중 빈 곳)을 쓰면 돼요.

### B-4. 부품 쓰는 법 (`comps`의 한 칸)

모든 부품에 `t`(종류)가 있어요. 대부분은 `pins`(구멍 이름 배열, 핀 순서대로)를 써요.

#### 전선 `wire`
```json
{"t": "wire", "pins": ["b3", "a10"], "color": "#2F6FDB"}
```
- `color`: 아무 색 코드. 자주 쓰는 색 — 빨강 `#D93A3A`(전원), 검정 `#24282D`(GND), 노랑 `#E8B820`, 주황 `#E57A1F`, 초록 `#2E9E5B`, 파랑 `#2F6FDB`, 보라 `#8B5CD6`, 흰색 `#E9ECEF`
- `pts`(선택): 꺾는 점 `[{"x":100,"y":60}, …]`. 빼면 CAD가 겹치지 않게 알아서 그려요.

#### 저항 `res`
```json
{"t": "res", "pins": ["j3", "bn3"], "ohms": 10000}
```
| 칸 | 값 |
|---|---|
| `ohms` | 1 ~ 10000000 (옴). E 계열 값(220, 330, 4700, 10000 …)을 권해요 |
| `pw` (선택) | 전력 `0.125` `0.25`(기본) `0.5` `1` `2` `5` (W) |
| `mat` (선택) | `carbon`(기본) `metal` `oxide` `wire` |
| `tol` (선택) | 오차 `0.1` `1` `2` `5` `10` (%) |

두 핀 사이는 2~6칸 정도가 보기 좋아요.

#### LED `led`
```json
{"t": "led", "pins": ["c20", "tn20"], "color": "red"}
```
- `pins`: `[애노드(+), 캐소드(−)]`
- `color`: `red` `green` `yellow` `blue` `orange` `white`
- 선택: `pk` 모양(`r5` `r3` `r8` `r10` `oval` `flat` `rect` `sq` …), `ln` 렌즈(`diff` `clear` `tint` `white`), `lk` 종류(`blink` 깜빡이, `bip` 양방향 등)
- 전류 제한 저항을 꼭 함께 넣으세요(없으면 경고가 떠요).

#### 2색 LED 3핀 `led3`
```json
{"t": "led3", "pins": ["c2", "c3", "c4"], "ca": false}
```
- `pins`: `[빨강, 공통, 초록]` — 한 줄에 나란히
- `ca`: `true` 면 공통 애노드, `false`(기본) 면 공통 캐소드

#### 커패시터 `cap`
```json
{"t": "cap", "pins": ["a16", "tn16"], "farad": 0.000047}
```
- `pins`: `[+극, −극]`, `farad`: 패럿 단위(47µF = `0.000047`, 100nF = `1e-7`)
- 선택: `dk` 종류 `c0g` `x7r` `alu`(전해) `alubp` `tant`(탄탈) `film` `x2` `edlc`(슈퍼커패시터), `vr` 내압(V)

#### 토글 스위치 `sw` · 푸시 버튼 `btn`
```json
{"t": "sw",  "pins": ["tp3", "a3"], "on": false}
{"t": "btn", "pins": ["tp9", "a9"]}
```

#### 클럭 발생기 `clk`
```json
{"t": "clk", "pins": ["j8"], "hz": 1}
```
- 핀 하나(출력). `hz`: `0.5` `1` `2` `4` `10`

#### 단독 게이트 `gate`
```json
{"t": "gate", "kind": "AND", "pins": ["e10", "e11", "e14"]}
{"t": "gate", "kind": "NOT", "pins": ["e34", "e38"]}
```
- `kind`: `AND` `OR` `NOT` `NAND` `NOR` `XOR` `XNOR`
- `pins`: `[A, B, Y]` 를 **같은 줄**의 `열`, `열+1`, `열+4` 에 (NOT은 `[A, Y]` 를 `열`, `열+4`)
- 전원 핀이 없어요(자동으로 동작).

#### IC `ic`
```json
{"t": "ic", "chip": "74LS08", "col": 10, "b": 1}
```
- `pins`를 쓰지 않고 `col`(1번 핀이 꽂히는 열)과 `b`(보드 번호, 기본 1)만 써요. 항상 가운데 홈을 걸쳐 꽂혀요.
- 핀이 `n`개면 자리는 이렇게 정해져요:
  - 1번 ~ n/2번 핀: `f{col}`, `f{col+1}`, … (아래 줄, 왼쪽→오른쪽)
  - n/2+1번 ~ n번 핀: 위 줄 `e` 를 오른쪽→왼쪽. 즉 **n번 핀은 `e{col}`**
  - 예) 14핀 `74LS08`, `col: 10` → 1번 `f10` … 7번(GND) `f16`, 8번 `e16` … 14번(VCC) `e10`
- IC는 **전원 핀을 직접 이어야** 동작해요. 예: VCC 열 `a10` ↔ `tp10`, GND 열 `j16` ↔ `bn16` 전선.
- `chip` 이름은 부록 표를 보세요. LED 막대·도트 매트릭스·여러 자리 표시기·드라이버(`LED-BAR10`, `SEG7-4D-CC`, `DRV-SER8` …)도 같은 `ic` 형식이에요.
- 마지막 열이 보드 열 수를 넘으면 빠져요(예: 20핀은 `col` + 9 ≤ 열 수).

#### 7세그먼트 표시기 `seg7`
```json
{"t": "seg7", "col": 35, "b": 1, "ca": false}
```
- IC와 같은 방식(10핀). 핀 순서: 1 `e`, 2 `d`, 3 `COM`, 4 `c`, 5 `dp`, 6 `b`, 7 `a`, 8 `COM`, 9 `f`, 10 `g`
- `ca`: `true` 공통 애노드, `false` 공통 캐소드

#### 수동 소자·스위치 `px` (가변저항, 저항 어레이, 여러 가지 스위치, 다이오드, 릴레이, 코일, 트랜지스터)
```json
{"t": "px", "kind": "pot16", "pins": ["c20", "c21", "c22"], "ohms": 10000, "taper": "B", "pos": 0.5}
```
- `kind`와 핀 자리는 아래 표대로 써요.
  - 핀 순서는 `pins`에 적는 순서(아래 줄 왼→오, 위 줄 오→왼)예요. DIP 스위치는 표준 번호라 1번 맞은편이 8번(8극은 16번), DPDT는 1-2-3 / 4-5-6이 같은 방향이라 4번이 1번 맞은편이에요.
  - **row** 형: 한 줄(보통 `c`)에서 `열 + 오프셋` 자리에 핀 순서대로
  - **dip** 형: IC처럼 홈을 걸쳐요. 앞쪽 절반 핀은 `f{열+오프셋}`(왼→오), 뒤쪽 절반은 `e` 줄을 오른→왼
- 추가 칸: 가변저항 `ohms`·`taper`(`A` 오디오 / `B` 선형 / `C` 역대수)·`pos`(0~1, 와이퍼 위치), 저항 어레이 `ohms`, 스위치 `s`(위치 번호), DIP 스위치 `bits`(`[0,1,…]`), 릴레이·솔레노이드 `cv`(코일 정격 전압 V), 인덕터 `henry`(인덕턴스, H 단위 — 100µH = `0.0001`)
- 릴레이는 코일 양 끝에 정격의 75% 이상 전압이 걸리면 붙고 10% 밑이면 떨어져요. 인덕터는 직류로 계산해서 1-2번이 전선처럼 이어져요

| kind | 이름 | 배치 | 오프셋 | 핀 순서 | 기본값 |
|---|---|---|---|---|---|
| `pot9` `pot16` `pot24` | 회전형 가변저항 9/16/24mm | row | 0,1,2 | 1(CCW) / 2(와이퍼) / 3(CW) | `ohms:10000, taper:"B", pos:0.5` |
| `pot16d` | 2련 가변저항 | dip | 0,1,2 | A1 A2 A3 B3 B2 B1 | `taper:"A"` |
| `pot16s` | 스위치 내장 가변저항 | row | 0,1,2,4,5 | 1 2 3 S1 S2 | `taper:"A"` |
| `trim6` `trim3362` `trim3296` | 트리머 | row | 0,1,2 | 1 / 2(와이퍼) / 3 | `taper:"B"` |
| `slide` | 슬라이드 가변저항 | row | 0,1,8 | 1 / 2(와이퍼) / 3 | `taper:"B"` |
| `sipb` | 저항 어레이 9핀 공통형 | row | 0~8 | 1(공통) 2…9 | `ohms:10000` |
| `sipi` | 저항 어레이 8핀 독립형 | row | 0~7 | 1…8 | `ohms:330` |
| `tact6` | 택트 6×6 (4핀) | dip | 0,2 | 1 2 3 4 | |
| `tact12` | 택트 12×12 (4핀) | dip | 0,3 | 1 2 3 4 | |
| `tactra` | 택트 직각형 (2핀) | row | 0,2 | 1 2 | |
| `slide1` | 슬라이드 SPDT | row | 0,1,2 | 1 / 2(공통) / 3 | `s:0` |
| `slide2` | 슬라이드 DPDT | dip | 0,1,2 | 1 2(공통) 3 6 5(공통) 4 | `s:0` |
| `tog1` | 토글 SPST | row | 0,2 | 1 2 | `s:0` |
| `tog2` | 토글 SPDT | row | 0,1,2 | 1 / 2(공통) / 3 | `s:0` |
| `tog3` | 토글 ON-OFF-ON | row | 0,1,2 | 1 / 2(공통) / 3 | `s:1` |
| `togm` | 토글 순간형 | row | 0,1,2 | 1 / 2(공통) / 3 | |
| `tog4` | 토글 DPDT | dip | 0,1,2 | 1 2(공통) 3 6 5(공통) 4 | `s:0` |
| `rock1` | 로커 SPST | row | 0,3 | 1 2 | `s:0` |
| `rock2` | 로커 램프 내장 | row | 0,2,4 | 1(입력) 2(출력) N(램프) | `s:0` |
| `push2` | 푸시 자기유지 DPDT | dip | 0,1,2 | 1 2(공통) 3 6 5(공통) 4 | `s:0` |
| `pushm` | 푸시 순간형 DPDT | dip | 0,1,2 | 1 2(공통) 3 6 5(공통) 4 | |
| `dip4` | DIP 스위치 4극 | dip | 0~3 | 1 2 3 4 5 6 7 8 | `bits:[0,0,0,0]` |
| `dip8` | DIP 스위치 8극 | dip | 0~7 | 1…16 | `bits:[0×8]` |
| `rbcd` | 로터리 DIP (0~9) | dip | 0,1,2 | 1 C 4 8 C2 2 | `s:0` |
| `rhex` | 로터리 DIP (0~15) | dip | 0,1,2 | 1 C 4 8 C2 2 | `s:0` |
| `enc` | 로터리 인코더 | dip | 0,1,2 | A C B S2 NC S1 | `s:0` |
| `sel1` | 셀렉터 1극 12단 | dip | 0~6 | COM1 A1…A12 NC | `s:0` |
| `sel2` | 셀렉터 2극 6단 | dip | 0~6 | COM1 COM2 A1…A6 B1…B6 | `s:0` |
| `sel3` | 셀렉터 3극 4단 | dip | 0~7 | COM1 COM2 COM3 A1…A4 B1…B4 C1…C4 NC | `s:0` |
| `sel4` | 셀렉터 4극 3단 | dip | 0~7 | COM1…COM4 A1…A3 B1…B3 C1…C3 D1…D3 | `s:0` |
| `d4148` | 1N4148 신호용 다이오드 | row | 0,3 | A(애노드) K(캐소드) | |
| `d4007` | 1N4007 정류 다이오드 | row | 0,4 | A K | |
| `d5819` | 1N5819 쇼트키 다이오드 | row | 0,4 | A K | |
| `duf` | UF4007 초고속 정류 다이오드 | row | 0,4 | A K | |
| `dbat` | BAT85급 소신호 쇼트키 | row | 0,3 | A K | |
| `dz51` | 1N4733A 제너 5.1V | row | 0,4 | A K | |
| `dge` | 1N34A 게르마늄 다이오드 | row | 0,3 | A K | |
| `brdg` | 브리지 정류기 4핀 | dip | 0,2 | +(출력) ~(교류1) −(출력) ~(교류2) | |
| `rlyc` | 파워 릴레이 SPDT (큐브형) | row | 0,2,4,6,8 | A1 A2(코일) COM NC NO | `cv:5` (5·12·24) |
| `rlyd` | 신호 릴레이 DPDT (DIP 8핀) | dip | 0~3 | A1(코일) COM1 NC1 NO1 NO2 NC2 COM2 A2(코일) | `cv:5` (5·12) |
| `reed` | 리드 릴레이 SPST-NO | row | 0,1,2,3 | A1(코일) COM NO A2(코일) | `cv:5` (5·12) |
| `rlyl` | 래칭 릴레이 SPDT (코일 1개) | row | 0,2,4,6,8 | +(코일) −(코일) COM NC NO | `cv:5, s:0` (s 1 = SET) |
| `ssr` | 반도체 릴레이 SSR | row | 0,2,5,8 | +(입력) −(입력) 출력1 출력2 | |
| `sol` | 푸시-풀 솔레노이드 | row | 0,4 | 1 2 | `cv:5` (5·12·24) |
| `inda` | 축형 인덕터 (색띠) | row | 0,4 | 1 2 | `henry:0.0001` |
| `indr` | 레이디얼 인덕터 (드럼 코어) | row | 0,2 | 1 2 | `henry:0.0001` |
| `indt` | 토로이드 코일 | row | 0,3 | 1 2 | `henry:0.001` |
| `bead` | 페라이트 비드 | row | 0,3 | 1 2 | |
| `indair` | 공심 코일(직접 감기) | row | 0,3 | 1 2 | `turns:20, dmm:10` (감은 수, 지름 mm → henry 자동) |
| `q3904` | 2N3904 NPN 소신호 (TO-92) | row | 0,1,2 | E B C | |
| `q3906` | 2N3906 PNP 소신호 (TO-92) | row | 0,1,2 | E B C | |
| `q2222` | 2N2222A급 NPN 범용 600mA (TO-92) | row | 0,1,2 | E B C | |
| `qbc547` | BC547 NPN 소신호 (TO-92) | row | 0,1,2 | C B E | |
| `qbc557` | BC557 PNP 소신호 (TO-92) | row | 0,1,2 | C B E | |
| `qtip` | TIP120급 NPN 달링턴 (TO-220) | row | 0,1,2 | B C E | |
| `m7000` | 2N7000 N채널 MOSFET (TO-92) | row | 0,1,2 | S G D | |
| `mnpow` | 로직 레벨 N채널 파워 MOSFET (TO-220) | row | 0,1,2 | G D S | |
| `mppow` | 로직 레벨 P채널 파워 MOSFET (TO-220) | row | 0,1,2 | G D S | |

예) `dip4`를 `열 20`에: `["f20","f21","f22","f23","e23","e22","e21","e20"]`

### B-5. 계측기·건전지 (보드 밖에 놓는 것)

```json
{"t": "psu", "k": 1, "x": 20,  "y": 440, "v": 5, "on": true},
{"t": "wire", "pins": ["@1:0", "bp3"], "color": "#D93A3A"},
{"t": "wire", "pins": ["@1:1", "bn3"], "color": "#24282D"}
```

| `t` | 이름 | 추가 칸 | 단자 0 | 단자 1 |
|---|---|---|---|---|
| `psu` | 파워 서플라이 | `v`(3.3 5 9 12 24 48 100), `on` | + | − |
| `bat` | 건전지 | `v`(1.5 3 4.5 6 9) | + | − |
| `fg` | 함수 발생기 | `wave`(`sq` `sin` `tri` `saw`), `hz`, `vpp`, `off`, `duty`(%) | OUT | GND |
| `osc` | 오실로스코프 | `tdiv`, `vdiv`, `vdiv2`, `run` | CH1 | CH2 |

- `x`, `y`: 몸통 위치. 보드 아래(`y`: 440 이상)에 두면 겹치지 않아요. 크기는 psu 170×92, bat 130×74, fg 180×92, osc 250×200.
- `k`: 계측기마다 다른 번호(1, 2, 3 …). 단자 구멍 이름은 **`@k:번호`** 예요(`@1:0` = 1번 계측기의 + 단자).
- 5V가 아닌 전압은 자동 5V 레일과 섞이지 않게 **레일 말고 보드 줄(a~j)** 로 이어 쓰세요.
- 단자에는 전선을 여러 가닥 이어도 돼요. 단자는 **전선으로만** 보드와 이어요.

### B-6. 전체 예시 — 스위치 2개 + 74LS08 + LED

```json
{
  "app": "breadboard-lab",
  "v": 2,
  "name": "AND 시험",
  "boards": [{"id": 1, "type": "std", "x": 0, "y": 0}],
  "comps": [
    {"t": "sw",   "pins": ["tp3", "a3"], "on": true},
    {"t": "res",  "pins": ["j3", "bn3"], "ohms": 10000},
    {"t": "wire", "pins": ["e3", "f3"], "color": "#E8B820"},
    {"t": "sw",   "pins": ["tp5", "a5"], "on": true},
    {"t": "res",  "pins": ["j5", "bn5"], "ohms": 10000},
    {"t": "wire", "pins": ["e5", "f5"], "color": "#E57A1F"},

    {"t": "ic",   "chip": "74LS08", "col": 10, "b": 1},
    {"t": "wire", "pins": ["a10", "tp10"], "color": "#D93A3A"},
    {"t": "wire", "pins": ["j16", "bn16"], "color": "#24282D"},

    {"t": "wire", "pins": ["h3", "j10"], "color": "#E8B820"},
    {"t": "wire", "pins": ["h5", "j11"], "color": "#E57A1F"},

    {"t": "res",  "pins": ["h12", "h20"], "ohms": 330},
    {"t": "led",  "pins": ["j20", "bn20"], "color": "green"}
  ]
}
```

- 스위치 → 위쪽 a3/a5 열 → 전선으로 아래쪽 f3/f5 열 → 10kΩ 풀다운으로 GND
- 입력 신호는 IC 1번(`f10` 열)·2번(`f11` 열)으로, 출력 3번 핀(`f12` 열) → 330Ω → LED → GND

### B-7. 불러올 때 빠지는 경우 (점검표)

불러오기는 문제 있는 부품을 **조용히 빼고** 나머지만 꽂아요. 부품 수가 모자라면 아래를 보세요.

- [ ] `t`가 위 표에 없는 값이다 (`wire` `res` `led` `led3` `cap` `sw` `btn` `clk` `gate` `ic` `seg7` `px` `psu` `bat` `fg` `osc`)
- [ ] `ic`의 `chip`이 부록 표에 없다 / `gate`의 `kind`가 7가지가 아니다 / `px`의 `kind`가 표에 없다
- [ ] 구멍 이름이 없다 — 레일 6의 배수 열, 보드 열 수를 넘음, `mini` 보드의 레일, 없는 보드 번호
- [ ] 두 부품이 같은 구멍을 쓴다 (전선도 부품이에요)
- [ ] 계측기에 `x`, `y`가 없다
- [ ] `pins` 개수가 핀 수와 다르다 (2단자 = 2개, clk = 1개, led3 = 3개, gate = 3개(NOT 2개))

---

## C. AI에게 시킬 때 쓰는 말 (복사해서 쓰세요)

CAD 도구 막대의 **[AI 회로]** 를 누르면 이 과정을 도와줘요(CAD가 AI를 직접 부르지는 않아요).

1. 회로 설명을 쓰고 **[AI용 부탁 문장 복사]** → 아래 부탁 문장과 이 안내서가 함께 복사돼요. 쓰는 AI에 붙여 넣으세요.
   (또는 **[안내서 내려받기 (.md)]** 로 받은 파일을 AI에 첨부하고 아래 부탁 문장을 쓰세요.)
2. AI가 준 답을 **목록 칸에 그대로 붙여 넣거나**, 파일(.json .md .txt)로 올리세요. 설명 글이나 코드 블록(따옴표 세 개 ``` 로 감싼 부분)이 섞여 있어도 회로 부분만 찾아 읽어요.
3. **[보드에 배치하기]** — A 형식은 자동 배치, B 형식은 쓴 자리 그대로 꽂혀요.

```text
첨부한 "브레드보드 CAD 파일 만들기 안내서"를 따라
[여기에 회로 설명: 예) 74LS90으로 0~9를 세어 7세그먼트에 보여 주는 회로]
파일을 만들어 줘.
- A-4 JSON 형식(parts/nets)으로 만들어 줘. (보드 배치까지 원하면 "B 형식으로")
- 부품 종류와 IC 이름은 안내서 표에 있는 것만 써 줘.
- 입력은 스위치+10k 풀다운, 출력은 LED+330Ω으로 바꿔 줘(A-5 규칙).
- 결과는 JSON 하나만, 다른 글 없이.
```

B 형식으로 만들게 할 때는 이것도 덧붙이세요.

```text
- 한 구멍에 핀 하나만. 레일은 6의 배수 열이 없어.
- IC는 col 방식(B-4)으로 놓고 VCC·GND 핀을 레일에 전선으로 이어 줘.
- 만든 뒤 B-7 점검표로 스스로 확인해 줘.
```

---

## 부록. IC 이름과 핀 순서

`이름 | 1번 핀부터 순서대로의 핀 이름`. `~`가 붙은 핀은 Low일 때 동작해요. A 형식에서는 번호 대신 이 이름을 써도 돼요.
(표시 소자·드라이버는 이 CAD가 자체로 정한 핀 배치예요.)

| 이름 | 핀 | 핀 순서 (1 → n) |
|---|---|---|
| `74HC00` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74HC02` | 14 | 1Y 1A 1B 2Y 2A 2B GND 3A 3B 3Y 4A 4B 4Y VCC |
| `74HC04` | 14 | 1A 1Y 2A 2Y 3A 3Y GND 4Y 4A 5Y 5A 6Y 6A VCC |
| `74HC08` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74HC32` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74HC86` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74HC74` | 14 | ~1CLR 1D 1CLK ~1PRE 1Q ~1Q GND ~2Q 2Q ~2PRE 2CLK 2D ~2CLR VCC |
| `74HC161` | 16 | ~CLR CLK A B C D ENP GND ~LOAD ENT QD QC QB QA RCO VCC |
| `74HC138` | 16 | A B C ~G2A ~G2B G1 ~Y7 GND ~Y6 ~Y5 ~Y4 ~Y3 ~Y2 ~Y1 ~Y0 VCC |
| `74HC283` | 16 | S2 B2 A2 S1 A1 B1 C0 GND C4 S4 B4 A4 S3 A3 B3 VCC |
| `CD4511` | 16 | B C ~LT ~BI LE D A VSS e d c b a g f VDD |
| `74LS47` | 16 | B C ~LT ~BI ~RBI D A GND ~e ~d ~c ~b ~a ~g ~f VCC |
| `74LS46` | 16 | B C ~LT ~BI ~RBI D A GND ~e ~d ~c ~b ~a ~g ~f VCC |
| `74LS00` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74LS02` | 14 | 1Y 1A 1B 2Y 2A 2B GND 3A 3B 3Y 4A 4B 4Y VCC |
| `74LS04` | 14 | 1A 1Y 2A 2Y 3A 3Y GND 4Y 4A 5Y 5A 6Y 6A VCC |
| `74LS08` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74LS32` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74LS86` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74LS74` | 14 | ~1CLR 1D 1CLK ~1PRE 1Q ~1Q GND ~2Q 2Q ~2PRE 2CLK 2D ~2CLR VCC |
| `74LS138` | 16 | A B C ~G2A ~G2B G1 ~Y7 GND ~Y6 ~Y5 ~Y4 ~Y3 ~Y2 ~Y1 ~Y0 VCC |
| `74LS161` | 16 | ~CLR CLK A B C D ENP GND ~LOAD ENT QD QC QB QA RCO VCC |
| `74LS283` | 16 | S2 B2 A2 S1 A1 B1 C0 GND C4 S4 B4 A4 S3 A3 B3 VCC |
| `74LS14` | 14 | 1A 1Y 2A 2Y 3A 3Y GND 4Y 4A 5Y 5A 6Y 6A VCC |
| `74LS10` | 14 | 1A 1B 2A 2B 2C 2Y GND 3Y 3A 3B 3C 1Y 1C VCC |
| `74LS11` | 14 | 1A 1B 2A 2B 2C 2Y GND 3Y 3A 3B 3C 1Y 1C VCC |
| `74LS27` | 14 | 1A 1B 2A 2B 2C 2Y GND 3Y 3A 3B 3C 1Y 1C VCC |
| `74LS20` | 14 | 1A 1B NC 1C 1D 1Y GND 2Y 2A 2B NC 2C 2D VCC |
| `74LS21` | 14 | 1A 1B NC 1C 1D 1Y GND 2Y 2A 2B NC 2C 2D VCC |
| `74LS30` | 14 | A B C D E F GND Y NC NC G H NC VCC |
| `74LS125` | 14 | ~1C 1A 1Y ~2C 2A 2Y GND 3Y 3A ~3C 4Y 4A ~4C VCC |
| `74LS75` | 16 | ~1Q 1D 2D C34 VCC 3D 4D ~4Q 4Q 3Q ~3Q GND C12 ~2Q 2Q 1Q |
| `74LS112` | 16 | 1CLK 1K 1J ~1PRE 1Q ~1Q ~2Q GND 2Q ~2PRE 2J 2K 2CLK ~2CLR ~1CLR VCC |
| `74LS76` | 16 | 1CLK ~1PRE ~1CLR 1J VCC 2CLK ~2PRE ~2CLR 2J ~2Q 2Q 2K GND ~1Q 1Q 1K |
| `74LS164` | 14 | A B QA QB QC QD GND CLK ~CLR QE QF QG QH VCC |
| `74LS175` | 16 | ~CLR 1Q ~1Q 1D 2D ~2Q 2Q GND CLK 3Q ~3Q 3D 4D ~4Q 4Q VCC |
| `74LS90` | 14 | CKB R01 R02 NC VCC R91 R92 QC QB GND QD QA NC CKA |
| `74LS93` | 14 | CKB R01 R02 NC VCC NC NC QC QB GND QD QA NC CKA |
| `74LS192` | 16 | B QB QA DOWN UP QC QD GND D C ~LOAD ~CO ~BO CLR A VCC |
| `74LS193` | 16 | B QB QA DOWN UP QC QD GND D C ~LOAD ~CO ~BO CLR A VCC |
| `74LS139` | 16 | ~1G 1A 1B ~1Y0 ~1Y1 ~1Y2 ~1Y3 GND ~2Y3 ~2Y2 ~2Y1 ~2Y0 2B 2A ~2G VCC |
| `74LS151` | 16 | D3 D2 D1 D0 Y W ~G GND C B A D7 D6 D5 D4 VCC |
| `74LS153` | 16 | ~1G B 1C3 1C2 1C1 1C0 1Y GND 2Y 2C0 2C1 2C2 2C3 A ~2G VCC |
| `74LS157` | 16 | S 1A 1B 1Y 2A 2B 2Y GND 3Y 3B 3A 4Y 4B 4A ~G VCC |
| `74LS85` | 16 | B3 A<Bi A=Bi A>Bi A>B A=B A<B GND B0 A0 B1 A1 A2 B2 A3 VCC |
| `74LS48` | 16 | B C ~LT ~BI ~RBI D A GND e d c b a g f VCC |
| `NE555` | 8 | GND TRIG OUT ~RESET CTRL THRES DISCH VCC |
| `74LS03` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74LS05` | 14 | 1A 1Y 2A 2Y 3A 3Y GND 4Y 4A 5Y 5A 6Y 6A VCC |
| `74LS07` | 14 | 1A 1Y 2A 2Y 3A 3Y GND 4Y 4A 5Y 5A 6Y 6A VCC |
| `74LS09` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74LS132` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74HC132` | 14 | 1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC |
| `74HC10` | 14 | 1A 1B 2A 2B 2C 2Y GND 3Y 3A 3B 3C 1Y 1C VCC |
| `74HC11` | 14 | 1A 1B 2A 2B 2C 2Y GND 3Y 3A 3B 3C 1Y 1C VCC |
| `74HC20` | 14 | 1A 1B NC 1C 1D 1Y GND 2Y 2A 2B NC 2C 2D VCC |
| `74HC21` | 14 | 1A 1B NC 1C 1D 1Y GND 2Y 2A 2B NC 2C 2D VCC |
| `74HC27` | 14 | 1A 1B 2A 2B 2C 2Y GND 3Y 3A 3B 3C 1Y 1C VCC |
| `74HC30` | 14 | A B C D E F GND Y NC NC G H NC VCC |
| `74HC14` | 14 | 1A 1Y 2A 2Y 3A 3Y GND 4Y 4A 5Y 5A 6Y 6A VCC |
| `74HC125` | 14 | ~1C 1A 1Y ~2C 2A 2Y GND 3Y 3A ~3C 4Y 4A ~4C VCC |
| `74HC112` | 16 | 1CLK 1K 1J ~1PRE 1Q ~1Q ~2Q GND 2Q ~2PRE 2J 2K 2CLK ~2CLR ~1CLR VCC |
| `74HC164` | 14 | A B QA QB QC QD GND CLK ~CLR QE QF QG QH VCC |
| `74HC175` | 16 | ~CLR 1Q ~1Q 1D 2D ~2Q 2Q GND CLK 3Q ~3Q 3D 4D ~4Q 4Q VCC |
| `74HC139` | 16 | ~1G 1A 1B ~1Y0 ~1Y1 ~1Y2 ~1Y3 GND ~2Y3 ~2Y2 ~2Y1 ~2Y0 2B 2A ~2G VCC |
| `74HC151` | 16 | D3 D2 D1 D0 Y W ~G GND C B A D7 D6 D5 D4 VCC |
| `74HC153` | 16 | ~1G B 1C3 1C2 1C1 1C0 1Y GND 2Y 2C0 2C1 2C2 2C3 A ~2G VCC |
| `74HC157` | 16 | S 1A 1B 1Y 2A 2B 2Y GND 3Y 3B 3A 4Y 4B 4A ~G VCC |
| `74HC85` | 16 | B3 A<Bi A=Bi A>Bi A>B A=B A<B GND B0 A0 B1 A1 A2 B2 A3 VCC |
| `74HC192` | 16 | B QB QA DOWN UP QC QD GND D C ~LOAD ~CO ~BO CLR A VCC |
| `74HC193` | 16 | B QB QA DOWN UP QC QD GND D C ~LOAD ~CO ~BO CLR A VCC |
| `74LS126` | 14 | 1C 1A 1Y 2C 2A 2Y GND 3Y 3A 3C 4Y 4A 4C VCC |
| `74HC126` | 14 | 1C 1A 1Y 2C 2A 2Y GND 3Y 3A 3C 4Y 4A 4C VCC |
| `74LS73` | 14 | 1CLK ~1CLR 1K VCC 2CLK ~2CLR 2J ~2Q 2Q 2K GND 1Q ~1Q 1J |
| `74HC73` | 14 | 1CLK ~1CLR 1K VCC 2CLK ~2CLR 2J ~2Q 2Q 2K GND 1Q ~1Q 1J |
| `74LS109` | 16 | ~1CLR 1J ~1K 1CLK ~1PRE 1Q ~1Q GND ~2Q 2Q ~2PRE 2CLK ~2K 2J ~2CLR VCC |
| `74HC109` | 16 | ~1CLR 1J ~1K 1CLK ~1PRE 1Q ~1Q GND ~2Q 2Q ~2PRE 2CLK ~2K 2J ~2CLR VCC |
| `74LS273` | 20 | ~CLR 1Q 1D 2D 2Q 3Q 3D 4D 4Q GND CLK 5Q 5D 6D 6Q 7Q 7D 8D 8Q VCC |
| `74HC273` | 20 | ~CLR 1Q 1D 2D 2Q 3Q 3D 4D 4Q GND CLK 5Q 5D 6D 6Q 7Q 7D 8D 8Q VCC |
| `74LS373` | 20 | ~OE 1Q 1D 2D 2Q 3Q 3D 4D 4Q GND LE 5Q 5D 6D 6Q 7Q 7D 8D 8Q VCC |
| `74HC373` | 20 | ~OE 1Q 1D 2D 2Q 3Q 3D 4D 4Q GND LE 5Q 5D 6D 6Q 7Q 7D 8D 8Q VCC |
| `74LS374` | 20 | ~OE 1Q 1D 2D 2Q 3Q 3D 4D 4Q GND CLK 5Q 5D 6D 6Q 7Q 7D 8D 8Q VCC |
| `74HC374` | 20 | ~OE 1Q 1D 2D 2Q 3Q 3D 4D 4Q GND CLK 5Q 5D 6D 6Q 7Q 7D 8D 8Q VCC |
| `74HC595` | 16 | QB QC QD QE QF QG QH GND QH' ~SRCLR SRCLK RCLK ~OE SER QA VCC |
| `74LS595` | 16 | QB QC QD QE QF QG QH GND QH' ~SRCLR SRCLK RCLK ~OE SER QA VCC |
| `74LS165` | 16 | SH/~LD CLK E F G H ~QH GND QH SER A B C D INH VCC |
| `74HC165` | 16 | SH/~LD CLK E F G H ~QH GND QH SER A B C D INH VCC |
| `74LS194` | 16 | ~CLR SR A B C D SL GND S0 S1 CLK QD QC QB QA VCC |
| `74HC194` | 16 | ~CLR SR A B C D SL GND S0 S1 CLK QD QC QB QA VCC |
| `74HC163` | 16 | ~CLR CLK A B C D ENP GND ~LOAD ENT QD QC QB QA RCO VCC |
| `74LS163` | 16 | ~CLR CLK A B C D ENP GND ~LOAD ENT QD QC QB QA RCO VCC |
| `74LS393` | 14 | 1A 1CLR 1QA 1QB 1QC 1QD GND 2QD 2QC 2QB 2QA 2CLR 2A VCC |
| `74HC393` | 14 | 1A 1CLR 1QA 1QB 1QC 1QD GND 2QD 2QC 2QB 2QA 2CLR 2A VCC |
| `74LS42` | 16 | ~0 ~1 ~2 ~3 ~4 ~5 ~6 GND ~7 ~8 ~9 D C B A VCC |
| `74HC42` | 16 | ~0 ~1 ~2 ~3 ~4 ~5 ~6 GND ~7 ~8 ~9 D C B A VCC |
| `74LS148` | 16 | ~4 ~5 ~6 ~7 ~EI ~A2 ~A1 GND ~A0 ~0 ~1 ~2 ~3 ~GS ~EO VCC |
| `74HC148` | 16 | ~4 ~5 ~6 ~7 ~EI ~A2 ~A1 GND ~A0 ~0 ~1 ~2 ~3 ~GS ~EO VCC |
| `74LS158` | 16 | S 1A 1B 1Y 2A 2B 2Y GND 3Y 3B 3A 4Y 4B 4A ~G VCC |
| `74HC158` | 16 | S 1A 1B 1Y 2A 2B 2Y GND 3Y 3B 3A 4Y 4B 4A ~G VCC |
| `74LS83` | 16 | A4 S3 A3 B3 VCC S2 B2 A2 S1 A1 B1 GND C0 C4 S4 B4 |
| `74LS688` | 20 | ~G P0 Q0 P1 Q1 P2 Q2 P3 Q3 GND P4 Q4 P5 Q5 P6 Q6 P7 Q7 ~P=Q VCC |
| `74HC688` | 20 | ~G P0 Q0 P1 Q1 P2 Q2 P3 Q3 GND P4 Q4 P5 Q5 P6 Q6 P7 Q7 ~P=Q VCC |
| `74LS244` | 20 | ~1G 1A1 2Y4 1A2 2Y3 1A3 2Y2 1A4 2Y1 GND 2A1 1Y4 2A2 1Y3 2A3 1Y2 2A4 1Y1 ~2G VCC |
| `74HC244` | 20 | ~1G 1A1 2Y4 1A2 2Y3 1A3 2Y2 1A4 2Y1 GND 2A1 1Y4 2A2 1Y3 2A3 1Y2 2A4 1Y1 ~2G VCC |
| `74LS240` | 20 | ~1G 1A1 2Y4 1A2 2Y3 1A3 2Y2 1A4 2Y1 GND 2A1 1Y4 2A2 1Y3 2A3 1Y2 2A4 1Y1 ~2G VCC |
| `74HC240` | 20 | ~1G 1A1 2Y4 1A2 2Y3 1A3 2Y2 1A4 2Y1 GND 2A1 1Y4 2A2 1Y3 2A3 1Y2 2A4 1Y1 ~2G VCC |
| `LED-BAR10` | 20 | A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 K10 K9 K8 K7 K6 K5 K4 K3 K2 K1 |
| `LED-8X8` | 16 | R1 R2 R3 R4 R5 R6 R7 R8 C8 C7 C6 C5 C4 C3 C2 C1 |
| `LED-RGB-CC` | 4 | R G B K |
| `LED-RGB-CA` | 4 | R G B A |
| `HEX-DISP` | 8 | D1 D2 D4 GND D8 BL ~LE VCC |
| `LED-2C3-CC` | 4 | R K G NC |
| `LED-2C3-CA` | 4 | R A G NC |
| `LED-SFLUX` | 4 | A1 K1 K2 A2 |
| `LED-SMART` | 4 | DIN VDD GND DOUT |
| `CBI-V2` | 4 | A1 A2 K2 K1 |
| `CBI-V3` | 6 | A1 A2 A3 K3 K2 K1 |
| `CBI-V4` | 8 | A1 A2 A3 A4 K4 K3 K2 K1 |
| `CBI-H2` | 4 | A1 A2 K2 K1 |
| `CBI-H3` | 6 | A1 A2 A3 K3 K2 K1 |
| `CBI-H4` | 8 | A1 A2 A3 A4 K4 K3 K2 K1 |
| `CBI-2C` | 4 | R K G NC |
| `CBI-RGB` | 4 | R G B K |
| `SEG7-2D-CC` | 10 | a b c d e f g dp D1 D2 |
| `SEG7-4D-CC` | 12 | a b c d e f g dp D1 D2 D3 D4 |
| `SEG7-4D-CA` | 12 | a b c d e f g dp D1 D2 D3 D4 |
| `SEG7-4D-CLK` | 14 | a b c d e f g dp D1 D2 D3 D4 L+ L- |
| `SEG7-BUBBLE` | 12 | a b c d e f g dp D1 D2 D3 D4 |
| `SEG7-BIG-CA` | 10 | e d A1 c dp b a A2 f g |
| `SEG-PM1` | 6 | A M P ONE DP NC |
| `SEG9-CC` | 12 | a b c d e f g h i dp COM NC |
| `SEG14-CC` | 16 | a b c d e f g1 g2 h i j k l m dp COM |
| `SEG16-CC` | 18 | a1 a2 b c d1 d2 e f g1 g2 h i j k l m dp COM |
| `MAT57-CA` | 12 | C1 C2 C3 C4 C5 R7 R6 R5 R4 R3 R2 R1 |
| `MAT57-CC` | 12 | C1 C2 C3 C4 C5 R7 R6 R5 R4 R3 R2 R1 |
| `MAT58-CA` | 14 | C1 C2 C3 C4 C5 R8 NC R7 R6 R5 R4 R3 R2 R1 |
| `MAT58-CC` | 14 | C1 C2 C3 C4 C5 R8 NC R7 R6 R5 R4 R3 R2 R1 |
| `MAT88-CA` | 16 | C1 C2 C3 C4 C5 C6 C7 C8 R8 R7 R6 R5 R4 R3 R2 R1 |
| `MAT88-2C` | 24 | RC1 RC2 RC3 RC4 RC5 RC6 RC7 RC8 W1 W2 W3 W4 W5 W6 W7 W8 GC8 GC7 GC6 GC5 GC4 GC3 GC2 GC1 |
| `MAT88-RGB` | 32 | RC1 RC2 RC3 RC4 RC5 RC6 RC7 RC8 GC1 GC2 GC3 GC4 GC5 GC6 GC7 GC8 BC1 BC2 BC3 BC4 BC5 BC6 BC7 BC8 W1 W2 W3 W4 W5 W6 W7 W8 |
| `MAT88-SMART` | 4 | DIN VDD GND DOUT |
| `BAR10-Y` | 20 | A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 K10 K9 K8 K7 K6 K5 K4 K3 K2 K1 |
| `BAR10-G` | 20 | A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 K10 K9 K8 K7 K6 K5 K4 K3 K2 K1 |
| `BAR10-GYR` | 20 | A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 K10 K9 K8 K7 K6 K5 K4 K3 K2 K1 |
| `BAR10-SYM` | 20 | A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 K10 K9 K8 K7 K6 K5 K4 K3 K2 K1 |
| `BAR10-LOW` | 20 | A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 K10 K9 K8 K7 K6 K5 K4 K3 K2 K1 |
| `BAR5` | 10 | A1 A2 A3 A4 A5 K5 K4 K3 K2 K1 |
| `BAR12-3C` | 24 | A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 A11 A12 K12 K11 K10 K9 K8 K7 K6 K5 K4 K3 K2 K1 |
| `BAR20` | 40 | A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 A11 A12 A13 A14 A15 A16 A17 A18 A19 A20 K20 K19 K18 K17 K16 K15 K14 K13 K12 K11 K10 K9 K8 K7 K6 K5 K4 K3 K2 K1 |
| `BAR10-2C` | 30 | AR1 AR2 AR3 AR4 AR5 AR6 AR7 AR8 AR9 AR10 AG1 AG2 AG3 AG4 AG5 AG6 AG7 AG8 AG9 AG10 K10 K9 K8 K7 K6 K5 K4 K3 K2 K1 |
| `LBAR-W` | 4 | A1 A2 K2 K1 |
| `LBAR-N` | 4 | A1 A2 K2 K1 |
| `LBAR-4` | 8 | A1 A2 A3 A4 K4 K3 K2 K1 |
| `RING16` | 18 | A1 A2 A3 A4 A5 A6 A7 A8 A9 A10 A11 A12 A13 A14 A15 A16 K NC |
| `ASC4-16` | 12 | D0 D1 D2 D3 D4 D5 D6 A0 A1 ~WR GND VCC |
| `DOT4-SER` | 10 | DATA CLK COL1 COL2 GND COL3 COL4 COL5 DOUT VCC |
| `ASC8-BUS` | 18 | D0 D1 D2 D3 D4 D5 D6 D7 A0 A1 A2 A3 ~WR ~CE ~RST NC GND VCC |
| `DRV-SER8` | 24 | DIN CLK LOAD DOUT DIG0 DIG1 DIG2 DIG3 DIG4 DIG5 DIG6 DIG7 SEGA SEGB SEGC SEGD SEGE SEGF SEGG SEGDP ISET NC GND VCC |
| `DRV-2W6` | 20 | K1 K2 SG1 SG2 SG3 SG4 SG5 SG6 SG7 SG8 GR6 GR5 GR4 GR3 GR2 GR1 VDD DIO CLK GND |
| `DRV-3W8` | 28 | STB CLK DIO K1 K2 K3 SG1 SG2 SG3 SG4 SG5 SG6 SG7 SG8 SG9 SG10 GR1 GR2 GR3 GR4 GR5 GR6 GR7 GR8 VDD GND NC1 NC2 |
| `DRV-I2C` | 32 | SDA SCL A0 A1 A2 INT VDD GND ROW0 ROW1 ROW2 ROW3 ROW4 ROW5 ROW6 ROW7 ROW8 ROW9 ROW10 ROW11 ROW12 ROW13 ROW14 ROW15 COM0 COM1 COM2 COM3 COM4 COM5 COM6 COM7 |
| `DRV-SINK8` | 18 | IN1 IN2 IN3 IN4 IN5 IN6 IN7 IN8 GND COM OUT8 OUT7 OUT6 OUT5 OUT4 OUT3 OUT2 OUT1 |
| `DRV-SRC8` | 18 | IN1 IN2 IN3 IN4 IN5 IN6 IN7 IN8 VS GND OUT8 OUT7 OUT6 OUT5 OUT4 OUT3 OUT2 OUT1 |
| `DRV-PSR8` | 20 | SER SRCK RCK ~SRCLR ~G D0 D1 D2 D3 GND D4 D5 D6 D7 SEROUT NC1 NC2 NC3 NC4 VCC |
| `DRV-14SEG` | 30 | D0 D1 D2 D3 D4 D5 D6 DPI ~LE BL NC1 NC2 NC3 DP GND m l k j i h g2 g1 f e d c b a VCC |
| `DRV-16SEG` | 34 | D0 D1 D2 D3 D4 D5 D6 DPI ~LE BL NC1 NC2 NC3 NC4 NC5 DP GND m l k j i h g2 g1 f e d2 d1 c b a2 a1 VCC |

---

이 안내서는 브레드보드 CAD의 일부로 직접 작성한 문서예요. © 2026 co2maker-cyber. All rights reserved.
부품 번호·핀 이름은 호환성 안내를 위한 기술적 표기이며 각 제조사의 상표권을 침해할 의도가 없어요. 회로를 만들기 위해 이 안내서를 AI에 함께 넣어 쓰는 것은 괜찮아요.
