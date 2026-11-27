#!/usr/bin/env node
/* verify-parts.js — 논리 IC(verify74.js가 맡음)를 뺀 모든 부품이 실제 부품처럼 동작하는지 확인한다.
 *
 *   node breadboard/tests/verify-parts.js [-v]
 *
 * ① 기본 부품: 브레드보드에 실제로 꽂아서(전선·스위치·저항·레일) 시뮬레이션 결과를 본다
 * ② 수동 소자(가변저항·저항 어레이·스위치): 위치마다 이어지는 핀·저항 값을 실제 부품 표와 비교
 * ③ LED 표시기: 칸마다 애노드/캐소드 핀, 극성, 칸 순서·위치, 색을 실제 배선 규칙과 비교
 * ④ 칩이 든 표시기·드라이버: 실제 칩처럼 신호를 넣고(시프트·래치·직렬 명령) 결과를 비교
 * 기대값은 이 파일 안에서 따로 적은 것(부품 정의를 그대로 베끼지 않음).
 * 종료 코드: 0 모두 통과, 1 하나라도 불일치.
 */
const { chromium } = require('playwright');
const path = require('path');
const VERBOSE = process.argv.includes('-v');
const FILE = path.join(__dirname, '..', 'index.html');

function inPage() {
  const R = [];   // {grp, part, ok, msg}
  const rec = (grp, part, ok, msg) => R.push({ grp, part, ok: !!ok, msg: msg || '' });
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  const step = (dt, n) => { for (let i = 0; i < n; i++) { simBase += dt; settle(); } };
  const lvH = id => { const h = HOLES.get(id); return SIM.lvl.get(SIM.netOf[h.i]); };
  const vH = id => { const h = HOLES.get(id); return SIM.vOf ? SIM.vOf(SIM.netOf[h.i]) : null; };
  const BOARD = [{ id: 1, type: 'full', x: 0, y: 0 }];
  const build = comps => { S.power = true; loadComps(JSON.parse(JSON.stringify(comps)), true, BOARD); RT.clear(); settle(); return S.comps; };
  const byT = t => S.comps.filter(c => c.t === t);
  const warn = re => SIM.warns.some(w => re.test(w[1]));

  /* ───── ① 기본 부품 ───── */
  {
    // 전선: 한쪽 HIGH가 다른 줄로 그대로
    build([{ t: 'sw', pins: ['tp3', 'a3'], on: true }, { t: 'wire', pins: ['b3', 'b9'] }]);
    rec('기본', '전선', lvH('e9') === Hh, '이은 줄로 HIGH가 전해짐');
    // 토글 스위치
    build([{ t: 'sw', pins: ['tp3', 'a3'], on: false }, { t: 'res', pins: ['b3', 'tn4'], ohms: 10000 }]);
    const off = lvH('e3'); byT('sw')[0].on = true; settle(); const on = lvH('e3');
    rec('기본', '토글 스위치', off === L && on === Hh, `꺼짐 ${LVK[off]}(풀다운) → 켜짐 ${LVK[on]}`);
    // 푸시 버튼(누르는 동안만)
    build([{ t: 'btn', pins: ['tp3', 'a3'] }, { t: 'res', pins: ['b3', 'tn4'], ohms: 10000 }]);
    const b0 = lvH('e3'); rt(byT('btn')[0]).pressed = true; settle(); const b1 = lvH('e3'); rt(byT('btn')[0]).pressed = false; settle(); const b2 = lvH('e3');
    rec('기본', '푸시 버튼', b0 === L && b1 === Hh && b2 === L, `안 누름 ${LVK[b0]} · 누름 ${LVK[b1]} · 뗌 ${LVK[b2]}`);
    // 저항: 풀업·풀다운은 약하게(스위치가 이김), 직렬 저항은 신호를 그대로 전함
    build([{ t: 'res', pins: ['a3', 'tp3'], ohms: 10000 }, { t: 'sw', pins: ['b3', 'tn4'], on: true }, { t: 'res', pins: ['a7', 'tn7'], ohms: 10000 }]);
    const pu = lvH('e3'), pd = lvH('e7'); byT('sw')[0].on = false; settle(); const pu2 = lvH('e3');
    rec('기본', '저항 (풀업·풀다운)', pd === L && pu2 === Hh && pu === L, `풀다운만 ${LVK[pd]} · 풀업만 ${LVK[pu2]} · 풀업+스위치→GND ${LVK[pu]}(스위치가 이김)`);
    // LED: 정방향 켜짐, 역방향 꺼짐+경고, 저항 없으면 경고
    build([{ t: 'sw', pins: ['tp3', 'a3'], on: true }, { t: 'res', pins: ['b3', 'b8'], ohms: 330 }, { t: 'led', pins: ['c8', 'tn8'], color: 'red' }]);
    const f = SIM.led.get(byT('led')[0].id).lit, fw = SIM.warns.length;
    build([{ t: 'sw', pins: ['tp3', 'a3'], on: true }, { t: 'res', pins: ['b3', 'b8'], ohms: 330 }, { t: 'led', pins: ['tn8', 'c8'], color: 'red' }]);
    const rv = SIM.led.get(byT('led')[0].id).lit, rw = warn(/거꾸로/);
    build([{ t: 'sw', pins: ['tp3', 'a3'], on: true }, { t: 'led', pins: ['c3', 'tn3'], color: 'red' }]);
    const nw = warn(/저항/);
    rec('기본', 'LED', f && !fw && !rv && rw && nw, `정방향+330Ω 켜짐 ${f}(경고 ${fw}) · 역방향 켜짐 ${rv}, 경고 ${rw} · 저항 없음 경고 ${nw}`);
    build([{ t: 'sw', pins: ['tp3', 'a3'], on: true }, { t: 'res', pins: ['b3', 'b8'], ohms: 330 }, { t: 'led', pins: ['tn8', 'c8'], color: 'red', lk: 'bip' }]);
    rec('기본', 'LED (양방향)', SIM.led.get(byT('led')[0].id).lit, '역방향으로도 켜짐');
    build([{ t: 'sw', pins: ['tp3', 'a3'], on: true }, { t: 'led', pins: ['c3', 'tn3'], color: 'red', lk: 'res' }]);
    rec('기본', 'LED (저항 내장)', SIM.led.get(byT('led')[0].id).lit && !warn(/저항/), '5V에 바로 이어도 경고 없음');
    // 2색 LED 3핀
    for (const ca of [false, true]) {
      const hiR = ca ? 'tn' : 'tp', com = ca ? 'tp' : 'tn';
      build([{ t: 'led3', pins: ['c10', 'c11', 'c13'], ca }, { t: 'wire', pins: ['a11', com + '11'] },
        { t: 'res', pins: ['a10', hiR + '9'], ohms: 330 }]);
      const l1 = SIM.disp.get(byT('led3')[0].id).lit;
      rec('기본', `2색 LED 3핀 (${ca ? '공통 애노드' : '공통 캐소드'})`, l1[0] && !l1[1], `빨강 핀만 ${ca ? 'LOW' : 'HIGH'} → 빨강 ${l1[0]}, 초록 ${l1[1]}`);
    }
    // 커패시터: RC 충전 τ = RC 에서 63%, 5τ 에서 99%
    build([{ t: 'sw', pins: ['tp3', 'a3'], on: true }, { t: 'res', pins: ['b3', 'b9'], ohms: 10000 }, { t: 'cap', pins: ['c9', 'tn9'], farad: 47e-6 }]);
    const cap = byT('cap')[0]; rt(cap).v = 0; SIM.lastA = simNow(); step(0.01, 47); const v1 = rt(cap).v; step(0.01, 188); const v5 = rt(cap).v;
    rec('기본', '커패시터 (RC 충전)', near(v1, 5 * (1 - Math.exp(-1)), 0.25) && v5 > 4.85, `10kΩ·47µF: τ(0.47초) ${v1.toFixed(2)}V (이론 3.16V) · 5τ ${v5.toFixed(2)}V (이론 4.97V)`);
    // 전해 커패시터 역극성 경고
    build([{ t: 'sw', pins: ['tp3', 'a3'], on: true }, { t: 'cap', pins: ['tn3', 'c3'], farad: 47e-6 }]);
    step(0.05, 20);
    rec('기본', '커패시터 (전해 극성)', warn(/극성/), '거꾸로 꽂으면 경고');
    // 클럭: 주파수·듀티 50%
    build([{ t: 'clk', pins: ['j8'], hz: 2 }]);
    let edges = 0, hi = 0, n = 0, prev = lvH('f8'); for (let i = 0; i < 300; i++) { simBase += 0.01; settle(); const v = lvH('f8'); if (prev === L && v === Hh) edges++; if (v === Hh) hi++; n++; prev = v; }
    rec('기본', '클럭 발생기', edges === 6 && near(hi / n, 0.5, 0.05), `2Hz로 3초: 올라감 ${edges}번(이론 6) · HIGH 비율 ${(hi / n).toFixed(2)}(이론 0.50)`);
    // 7세그먼트(1자리): 실제 핀 배치 1 e,2 d,3 COM,4 c,5 dp,6 b,7 a,8 COM,9 f,10 g
    const REF7 = { 1: 'e', 2: 'd', 4: 'c', 5: 'dp', 6: 'b', 7: 'a', 9: 'f', 10: 'g' };
    for (const ca of [false, true]) {
      let okAll = true; const bad = [];
      for (const [pin, seg] of Object.entries(REF7)) {
        loadComps([{ t: 'seg7', col: 10, ca }], true, BOARD); const c = S.comps[0], hs = pinHoles(c);
        const drive = (hole, lv) => { const H = HOLES.get(hole), top = H.ri <= 6, col = H.c; return lv === Hh ? { t: 'sw', pins: [(top ? 'tp' : 'bp') + col, (top ? 'a' : 'j') + col], on: true } : { t: 'wire', pins: [(top ? 'a' : 'j') + col, (top ? 'tn' : 'bn') + col] }; };
        const comH = hs[2], segH = hs[+pin - 1];
        const parts = [{ t: 'seg7', col: 10, ca }];
        // COM(3번)과 획 핀: 6의 배수 열에는 레일 구멍이 없으니 옆 줄로 돌려 잇는다
        const route = (hole, lv) => { const H = HOLES.get(hole); if (railHas(H.c)) return [drive(hole, lv)]; const top = H.ri <= 6;
          return [{ t: 'wire', pins: [(top ? 'b' : 'i') + H.c, (top ? 'b' : 'i') + (H.c + 31)] }, drive((top ? 'c' : 'h') + (H.c + 31), lv)]; };
        parts.push(...route(comH, ca ? Hh : L)); parts.push(...route(segH, ca ? L : Hh));
        build(parts); const on = SIM.seg.get(byT('seg7')[0].id) || {};
        const lit = Object.keys(on).filter(k => on[k]);
        if (!(lit.length === 1 && lit[0] === seg)) { okAll = false; bad.push(`${pin}번→${lit.join('') || '없음'}`); }
      }
      rec('기본', `7세그먼트 1자리 (${ca ? '공통 애노드' : '공통 캐소드'})`, okAll, okAll ? '10핀 표준 배치(7=a, 6=b, 4=c, 2=d, 1=e, 9=f, 10=g, 5=dp, 3·8=COM)와 일치' : bad.join(', '));
    }
    // 파워 서플라이·건전지: 단자 사이 전압
    for (const [t, v] of [['psu', 12], ['bat', 9]]) {
      build([{ t, k: 1, x: 20, y: 440, v }, { t: 'wire', pins: ['@1:0', 'a3'] }, { t: 'wire', pins: ['@1:1', 'a9'] }, { t: 'res', pins: ['b3', 'b9'], ohms: 1000 }, { t: 'cap', pins: ['c3', 'c9'], farad: 1e-6 }]);
      step(0.02, 10); const va = vH('e3'), vb = vH('e9');
      rec('기본', t === 'psu' ? '파워 서플라이' : '건전지', va != null && vb != null && near(va - vb, v, 0.1), `${v}V 설정 → 단자 사이 ${va != null && vb != null ? (va - vb).toFixed(2) : '?'}V`);
    }
    // 함수 발생기: 파형 식(실제 정의대로) + 보드에서 듀티
    { const c = { wave: 'sq', hz: 2, vpp: 5, off: 0, duty: 25 }; let hiN = 0; for (let i = 0; i < 400; i++)if (fgVolt(c, i / 400) > 2.5) hiN++;
      const t = { wave: 'tri', hz: 1, vpp: 4, off: 1 }, s = { wave: 'sin', hz: 1, vpp: 2, off: 0 }, w = { wave: 'saw', hz: 1, vpp: 5, off: 0 };
      const ok = near(hiN / 400, .25, .01) && near(fgVolt(t, .25), 3, .01) && near(fgVolt(t, .5), 5, .01) && near(fgVolt(t, 0), 1, .01) && near(fgVolt(s, .25), 2, .01) && near(fgVolt(s, .75), 0, .01) && near(fgVolt(w, .5), 2.5, .01);
      rec('기본', '함수 발생기', ok, `구형파 듀티 25% → HIGH 비율 ${(hiN / 400).toFixed(2)} · 삼각파 1~5V 꼭짓점 ${fgVolt(t, .5).toFixed(1)}V · 사인파 최고 ${fgVolt(s, .25).toFixed(1)}V · 톱니파 중간 ${fgVolt(w, .5).toFixed(1)}V`); }
  }

  /* ───── ② 수동 소자: 위치마다 이어지는 핀(같은 묶음)·저항 ───── */
  {
    const nm = (k, i) => PX[k].pins[i].replace(/\s*\(.*\)$/, '');
    const groups = (k, c, r) => { const n = PX[k].pins.length, p = [...Array(n).keys()], f = x => p[x] === x ? x : (p[x] = f(p[x]));
      for (const [a, b] of (PX[k].contacts ? PX[k].contacts(c, r) : [])) p[f(a)] = f(b);
      const m = new Map(); for (let i = 0; i < n; i++) { const g = f(i); if (!m.has(g)) m.set(g, []); m.get(g).push(nm(k, i)); }
      return [...m.values()].filter(g => g.length > 1).map(g => g.sort().join('-')).sort().join(' '); };
    const want = list => list.map(g => g.split('-').sort().join('-')).sort().join(' ');
    const mk = (k, o) => Object.assign({ kind: k }, PX[k].init(), o || {});
    const check = (k, cases) => { const bad = []; for (const [label, c, r, exp] of cases) { const got = groups(k, mk(k, c), r); if (got !== want(exp)) bad.push(`${label}: ${got || '없음'} (기대 ${want(exp) || '없음'})`); }
      rec('수동 소자', `${k} · ${PX[k].title}`, !bad.length, bad.length ? bad.join(' / ') : cases.map(([l, , , e]) => `${l}: ${e.join(' ') || '끊김'}`).join(' · ')); };
    // 토글·슬라이드·로커·푸시
    check('slide1', [['s0', { s: 0 }, null, ['1-2']], ['s1', { s: 1 }, null, ['2-3']]]);
    check('tog2', [['s0', { s: 0 }, null, ['1-2']], ['s1', { s: 1 }, null, ['2-3']]]);
    check('tog1', [['끔', { s: 0 }, null, []], ['켬', { s: 1 }, null, ['1-2']]]);
    check('rock1', [['끔', { s: 0 }, null, []], ['켬', { s: 1 }, null, ['1-2']]]);
    check('tog3', [['왼쪽', { s: 0 }, null, ['1-2']], ['가운데', { s: 1 }, null, []], ['오른쪽', { s: 2 }, null, ['2-3']]]);
    check('togm', [['놓음', {}, null, []], ['왼쪽 누름', {}, { pr: -1 }, ['1-2']], ['오른쪽 누름', {}, { pr: 1 }, ['2-3']]]);
    for (const k of ['slide2', 'tog4', 'push2']) check(k, [['s0', { s: 0 }, null, ['1-2', '4-5']], ['s1', { s: 1 }, null, ['2-3', '5-6']]]);
    check('pushm', [['놓음', {}, null, ['1-2', '4-5']], ['누름', {}, { pr: 1 }, ['2-3', '5-6']]]);
    check('rock2', [['끔', { s: 0 }, null, []], ['켬', { s: 1 }, null, ['1-2']]]);
    // 택트: 홈을 걸쳐 꽂으면 홈 건너 마주 보는 다리끼리 늘 이어져 있고(1-4, 2-3), 누르면 넷 다 이어짐
    check('tact6', [['놓음', {}, null, ['1-4', '2-3']], ['누름', {}, { pr: 1 }, ['1-2-3-4']]]);
    check('tact12', [['놓음', {}, null, ['1-4', '2-3']], ['누름', {}, { pr: 1 }, ['1-2-3-4']]]);
    check('tactra', [['놓음', {}, null, []], ['누름', {}, { pr: 1 }, ['1-2']]]);
    // DIP 스위치: k번 스위치가 켜지면 k번 핀 ↔ 마주 보는 핀(4극: 9−k, 8극: 17−k)
    for (const [k, n] of [['dip4', 4], ['dip8', 8]]) { const cases = []; for (let i = 0; i < n; i++) { const bits = Array(n).fill(0); bits[i] = 1; cases.push([`${i + 1}번 켬`, { bits }, null, [`${i + 1}-${2 * n + 1 - (i + 1)}`]]); } check(k, cases); }
    // 로터리 DIP: 값의 2진 비트대로 C(공통, C2와 같음)가 1·2·4·8번 핀에 이어짐
    for (const [k, n] of [['rbcd', 10], ['rhex', 16]]) { const cases = []; for (let v = 0; v < n; v++) { const on = [1, 2, 4, 8].filter((b, i) => (v >> i) & 1).map(String); cases.push([`값 ${v}`, { s: v }, null, [['C', 'C2', ...on].join('-')]]); } check(k, cases); }
    // 로터리 셀렉터: 극마다 공통 Cx가 위치 s의 단자에
    for (const [k, poles, n] of [['sel1', 1, 12], ['sel2', 2, 6], ['sel3', 3, 4], ['sel4', 4, 3]]) { const cases = []; const L_ = 'ABCD';
      for (let s = 0; s < n; s++)cases.push([`${s + 1}단`, { s }, null, [...Array(poles).keys()].map(p => `COM${p + 1}-${L_[p]}${s + 1}`)]); check(k, cases); }
    // 로터리 인코더: 시계 방향(+1씩)이면 A가 B보다 먼저 C에 붙는다(직교 신호), 누르면 S1-S2
    { const seq = [0, 1, 2, 3, 4].map(s => groups('enc', mk('enc', { s }), null)), push = groups('enc', mk('enc', { s: 0 }), { pr: 1 });
      const A = seq.map(g => /A-C|C-A/.test(g.replace(/-B/, '')) || /A/.test(g) ? 1 : 0), B = seq.map(g => /B/.test(g) ? 1 : 0);
      const lead = A.findIndex(x => x) < B.findIndex(x => x);
      rec('수동 소자', `enc · ${PX.enc.title}`, lead && /S1-S2/.test(push), `시계 방향 A: ${A.join('')} · B: ${B.join('')} (A가 먼저) · 누르면 ${push}`); }
    // 가변저항: 1-2(와이퍼) 저항 = 전체 × 커브(위치). 시계 방향(pos=1) 끝에서 와이퍼가 3번 핀 쪽
    const curve = { B: x => x, A: x => (Math.pow(10, 2 * x) - 1) / 99, C: x => 1 - (Math.pow(10, 2 * (1 - x)) - 1) / 99 };
    for (const k of ['pot9', 'pot16', 'pot24', 'trim6', 'trim3362', 'trim3296', 'slide', 'pot16d', 'pot16s']) {
      const bad = []; for (const taper of ['B', 'A', 'C']) for (const pos of [0, .25, .5, .75, 1]) { const c = mk(k, { ohms: 10000, taper, pos }); const rs = PX[k].res(c);
        const R12 = rs[0][2], R23 = rs[1][2], tot = R12 + R23, exp = 10000 * curve[taper](pos);
        if (!near(tot, 10000, 2.5) || !near(R12, Math.max(1, exp), 12)) bad.push(`${taper}${pos}: 1-2 ${R12.toFixed(0)}Ω(기대 ${exp.toFixed(0)})`);
        if (k === 'pot16d' && (rs.length < 4 || !near(rs[2][2], R12, 1))) bad.push('2련 두 번째 저항이 같이 안 움직임'); }
      let sw = ''; if (k === 'pot16s') { const g0 = groups(k, mk(k, { pos: 0 })), g1 = groups(k, mk(k, { pos: .3 })); if (/S1-S2|S2-S1/.test(g0) || !/S1-S2|S2-S1/.test(g1)) bad.push(`스위치: 끝 ${g0 || '끊김'}, 돌림 ${g1 || '끊김'}`); else sw = ' · 스위치: 왼쪽 끝 끊김, 돌리면 S1-S2'; }
      rec('수동 소자', `${k} · ${PX[k].title}`, !bad.length, bad.length ? bad.join(' / ') : `B 선형·A 오디오(50%에서 ${(curve.A(.5) * 100).toFixed(0)}%)·C 역대수 커브, 1-2 + 2-3 = 전체${sw}`);
    }
    // 저항 어레이: 공통형 1번 ↔ 2~9번 각각 R, 독립형은 1-2, 3-4, 5-6, 7-8
    { const rs = PX.sipb.res(mk('sipb', { ohms: 4700 })).map(([a, b, o]) => `${nm('sipb', a)}-${nm('sipb', b)}:${o}`).sort();
      const exp = [2, 3, 4, 5, 6, 7, 8, 9].map(i => `1-${i}:4700`).sort(); rec('수동 소자', `sipb · ${PX.sipb.title}`, JSON.stringify(rs) === JSON.stringify(exp), rs.join(' ')); }
    { const rs = PX.sipi.res(mk('sipi', { ohms: 330 })).map(([a, b, o]) => [nm('sipi', a), nm('sipi', b)].sort((x, y) => x - y).join('-') + ':' + o).sort();
      const exp = ['1-2:330', '3-4:330', '5-6:330', '7-8:330']; rec('수동 소자', `sipi · ${PX.sipi.title}`, JSON.stringify(rs) === JSON.stringify(exp), rs.join(' ') + (JSON.stringify(rs) === JSON.stringify(exp) ? '' : ` (실제 독립형 8핀: ${exp.join(' ')})`)); }
    // 릴레이: 코일이 꺼지면 COM→NC, 켜지면 COM→NO (래칭은 상태 s), SSR은 출력 1-2
    check('rlyc', [['꺼짐', {}, {}, ['COM-NC']], ['켜짐', {}, { on: true }, ['COM-NO']]]);
    check('rlyd', [['꺼짐', {}, {}, ['COM1-NC1', 'COM2-NC2']], ['켜짐', {}, { on: true }, ['COM1-NO1', 'COM2-NO2']]]);
    check('reed', [['꺼짐', {}, {}, []], ['켜짐', {}, { on: true }, ['COM-NO']]]);
    check('rlyl', [['RESET', { s: 0 }, {}, ['COM-NC']], ['SET', { s: 1 }, {}, ['COM-NO']]]);
    check('ssr', [['꺼짐', {}, {}, []], ['켜짐', {}, { on: true }, ['출력 1-출력 2']]]);
    // 코일: 정격 전압에서 붙고(75%), 10% 밑에서 떨어짐, 코일 저항 = 정격²÷전력
    { const bad = []; for (const k of ['rlyc', 'rlyd', 'reed', 'sol']) for (const cv of PX[k].cvs) { const c = mk(k, { cv }), r = {};
        coilUpd(c, r, .7 * cv); if (r.on) bad.push(`${k} ${cv}V: 70%에서 붙음`); coilUpd(c, r, .76 * cv); if (!r.on) bad.push(`${k} ${cv}V: 76%에서 안 붙음`);
        coilUpd(c, r, .2 * cv); if (!r.on) bad.push(`${k} ${cv}V: 20%에서 떨어짐`); coilUpd(c, r, .05 * cv); if (r.on) bad.push(`${k} ${cv}V: 5%에서 안 떨어짐`);
        const R = PX[k].res(c)[0][2]; if (!near(R, cv * cv / PX[k].cw, 1)) bad.push(`${k} 코일 ${R}Ω`); }
      const s = mk('ssr'), r = {}; coilUpd(s, r, -5); const rev = r.on; coilUpd(s, r, 5); if (rev || !r.on) bad.push('SSR 극성');
      const l = mk('rlyl'); coilUpd(l, {}, 5); const a1 = l.s; coilUpd(l, {}, 0); const a2 = l.s; coilUpd(l, {}, -5); if (a1 !== 1 || a2 !== 1 || l.s !== 0) bad.push('래칭');
      for (const k of ['sol']) rec('수동 소자', `${k} · ${PX[k].title}`, !bad.length, bad.join(' / ') || `5V 코일 ${coilR(mk(k))}Ω`);
      rec('수동 소자', '릴레이 코일 (붙음 75%·떨어짐 10%·코일 저항)', !bad.length, bad.join(' / ') || `큐브 5V ${coilR(mk('rlyc'))}Ω · DIP 5V ${coilR(mk('rlyd'))}Ω · 리드 5V ${coilR(mk('reed'))}Ω · SSR 극성 · 래칭 SET/유지/RESET`); }
    // 공심 코일: 휠러 근사식 L(µH) = N²r²/(9r+10ℓ), 지름 10mm 20회(길이 10mm) → r=0.197in, ℓ=0.394in → 약 2.7µH
    { const c = mk('indair', { turns: 20, dmm: 10 }), L_ = airL(c), r = 5 / 25.4, l = 10 / 25.4, exp = 400 * r * r / (9 * r + 10 * l) * 1e-6, c2 = mk('indair', { turns: 40, dmm: 10 });
      rec('수동 소자', `indair · ${PX.indair.title}`, near(L_, exp, exp * .01) && airL(c2) > 1.5 * L_ && PX.indair.thru, `20회 지름 10mm → ${henTx(L_)} (식 ${henTx(+exp.toPrecision(3))}) · 40회 → ${henTx(airL(c2))} · 직류로 이어짐`); }
    // 인덕터·비드: 직류로 이어짐(thru), 리액턴스 계산용 값, 색띠(µH)
    for (const k of ['inda', 'indr', 'indt', 'bead']) { const d = PX[k], ok = d.thru && d.pins.length === 2 && (k === 'bead' || d.init().henry > 0);
      rec('수동 소자', `${k} · ${d.title}`, ok, ok ? '직류에서 1-2 이어짐' + (k !== 'bead' ? ` · 기본 ${henTx(d.init().henry)}` : '') : '정의 확인'); }
    { const t = [[1e-4, [1, 0, 1]], [4.7e-5, [4, 7, 0]], [1e-6, [1, 0, -1]], [2.2e-3, [2, 2, 2]]], bad = t.filter(([L_, e]) => indBands(L_).join() !== [BANDC[e[0]], BANDC[e[1]], e[2] < 0 ? '#C9A227' : BANDC[e[2]]].join());
      rec('수동 소자', '인덕터 색띠 (µH)', !bad.length, bad.length ? bad.map(x => henTx(x[0])).join(' ') : '100µH 갈검갈 · 47µH 노보검 · 1µH 갈검금 · 2.2mH 빨빨빨'); }
    // 다이오드: 5V → 다이오드 → 1kΩ → GND 에서 캐소드 전압(= 5 − 순방향 전압), 거꾸로 꽂으면 전류 없음(캐소드 쪽이 5V 그대로)
    for (const [k, lo, hi] of [['d4148', .55, .75], ['d4007', .55, .78], ['d5819', .15, .38], ['dge', .12, .45], ['dz51', .55, .78], ['duf', .6, .85], ['dbat', .25, .45], ['d914', .55, .75], ['d5711', .4, .7], ['d4004', .55, .78], ['dpin', .7, .85], ['dvar', .65, .8], ['dzref', .6, .8]]) {
      const e = 3 + PX[k].dc[1];
      build([{ t: 'wire', pins: ['a3', 'tp3'] }, { t: 'px', kind: k, pins: ['c3', 'c' + e] }, { t: 'res', pins: ['d' + e, 'd' + (e + 4)], ohms: 1000 }, { t: 'wire', pins: ['a' + (e + 4), 'tn' + (e + 4)] }]);
      const vf = 5 - vH('e' + e);
      build([{ t: 'wire', pins: ['a3', 'tn3'] }, { t: 'px', kind: k, pins: ['c3', 'c' + e] }, { t: 'res', pins: ['d' + e, 'd' + (e + 4)], ohms: 1000 }, { t: 'wire', pins: ['a' + (e + 4), 'tp' + (e + 4)] }]);
      const vr = vH('e' + e);
      rec('수동 소자', `${k} · ${PX[k].title}`, vf >= lo && vf <= hi && near(vr, 5, .01), `약 ${(4.3).toFixed(1)}mA에서 순방향 ${vf.toFixed(2)}V (대표 범위 ${lo}~${hi}V) · 거꾸로 꽂으면 캐소드 ${vr.toFixed(2)}V(전류 없음)`); }
    // 제너: 12V → 330Ω → 캐소드, 애노드 GND, 1kΩ 부하 → 5.1V 근처로 붙잡음
    { build([{ t: 'psu', k: 1, x: 20, y: 440, v: 12 }, { t: 'wire', pins: ['@1:0', 'a3'] }, { t: 'wire', pins: ['@1:1', 'a20'] }, { t: 'res', pins: ['b3', 'b9'], ohms: 330 }, { t: 'px', kind: 'dz51', pins: ['c20', 'c9'] }, { t: 'res', pins: ['d9', 'd20'], ohms: 1000 }]);
      const v = vH('e9'); rec('수동 소자', '제너 정전압 (12V → 330Ω → 5.1V)', v > 5.0 && v < 5.35, `출력 ${v.toFixed(2)}V`); }
    // 브리지: 입력 방향을 바꿔도 + 단자가 + (두 다이오드만큼 낮음)
    { const out = []; for (const flip of [false, true]) { build([{ t: 'px', kind: 'brdg', pins: ['f10', 'f12', 'e12', 'e10'] }, { t: 'wire', pins: ['j12', flip ? 'bp13' : 'bn13'] }, { t: 'wire', pins: ['a10', flip ? 'tn10' : 'tp10'] }, { t: 'res', pins: ['i10', 'i16'], ohms: 1000 }, { t: 'wire', pins: ['a12', 'a16'] }]);
        out.push(vH('j10') - vH('e12')); }
      rec('수동 소자', `brdg · ${PX.brdg.title}`, out.every(x => x > 3.3 && x < 4), `입력 정방향 +−사이 ${out[0].toFixed(2)}V · 뒤집어도 ${out[1].toFixed(2)}V`); }
    // 트랜지스터·MOSFET: 열 13·14·15에 꽂고 핀마다 전원·GND·저항(1kΩ/4.7kΩ, 홈 건너 아래 레일로)으로 잇는다 → 켜고 끈 뒤 부하 쪽 전압
    { const pinHole = (k, i) => 'c' + (13 + i), cn = (x, how) => how === 'vcc' ? [{ t: 'wire', pins: ['a' + x, 'tp' + x] }] : how === 'gnd' ? [{ t: 'wire', pins: ['a' + x, 'tn' + x] }]
        : [{ t: 'res', pins: ['d' + x, 'g' + x], ohms: how[1] === 'v' ? 1000 : 4700 }, { t: 'wire', pins: ['j' + x, how[0] === 'v' ? 'bp' + x : 'bn' + x] }];
      // 기대(이 파일에서 따로 적음): [종류, 핀 순서, 켜는 방법]
      const SPEC = { q3904: ['npn', 'EBC'], q2222: ['npn', 'EBC'], qbc547: ['npn', 'CBE'], qtip: ['npn', 'BCE'], q3906: ['pnp', 'EBC'], qbc557: ['pnp', 'CBE'], m7000: ['nmos', 'SGD'], mnpow: ['nmos', 'GDS'], mppow: ['pmos', 'GDS'], q3055: ['npn', 'BEC'], q2955: ['pnp', 'BEC'], q2222m: ['npn', 'EBC'], q2907m: ['pnp', 'EBC'], qp39: ['pnp', 'EBC'], q18s: ['npn', 'EBC'], qbc337: ['npn', 'CBE'], qbc327: ['pnp', 'CBE'], q4401: ['npn', 'EBC'], q4403: ['pnp', 'EBC'], qmpsa13: ['npn', 'EBC'], qtip31: ['npn', 'BCE'], qtip32: ['pnp', 'BCE'], qtip125: ['pnp', 'BCE'], qbd139: ['npn', 'ECB'], qbd140: ['pnp', 'ECB'], mbs170: ['nmos', 'DGS'] };
      for (const [k, [ty, ord]] of Object.entries(SPEC)) {
        const run = drive => { const how = {}; const n = ty === 'npn' || ty === 'nmos';
          // 이미터·소스: NPN·N은 GND, PNP·P는 +. 부하(1kΩ): NPN·N은 + 에서 컬렉터·드레인으로, PNP·P는 컬렉터·드레인에서 GND로
          how[n ? (ty === 'npn' ? 'E' : 'S') : (ty === 'pnp' ? 'E' : 'S')] = n ? 'gnd' : 'vcc';
          how[ty === 'npn' || ty === 'pnp' ? 'C' : 'D'] = n ? 'vr' : 'gr';
          // 베이스(4.7kΩ)·게이트(바로): 켤 때 NPN·N은 +, PNP·P는 GND
          const on = drive === 'on', toV = n ? on : !on, bjt = ty === 'npn' || ty === 'pnp';
          how[bjt ? 'B' : 'G'] = bjt ? (toV ? 'vb' : 'gb') : (toV ? 'vcc' : 'gnd');
          const comps = [{ t: 'px', kind: k, pins: [0, 1, 2].map(i => pinHole(k, i)) }];
          for (let i = 0; i < 3; i++) comps.push(...cn(13 + i, how[ord[i]]));
          build(comps); const load = 13 + ord.indexOf(bjt ? 'C' : 'D'); return { v: vH('b' + load), on: !!rt(S.comps.find(c => c.t === 'px')).on, bad: SIM.warns.filter(w => w[0] === 'bad').map(w => w[1]) }; };
        const a = run('on'), b = run('off'), n = ty === 'npn' || ty === 'nmos';
        const ok = a.on && !b.on && (n ? a.v < .3 && b.v > 4.7 : a.v > 4.7 && b.v < .3) && !a.bad.length && !b.bad.length && PX[k].pins.map(p => p[0]).join('') === ord;
        rec('수동 소자', `${k} · ${PX[k].title}`, ok, `핀 ${ord} · 켬: 부하 쪽 ${a.v != null ? a.v.toFixed(2) : '?'}V · 끔: ${b.v != null ? b.v.toFixed(2) : '?'}V${a.bad.concat(b.bad).length ? ' · 경고 ' + a.bad.concat(b.bad).join('/') : ''}`); }
      // 베이스에 저항 없이 + → 경고, 게이트가 떠 있으면 경고
      build([{ t: 'px', kind: 'q3904', pins: ['c13', 'c14', 'c15'] }, { t: 'wire', pins: ['a13', 'tn13'] }, { t: 'wire', pins: ['a14', 'tp14'] }]); const w1 = warn(/베이스\(B\)가 저항 없이/);
      build([{ t: 'px', kind: 'm7000', pins: ['c13', 'c14', 'c15'] }, { t: 'wire', pins: ['a13', 'tn13'] }]); const w2 = warn(/게이트\(G\)가 아무 데도/);
      rec('수동 소자', '트랜지스터 경고 (베이스 저항 없음 · 게이트 떠 있음)', w1 && w2, `베이스 바로 + : ${w1 ? '경고' : '없음'} · 게이트 떠 있음: ${w2 ? '경고' : '없음'}`); }
    // ── 20차: 금속 캔·TO-3 트랜지스터는 위 SPEC 표에서 함께 확인. JFET(공핍형): 소스를 +5V에, 드레인 1kΩ → GND. 게이트 = 소스면 켜짐, 게이트 GND(−5V)면 꺼짐
    for (const jk of ['jfn', 'jfn92']) { const run = g => { build([{ t: 'px', kind: jk, pins: ['c13', 'c14', 'c15'] }, { t: 'res', pins: ['d13', 'g13'], ohms: 1000 }, { t: 'wire', pins: ['j13', 'bn13'] }, { t: 'wire', pins: ['a14', 'tp14'] }, { t: 'wire', pins: ['a15', g ? 'tp15' : 'tn15'] }]);
        return { v: vH('a13'), on: !!rt(S.comps[0]).on }; };
      const a = run(1), b = run(0);
      rec('수동 소자', `${jk} · ${PX[jk].title}`, a.on && !b.on && a.v > 4.5 && b.v < .3 && PX[jk].pins.map(p => p[0]).join('') === 'DSG' && PX[jk].tr.vth < 0,
        `핀 DSG · 게이트=소스(0V) 켜짐, 드레인 ${a.v != null ? a.v.toFixed(2) : '?'}V · 게이트 −5V 꺼짐, 드레인 ${b.v != null ? b.v.toFixed(2) : '?'}V · 문턱 ${PX[jk].tr.vth}V`); }
    // ── 21차: 수동·기구·보호 소자
    { // 기준 제너: 12V → 330Ω → 캐소드, 1kΩ 부하 → 6.2V 근처
      build([{ t: 'psu', k: 1, x: 20, y: 440, v: 12 }, { t: 'wire', pins: ['@1:0', 'a3'] }, { t: 'wire', pins: ['@1:1', 'a20'] }, { t: 'res', pins: ['b3', 'b9'], ohms: 330 }, { t: 'px', kind: 'dzref', pins: ['c20', 'c24'] }, { t: 'wire', pins: ['d24', 'd9'] }, { t: 'res', pins: ['e9', 'e20'], ohms: 1000 }]);
      const v = vH('e9'); rec('수동 소자', '기준 제너 정전압 (12V → 330Ω → 6.2V)', v > 6.1 && v < 6.45, `출력 ${v.toFixed(2)}V`); }
    // 이어 주는 부품(피드스루 C·가변 코일·퓨즈·열 차단 스위치): 1번에 HIGH → 반대쪽 HIGH(풀다운 10k), 끊으면 LOW
    for (const [k, a, b, brk] of [['cfeed', 0, 2], ['indv', 0, 2], ['fuse', 0, 1, 'blown'], ['tco', 0, 1, 'hot']]) {
      const d = PX[k], col = i => 5 + d.dc[i];
      build([{ t: 'px', kind: k, pins: d.dc.map(x => 'c' + (5 + x)) }, { t: 'wire', pins: ['a' + col(a), 'tp' + col(a)] }, { t: 'res', pins: ['d' + col(b), 'g' + col(b)], ohms: 10000 }, { t: 'wire', pins: ['j' + col(b), 'bn' + col(b)] }]);
      const on = lvH('e' + col(b)); let off = null; if (brk) { S.comps[0][brk] = 1; settle(); off = lvH('e' + col(b)); }
      rec('수동 소자', `${k} · ${d.title}`, on === Hh && (!brk || off === L) && d.nid, `${d.pins[a].split(' ')[0]} HIGH → ${d.pins[b].split(' ')[0]} ${LVK[on]}${brk ? ` · ${brk === 'blown' ? '끊어지면' : '뜨거우면'} ${LVK[off]}` : ''}`); }
    { // NTC: 5V → NTC → 노드 → 10k → GND. 25°C면 2.5V, 50°C(약 3.6kΩ)면 약 3.68V
      const v = T => { build([{ t: 'px', kind: 'ntc', pins: ['c5', 'c7'], temp: T }, { t: 'wire', pins: ['a5', 'tp5'] }, { t: 'res', pins: ['d7', 'g7'], ohms: 10000 }, { t: 'wire', pins: ['j7', 'bn7'] }]); return vH('e7'); };
      const a = v(25), b = v(50), e50 = 5 * 10000 / (10000 + 10000 * Math.exp(3950 * (1 / 323.15 - 1 / 298.15)));
      rec('수동 소자', `ntc · ${PX.ntc.title}`, near(a, 2.5, .01) && near(b, e50, .01), `25°C ${a.toFixed(3)}V(기대 2.5) · 50°C ${b.toFixed(3)}V(기대 ${e50.toFixed(3)})`); }
    { // 트리머 C: 누를 때마다 값이 바뀜, 직류로는 끊김
      const c = { kind: 'ctrim', s: 3 }; PX.ctrim.tap(c, 1); rec('수동 소자', `ctrim · ${PX.ctrim.title}`, c.s === 4 && !PX.ctrim.contacts && PX.ctrim.nid, '10pF → 15pF, 직류 끊김'); }
    { // 광학 인코더: A·B 풀업, 한 칸씩 돌리면 (A,B) = LL → HL → HH → LH (직교 2상)
      build([{ t: 'px', kind: 'rpg', pins: ['c13', 'c14', 'c15', 'c16'] }, { t: 'wire', pins: ['a13', 'tp13'] }, { t: 'wire', pins: ['a16', 'tn16'] }, { t: 'res', pins: ['b14', 'tp14'], ohms: 10000 }, { t: 'res', pins: ['b15', 'tp15'], ohms: 10000 }]);
      const seq = []; for (let i = 0; i < 4; i++) { seq.push(LVK[lvH('e14')] + LVK[lvH('e15')]); PX.rpg.tap(S.comps[0], 1); settle(); }
      rec('수동 소자', `rpg · ${PX.rpg.title}`, seq.join() === 'LL,HL,HH,LH', seq.join(' → ')); }
    { // 키패드: R2를 GND로, C1·C2 풀업. 키 '6'(R2·C3)을 누르면 C3만 LOW
      const run = (key, pr) => { build([{ t: 'px', kind: 'kp44', pins: rng(8, i => 'c' + (13 + i)), key }, { t: 'wire', pins: ['a14', 'tn14'] }, ...[17, 18, 19].map(x => ({ t: 'res', pins: ['b' + x, 'tp' + (x % 6 ? x : x + 3)], ohms: 10000 }))]);
        if (pr) { rt(S.comps[0]).pr = 1; settle(); } return [17, 18, 19].map(x => LVK[lvH('e' + x)]).join(''); };
      const a = run(6, 0), b = run(6, 1), c = run(2, 1);
      rec('수동 소자', `kp44 · ${PX.kp44.title}`, a === 'HHH' && b === 'HHL' && c === 'HHH' && PX.kp44.pins.length === 8, `안 누름 C1~C3 ${a} · '6'(R2·C3) 누름 ${b} · '3'(R1) 누름 ${c}`); }
    { // 동축 RF 릴레이: 12V 코일, COM = 12V, NO → 1k → GND
      const v = on => { build([{ t: 'psu', k: 1, x: 20, y: 440, v: 12 }, { t: 'px', kind: 'rlyrf', pins: ['c5', 'c7', 'c9', 'c11', 'c13'], cv: 12 }, { t: 'wire', pins: ['@1:0', 'a9'] }, { t: 'wire', pins: ['@1:1', 'tn3'] }, { t: 'wire', pins: ['a5', on ? 'b9' : 'tn5'] }, { t: 'wire', pins: ['a7', 'tn7'] }, { t: 'res', pins: ['d13', 'd17'], ohms: 1000 }, { t: 'wire', pins: ['a17', 'tn17'] }]); settle(); return vH('e13'); };
      const a = v(1), b = v(0); rec('수동 소자', `rlyrf · ${PX.rlyrf.title}`, a > 11.9 && (b == null || b < .1), `코일 12V → NO ${a != null ? a.toFixed(2) : '?'}V · 코일 끔 → NO ${b != null ? b.toFixed(2) : '떠 있음'}`); }
    { // 이미 있는 부품에 이은 문서 이름
      const bad = Object.entries(NIDALIAS).filter(([n, o]) => { const p = pxPart('', n, n); return !p || p.t !== o.t || (o.kind && (p.kind !== o.kind || !PX[o.kind])) || (o.dk && !CAPDK[o.dk]) || (o.mat && !RESMAT[o.mat]); }).map(([n]) => n);
      const r = pxPart('', 'RES_MF_1PCT_0P125W', 'RES_MF_1PCT_0P125W 4.7k');
      rec('수동 소자', `문서 이름 → 이미 있는 부품 (${Object.keys(NIDALIAS).length}개)`, !bad.length && r.ohms === 4700 && r.mat === 'metal', bad.length ? '틀림: ' + bad.join(' ') : '저항·커패시터·트리머·비드·리드 릴레이 등 · 값도 읽음(4.7k)'); }
    // 브리지 정류기: 명세의 600V 1A 4핀 브리지는 이미 있는 brdg와 같은 부품 → 중립 이름만 달림
    rec('수동 소자', '브리지 정류기 중립 이름 (BRIDGE_RECT_600V_1A → brdg)', PX.brdg.nid === 'BRIDGE_RECT_600V_1A' && (pxPart('', 'BRIDGE_RECT_600V_1A', 'BRIDGE_RECT_600V_1A') || {}).kind === 'brdg', PX.brdg.title);
  }

  /* ───── ②-2 아날로그 IC: 연산 증폭기·비교기·레귤레이터·DAC (기대값은 회로 식으로 따로 계산) ───── */
  {
    const st = n => { for (let i = 0; i < (n || 6); i++) settle(); };
    const B = c => { build(c); st(); };
    const P12 = (v, k, x) => [{ t: 'psu', k, x, y: 440, v }];
    // 12V 전원: + 는 위·아래 + 레일, − 는 위·아래 − 레일
    const rails12 = [...P12(12, 1, 20), { t: 'wire', pins: ['@1:0', 'tp2'] }, { t: 'wire', pins: ['@1:1', 'tn3'] }, { t: 'wire', pins: ['tp4', 'bp4'] }, { t: 'wire', pins: ['tn5', 'bn5'] }];
    const dip = (k, c0) => { const n = PX[k].pins.length, h = n / 2; return { t: 'px', kind: k, pins: Array.from({ length: n }, (_, i) => i < h ? 'f' + (c0 + i) : 'e' + (c0 + n - 1 - i)) }; };
    const A_ = () => rt(S.comps.find(c => c.t === 'px')).ast || [];
    // ① 단전원 비반전 증폭(이득 2): 5V 레일, IN+ = 5 × 1k/(4k+1k) = 1V, 되먹임 10k/10k → 2V
    B([dip('oa2b', 10), { t: 'wire', pins: ['a10', 'tp10'] }, { t: 'wire', pins: ['j13', 'bn13'] },
      { t: 'res', pins: ['h12', 'h20'], ohms: 4000 }, { t: 'wire', pins: ['j20', 'bp20'] }, { t: 'res', pins: ['i12', 'i22'], ohms: 1000 }, { t: 'wire', pins: ['j22', 'bn22'] },
      { t: 'res', pins: ['g10', 'g11'], ohms: 10000 }, { t: 'res', pins: ['h11', 'h16'], ohms: 10000 }, { t: 'wire', pins: ['j16', 'bn16'] }]);
    { const v = vH('j10'); rec('아날로그 IC', `oa2b · ${PX.oa2b.title}`, v != null && near(v, 2, .02) && A_()[0].st === 'lin', `비반전 이득 2: IN+ ${vH('j12').toFixed(3)}V → 출력 ${v != null ? v.toFixed(3) : '?'}V (기대 2.000V) · ${A_()[0].st}`); }
    // ② 가상 접지 반전 증폭(이득 −2): 12V, 기준 6V(10k/10k), 입력 4V(전원 2) → 10k → IN−, 되먹임 20k → 6 + 2×(6−4) = 10V. 입력 1V면 16V → 위 끝(12 − 1.5 = 10.5V)에 붙음
    for (const [k, vin, exp, est] of [['oa2j', 4, 10, 'lin'], ['oa2j', 1, 10.5, 'hi'], ['oa2n', 4, 10, 'lin']]) {
      B([...rails12, ...P12(vin, 2, 140), dip(k, 10), { t: 'wire', pins: ['a10', 'tp10'] }, { t: 'wire', pins: ['j13', 'bn13'] },
        { t: 'res', pins: ['h12', 'h20'], ohms: 10000 }, { t: 'wire', pins: ['j20', 'bp20'] }, { t: 'res', pins: ['i12', 'i22'], ohms: 10000 }, { t: 'wire', pins: ['j22', 'bn22'] },
        { t: 'res', pins: ['h11', 'h25'], ohms: 10000 }, { t: 'wire', pins: ['@2:0', 'j25'] }, { t: 'wire', pins: ['@2:1', 'bn26'] }, { t: 'res', pins: ['g10', 'g11'], ohms: 20000 }]);
      const v = vH('j10'); rec('아날로그 IC', `${k} · ${PX[k].title}${est === 'hi' ? ' (포화)' : ''}`, v != null && near(v, exp, .03) && A_()[0].st === est, `입력 ${vin}V, 기준 6V, 이득 −2 → 출력 ${v != null ? v.toFixed(3) : '?'}V (기대 ${exp}V, ${est})`); }
    // ③ 쿼드(단전원·JFET): 1번·4번을 전압 팔로워로(OUT→IN−), IN+ 에 3V(전원 2)
    for (const k of ['oa4', 'oa4j']) {
    B([...rails12, ...P12(3, 2, 140), dip(k, 10), { t: 'wire', pins: ['j13', 'bp13'] }, { t: 'wire', pins: ['a13', 'tn13'] },
      { t: 'wire', pins: ['g10', 'g11'] }, { t: 'wire', pins: ['@2:0', 'h12'] }, { t: 'wire', pins: ['@2:1', 'bn26'] }, { t: 'wire', pins: ['b10', 'b11'] }, { t: 'wire', pins: ['c12', 'i12'] }]);
    { const v1 = vH('j10'), v4 = vH('a10'); rec('아날로그 IC', `${k} · ${PX[k].title}`, near(v1, 3, .01) && near(v4, 3, .01) && PX[k].ana.vcc === 3 && PX[k].ana.vee === 10,
      `팔로워 1번 ${v1 != null ? v1.toFixed(3) : '?'}V · 4번 ${v4 != null ? v4.toFixed(3) : '?'}V (기대 3V) · VCC 4번·VEE 11번 핀`); } }
    // ④ TO-99 정밀: 팔로워(6번 OUT → 2번 IN−), 3번 IN+ = 6V(10k/10k)
    B([...rails12, dip('oa1p', 10), { t: 'wire', pins: ['a11', 'tp11'] }, { t: 'wire', pins: ['j13', 'bn13'] }, { t: 'wire', pins: ['b12', 'h11'] },
      { t: 'res', pins: ['h12', 'h20'], ohms: 10000 }, { t: 'wire', pins: ['j20', 'bp20'] }, { t: 'res', pins: ['i12', 'i22'], ohms: 10000 }, { t: 'wire', pins: ['j22', 'bn22'] }]);
    { const v = vH('a12'); rec('아날로그 IC', `oa1p · ${PX.oa1p.title}`, near(v, 6, .01) && PX.oa1p.pins[5].startsWith('OUT') && PX.oa1p.pins[6].startsWith('V+'), `팔로워 출력 ${v != null ? v.toFixed(3) : '?'}V (기대 6V) · 핀 2 IN− 3 IN+ 4 V− 6 OUT 7 V+`); }
    // ⑤ 비교기: IN1+ = 2.5V(10k/10k), IN1− 를 5V/GND로, OUT1 풀업 10k → 5V
    { const run = hi => { B([dip('cmp2', 10), { t: 'wire', pins: ['a10', 'tp10'] }, { t: 'wire', pins: ['j13', 'bn13'] },
        { t: 'res', pins: ['h12', 'h20'], ohms: 10000 }, { t: 'wire', pins: ['j20', 'bp20'] }, { t: 'res', pins: ['i12', 'i22'], ohms: 10000 }, { t: 'wire', pins: ['j22', 'bn22'] },
        { t: 'wire', pins: ['h11', hi ? 'bp11' : 'bn11'] }, { t: 'res', pins: ['g10', 'g16'], ohms: 10000 }, { t: 'wire', pins: ['j16', 'bp16'] }]); return { v: vH('j10'), l: lvH('j10') }; };
      const a = run(1), b = run(0), c = (build([dip('cmp2', 10)]), st(), warn(/전원이 안 들어와요/));
      rec('아날로그 IC', `cmp2 · ${PX.cmp2.title}`, a.l === L && a.v < .1 && b.l === Hh && b.v > 4.9 && c, `+ 2.5V < − 5V → ${a.v.toFixed(3)}V(${LVK[a.l]}) · − 0V → ${b.v.toFixed(2)}V(${LVK[b.l]}, 풀업) · 전원 없음 경고 ${c}`); }
    // ⑥ 레귤레이터: VIN 12V, VOUT→ADJ 240Ω, ADJ→GND 720Ω → 1.25 × (1 + 720/240) = 5V. VIN 6V면 6 − 2 = 4V(전압 부족)
    for (const [vi, exp, est] of [[12, 5, 'reg'], [6, 4, 'drop']]) {
      B([...P12(vi, 1, 20), { t: 'wire', pins: ['@1:0', 'a17'] }, { t: 'wire', pins: ['@1:1', 'tn3'] }, { t: 'px', kind: 'reg317', pins: ['c15', 'c16', 'c17'] },
        { t: 'res', pins: ['d16', 'd15'], ohms: 240 }, { t: 'res', pins: ['b15', 'tn15'], ohms: 720 }, { t: 'res', pins: ['e16', 'f16'], ohms: 1000 }, { t: 'wire', pins: ['j16', 'bn16'] }, { t: 'wire', pins: ['tn7', 'bn7'] }]);
      const v = vH('a16'); rec('아날로그 IC', `reg317 · ${PX.reg317.title}${est === 'drop' ? ' (전압 부족)' : ''}`, near(v, exp, .03) && A_()[0].st === est, `VIN ${vi}V, 240Ω/720Ω → 출력 ${v != null ? v.toFixed(3) : '?'}V (기대 ${exp}V, ${est})`); }
    // ⑦ DAC(10비트): VREF = 0V, IOUT2·증폭기 IN+ = 2.5V(전원 2), IOUT1 → IN−, RFB → 증폭기 출력 ⇒ 출력 = 2.5 × (1 + 코드/1024)
    { const BH = ['f13', 'f14', 'f15', 'f16', 'f17', 'e17', 'e16', 'e15', 'e14', 'e13'];   // BIT1(MSB, 4번) … BIT10(LSB, 13번)
      const run = code => { const bit = (i, hole) => { const on = (code >> (9 - i)) & 1, up = hole[0] === 'e'; return { t: 'wire', pins: [(up ? 'a' : 'j') + hole.slice(1), (up ? (on ? 'tp' : 'tn') : (on ? 'bp' : 'bn')) + hole.slice(1)] }; };
        B([...rails12, ...P12(2.5, 2, 140), dip('dac10', 10), dip('oa2b', 30), ...BH.map((h, i) => bit(i, h)),
          { t: 'wire', pins: ['a12', 'tp7'] }, { t: 'wire', pins: ['a11', 'tn11'] }, { t: 'wire', pins: ['j12', 'bn11'] },
          { t: 'wire', pins: ['g10', 'g31'] }, { t: 'wire', pins: ['b10', 'h30'] }, { t: 'wire', pins: ['h11', 'h32'] }, { t: 'wire', pins: ['@2:0', 'i32'] }, { t: 'wire', pins: ['@2:1', 'bn35'] },
          { t: 'wire', pins: ['j33', 'bn33'] }, { t: 'wire', pins: ['a30', 'tp31'] }]);
        return { v: vH('j30'), a: A_() }; };
      const r = [0, 512, 1023, 341].map(c => ({ c, exp: 2.5 * (1 + c / 1024), ...run(c) }));
      const ok = r.every(x => x.v != null && near(x.v, x.exp, .01)) && r[1].a[0].code === 512 && PX.dac10.pins[3].startsWith('BIT1') && PX.dac10.pins[12].startsWith('BIT10') && PX.dac10.pins[13].startsWith('VDD');
      rec('아날로그 IC', `dac10 · ${PX.dac10.title}`, ok, r.map(x => `코드 ${x.c} → ${x.v != null ? x.v.toFixed(3) : '?'}V(기대 ${x.exp.toFixed(3)})`).join(' · ') + ' · 핀 4 BIT1 … 13 BIT10, 14 VDD'); }
    // ⑧ 모듈 블록·CPU: 핀 수·이름만, 계산하지 않음(오류 없이 놓임)
    for (const k of Object.keys(PX).filter(k => PX[k].blk)) { const d = PX[k];
      let ok = !!d.blk && !!d.nid && !d.ana && !d.contacts && !d.tr && !d.dio, msg = `핀 ${d.pins.length}개 · ${d.nid}`;
      if (k === 'cpu64') { const at = n => d.pins[n - 1].split(' ')[0]; ok = ok && d.pins.length === 64 && at(14) === 'VCC' && at(49) === 'VCC' && at(16) === 'GND' && at(53) === 'GND' && at(1) === 'D4' && at(5) === 'D0' && at(29) === 'A1' && at(48) === 'A20' && at(52) === 'A23' && at(54) === 'D15' && at(64) === 'D5' && at(15) === 'CLK' && at(6) === '~AS';
        msg += ` · 1 D4 · 5 D0 · 6 ~AS · 14/49 VCC · 15 CLK · 16/53 GND · 29 A1 · 52 A23 · 54 D15 · 64 D5 · 발자국 줄 간격 ${fpDef({ t: 'px', kind: k }).pads.filter(q => q.k === 0 || q.k === 63).map(q => q.y).join('/')}`; }
      rec('아날로그 IC', `${k} · ${d.title}`, ok, msg); }
    // ⑨ 발자국: TO-18·TO-39 원형, TO-3 장착 구멍 = C, TO-99 8핀 원 지름 5.08mm, DIP-64 줄 간격 22.86mm
    { const F = k => fpDef({ t: 'px', kind: k }), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), bad = [];
      for (const [k, R] of [['q2222m', 1.27], ['qp39', 2.54], ['jfn', 1.27]]) { const p = F(k).pads, c = { x: (p[0].x + p[2].x) / 2, y: (p[0].y + p[2].y) / 2 }; if (p.length !== 3 || p.some(q => Math.abs(dist(q, c) - R) > .01)) bad.push(k); }
      { const p = F('q3055').pads; if (p.filter(q => q.k === 2).length !== 2 || Math.abs(dist(p[0], p[1]) - 10.92) > .01) bad.push('q3055'); }
      { const p = F('oa1p').pads, c = { x: p.reduce((s, q) => s + q.x, 0) / 8, y: p.reduce((s, q) => s + q.y, 0) / 8 }; if (p.length !== 8 || p.some(q => Math.abs(dist(q, c) - 2.54) > .01)) bad.push('oa1p'); }
      { const p = F('cpu64').pads; if (p.length !== 64 || Math.abs(Math.abs(p[0].y - p[63].y) - 22.86) > .01) bad.push('cpu64'); }
      rec('아날로그 IC', '발자국 (TO-18·TO-39·TO-3·TO-99·DIP-64 900mil)', !bad.length, bad.length ? '틀림: ' + bad.join(' ') : '원형 지름 2.54/5.08mm · TO-3 다리 10.92mm·장착 구멍 C 2개 · TO-99 8핀 원 · DIP-64 줄 22.86mm'); }
    // ⑩ 목록 불러오기: 중립 이름(nid)도 알아들음
    { // 명세 문서의 부품 ID 전부(이미 있던 부품은 그 부품으로)
      const DOC = { CPU_16_32B_ASYNC_8MHZ: 'cpu64', DAC_10B_MULT_R2R: 'dac10', OPAMP_DUAL_JFET_25VUS: 'oa2j', OPAMP_QUAD_JFET_25VUS: 'oa4j', OPAMP_DUAL_JFET_LN_3MHZ: 'oa2n', OPAMP_SGL_EXTCOMP_20V: 'oa1p', COMP_DUAL_OC_36V: 'cmp2', REG_POS_ADJ_1P5A: 'reg317',
        BJT_NPN_PWR_60V_150W: 'q3055', BJT_NPN_SW_40V_800MA: 'q2222m', BJT_PNP_SW_40V_200MA: 'q2907m', BJT_PNP_HV_SW_80V_1W: 'qp39', BJT_NPN_SS_360MW: 'q18s', JFET_N_DEPL_TO18: 'jfn', JFET_N_DEPL_TO92: 'jfn92',
        DIODE_SW_80V_200MA_2NS: 'd914', DIODE_SCHOTTKY_SS_70V: 'd5711', DIODE_RECT_400V_750MA: 'd4004', BRIDGE_RECT_600V_1A: 'brdg',
        BLK_RF_STEP_ATTEN_22G: 'batt', BLK_YIG_OSC_2P3_6P1G: 'byto', BLK_YIG_MIXER_22G: 'bytx', BLK_RF_CONV_ACLU: 'bconv', BLK_RF_FILTERS: 'bfilt', BLK_IF_LOG_9STAGE: 'bif', BLK_REF_OSC_10MHZ: 'bref', BLK_CRT_6IN_ESTAT: 'bcrt' };
      const bad = Object.entries(DOC).filter(([n, k]) => (pxPart('', n, n) || {}).kind !== k || PX[k].nid !== n).map(([n]) => n);
      const ls = CHIPS['74LS174'] && CHIPS['74LS174'].nid === 'LOGIC_HEX_DFF_CLR_LS';
      const dup = Object.values(PX).map(d => d.nid).filter(Boolean).filter((n, i, a) => a.indexOf(n) !== i);
      rec('아날로그 IC', '명세 부품 ID 28개 → 부품 (중복 없음)', !bad.length && ls && !dup.length, bad.length || dup.length ? '틀림: ' + bad.concat(dup).join(' ') : `PX ${Object.keys(DOC).length}개 + 74LS174 · 중복 nid 없음`); }
    // 다 확인했는지
    // ⑪ 아두이노 호환 보드(브레드보드 직결형): 문서의 핀 번호(사실)·꽂는 줄(600mil c·h, 800mil b·i)·USB 전원
    {
      const NANO = { 1: 'D13', 2: '3V3', 4: 'A0', 11: 'A7', 13: 'RESET', 14: 'GND', 15: 'VIN', 16: 'D1', 17: 'D0', 19: 'GND', 20: 'D2', 30: 'D12' };
      for (const k of Object.keys(PX).filter(k => PX[k].ard)) {
        const d = PX[k], mkr = d.ard.form === 'mkr', want = mkr ? { 1: 'AREF', 2: 'A0', 9: 'D0', 24: 'RESET', 25: 'GND', 26: 'VCC', 27: 'VIN', 28: '5V' } : NANO;
        const bad = Object.entries(want).filter(([i, nm]) => d.pins[i - 1].split(' ')[0] !== nm).map(([i]) => i);
        const p12 = mkr ? '' : d.pins[11].split(' ')[0], p12ok = mkr || (d.ard.v === 5 ? p12 === '5V' : p12 === 'VUSB');
        const pins = pxHolesAt(k, 1, null, 3), rowsOk = pins && pins[0][0] === (mkr ? 'i' : 'h') && pins[pins.length - 1][0] === (mkr ? 'b' : 'c');
        build([{ t: 'px', kind: k, pins }]);
        const c = S.comps[0], i3 = d.pins.findIndex(n => /^(3V3|VCC)/.test(n)), v3 = vH(c.pins[i3]);
        const ok = d.pins.length === (mkr ? 28 : 30) && !bad.length && p12ok && rowsOk && Math.abs(v3 - 3.3) < .01 && rt(c).apw;
        rec('아두이노 호환', `${k} · ${d.title}`, ok, `핀 ${d.pins.length}개 · ${mkr ? 'b·i줄 800mil' : 'c·h줄 600mil'}${bad.length ? ' · 핀 번호 틀림 ' + bad.join(',') : ''}${p12ok ? '' : ' · 12번 ' + p12} · 3V3 ${v3}V`);
      }
      // 점퍼 연결형: 헤더 자리(D7–D8 4.064mm, 위·아래 48.26mm)
      const u = ARDX.auno3.hdr, at = nm => u.find(h => h[2].split(' ')[0] === nm);
      rec('아두이노 호환', 'auno3 헤더 · D7–D8 4.064mm, 위·아래 48.26mm, 32단자', Math.abs(at('D7')[0] - at('D8')[0] - 4.064) < 1e-6 && Math.abs(at('D0')[1] - at('A0')[1] - 48.26) < 1e-6 && u.length === 32, `${u.length}단자`);
      rec('아두이노 호환', 'amega 헤더 · 2×18(5V·D22~D53·GND), 확장 A8~A15', ARDX.amega.hdr.length === 32 + 16 + 36 && ARDX.amega.hdr.some(h => h[2] === 'D53') && ARDX.amega.hdr.some(h => h[2] === 'A15'), `${ARDX.amega.hdr.length}단자`);
    }
    const done = new Set(R.filter(r => r.grp === '수동 소자' || r.grp === '아날로그 IC' || r.grp === '아두이노 호환').map(r => r.part.split(' ')[0])); for (const k of Object.keys(PX)) if (!done.has(k)) rec('수동 소자', k, false, '확인하지 않음');
  }

  /* ───── ③ LED 표시기: 칸마다 애노드·캐소드·색·위치 ───── */
  {
    const cen = sh => { const a = [].concat(sh); let x = 0, y = 0; for (const q of a) { if (q.t === 'c') { x += q.x; y += q.y; } else if (q.t === 'r') { x += q.x + q.w / 2; y += q.y + q.h / 2; } else if (q.t === 'l') { x += (q.x1 + q.x2) / 2; y += (q.y1 + q.y2) / 2; } } return { x: x / a.length, y: y / a.length }; };
    const key = (a, k) => [].concat(a).slice().sort().join('|') + '>' + [].concat(k).slice().sort().join('|');
    const COL = { R: LCO.R, G: LCO.G, Y: LCO.Y, B: LCO.B, O: LCO.O, W: LCO.W };
    const checked = new Set();
    // exp: [{a, k, c?, tag}] — 실제 부품 규칙에서 따로 만든 기대 목록
    const checkEls = (name, exp, rules) => { checked.add(name); const d = CHIPS[name], bad = [];
      if (!d) { rec('LED 표시기', name, false, '부품이 없음'); return; }
      const act = new Map(); d.els.forEach((e, i) => { const k_ = key(e.a, e.k); if (!act.has(k_)) act.set(k_, []); act.get(k_).push({ e, i, p: cen(e.s) }); });
      const found = []; for (const x of exp) { const m = act.get(key(x.a, x.k)); if (!m || !m.length) { bad.push(`${[].concat(x.a).join('/')}→${[].concat(x.k).join('/')} 칸 없음`); continue; } const g = m.shift(); found.push({ ...x, p: g.p, e: g.e });
        if (x.c && g.e.c !== COL[x.c] && g.e.c !== 'prop') bad.push(`${[].concat(x.a).join('/')}→${[].concat(x.k).join('/')} 색 ${g.e.c}(기대 ${x.c})`); }
      const extra = [...act.values()].reduce((n, m) => n + m.length, 0); if (extra) bad.push(`핀 규칙에 없는 칸 ${extra}개`);
      // 모든 핀 이름이 실제 핀 목록에 있는가
      for (const e of d.els) for (const pn of [...[].concat(e.a), ...[].concat(e.k)]) if (!(pn in d.idx)) bad.push(`없는 핀 ${pn}`);
      if (rules && !bad.length) for (const r of [].concat(rules)) { const m = r(found); if (m) bad.push(m); }
      rec('LED 표시기', `${name} · ${d.title}`, !bad.length, bad.length ? bad.slice(0, 4).join(' / ') : `${exp.length}칸 극성·핀·색·위치 일치`); return found; };
    const incX = (f, by) => { const s_ = f.slice().sort((p, q) => by(p) - by(q)); for (let i = 1; i < s_.length; i++) if (!(s_[i].p.x > s_[i - 1].p.x + .5)) return '칸 순서가 왼쪽→오른쪽이 아님'; return ''; };
    const rng_ = n => [...Array(n).keys()];
    // 막대: k번 애노드 Ak → 캐소드 Kk, 왼쪽부터. 1번 핀과 마지막 핀(같은 칸의 A·K)은 보드에서 같은 열(위아래로 마주 봄)
    const facing = name => { const d = CHIPS[name], n = d.pins.length; return d.els.every(e => [].concat(e.a).every(a => [].concat(e.k).some(k => (d.idx[a] + d.idx[k]) === n - 1))) ? '' : '같은 칸의 애노드·캐소드 핀이 위아래로 마주 보지 않음'; };
    const bars = [['LED-BAR10', 'RRRRRRRRRR'], ['BAR10-Y', 'YYYYYYYYYY'], ['BAR10-G', 'GGGGGGGGGG'], ['BAR10-LOW', null], ['BAR5', null], ['BAR12-3C', 'GGGGYYYYRRRR'], ['BAR20', null], ['BAR10-GYR', null], ['BAR10-SYM', null]];
    for (const [nm, cols] of bars) { const n = CHIPS[nm].els.length; const f = checkEls(nm, rng_(n).map(i => ({ a: 'A' + (i + 1), k: 'K' + (i + 1), c: cols ? cols[i] : null, i })), [f => incX(f, x => x.i), () => facing(nm),
      f => { const c = f.slice().sort((p, q) => p.i - q.i).map(x => Object.keys(COL).find(k => COL[k] === x.e.c) || '?').join('');
        if (nm === 'BAR10-GYR' && !/^G+Y+R+$/.test(c)) return `색 순서 ${c} (기대 초록→노랑→빨강)`;
        if (nm === 'BAR10-SYM' && !(c === c.split('').reverse().join('') && /^R+Y+G+Y+R+$/.test(c))) return `색 ${c} (기대 가운데 초록, 양 끝 빨강, 대칭)`;
        if (!cols && !['BAR10-GYR', 'BAR10-SYM'].includes(nm) && new Set(c).size !== 1) return `한 색이 아님 ${c}`; return ''; }]); }
    checkEls('BAR10-2C', rng_(10).flatMap(i => [{ a: 'AR' + (i + 1), k: 'K' + (i + 1), c: 'R', i }, { a: 'AG' + (i + 1), k: 'K' + (i + 1), c: 'G', i }]), [f => incX(f.filter(x => x.c === 'R'), x => x.i),
      f => f.filter(x => x.c === 'R').every(r => { const g = f.find(x => x.c === 'G' && x.i === r.i); return near(g.p.x, r.p.x, 3) && near(g.p.y, r.p.y, 3); }) ? '' : '같은 칸의 빨강·초록이 같은 자리가 아님']);
    // 도트 매트릭스: 가로줄 r은 위→아래, 세로칸 c는 왼쪽→오른쪽
    const grid = (f) => { const bad = f.some(p => f.some(q => (q.r === p.r && q.cc > p.cc && !(q.p.x > p.p.x)) || (q.cc === p.cc && q.r > p.r && !(q.p.y > p.p.y)))); return bad ? '줄·칸 위치가 번호 순서와 다름' : ''; };
    const mat = (nm, rows, cols, rowAnode, colorSets) => checkEls(nm, rng_(rows).flatMap(r => rng_(cols).flatMap(cc => (colorSets || [['', null]]).map(([pre, col]) => rowAnode ? { a: 'R' + (r + 1), k: 'C' + (cc + 1), r, cc, c: col } : { a: (pre ? pre + 'C' : 'C') + (cc + 1), k: (pre ? 'W' : 'R') + (r + 1), r, cc, c: col }))), grid);
    mat('LED-8X8', 8, 8, true); mat('MAT88-CA', 8, 8, false); mat('MAT57-CA', 7, 5, false); mat('MAT57-CC', 7, 5, true); mat('MAT58-CA', 8, 5, false); mat('MAT58-CC', 8, 5, true);
    mat('MAT88-2C', 8, 8, false, [['R', 'R'], ['G', 'G']]); mat('MAT88-RGB', 8, 8, false, [['R', 'R'], ['G', 'G'], ['B', 'B']]);
    // 한 몸에 든 여러 색 LED
    const same = f => f.every(x => near(x.p.x, f[0].p.x, 3) && near(x.p.y, f[0].p.y, 3)) ? '' : '색들이 한 자리가 아님';
    checkEls('LED-RGB-CC', [['R', 'R'], ['G', 'G'], ['B', 'B']].map(([p_, c]) => ({ a: p_, k: 'K', c })), same);
    checkEls('LED-RGB-CA', [['R', 'R'], ['G', 'G'], ['B', 'B']].map(([p_, c]) => ({ a: 'A', k: p_, c })), same);
    checkEls('CBI-RGB', [['R', 'R'], ['G', 'G'], ['B', 'B']].map(([p_, c]) => ({ a: p_, k: 'K', c })), same);
    checkEls('LED-2C3-CC', [['R', 'R'], ['G', 'G']].map(([p_, c]) => ({ a: p_, k: 'K', c })), same);
    checkEls('LED-2C3-CA', [['R', 'R'], ['G', 'G']].map(([p_, c]) => ({ a: 'A', k: p_, c })), same);
    checkEls('CBI-2C', [['R', 'R'], ['G', 'G']].map(([p_, c]) => ({ a: p_, k: 'K', c })), same);
    // 다리 여러 개인 한 칸짜리(애노드 아무거나 HIGH, 캐소드 아무거나 LOW)
    for (const nm of ['LED-SFLUX', 'LBAR-W', 'LBAR-N']) checkEls(nm, [{ a: ['A1', 'A2'], k: ['K1', 'K2'] }]);
    for (const [nm, n] of [['LBAR-4', 4], ['CBI-H2', 2], ['CBI-H3', 3], ['CBI-H4', 4]]) checkEls(nm, rng_(n).map(i => ({ a: 'A' + (i + 1), k: 'K' + (i + 1), i })), f => incX(f, x => x.i));
    for (const [nm, n] of [['CBI-V2', 2], ['CBI-V3', 3]]) checkEls(nm, rng_(n).map(i => ({ a: 'A' + (i + 1), k: 'K' + (i + 1), i })), f => f.every(x => near(x.p.x, f[0].p.x, 3)) && new Set(f.map(x => Math.round(x.p.y))).size === n ? '' : '위아래로 쌓여 있지 않음');
    checkEls('CBI-V4', rng_(4).map(i => ({ a: 'A' + (i + 1), k: 'K' + (i + 1), i })), f => new Set(f.map(x => Math.round(x.p.x))).size === 2 && new Set(f.map(x => Math.round(x.p.y))).size === 2 ? '' : '2단 2줄이 아님');
    checkEls('RING16', rng_(16).map(i => ({ a: 'A' + (i + 1), k: 'K', i })), f => { const c = f.reduce((s_, x) => ({ x: s_.x + x.p.x / 16, y: s_.y + x.p.y / 16 }), { x: 0, y: 0 }), arc = f.filter(x => x.i < 15).sort((p, q) => p.i - q.i);
      const ang = arc.map(x => Math.atan2(x.p.x - c.x, -(x.p.y - c.y))); let sweep = 0; for (let i = 1; i < ang.length; i++) { let d = ang[i] - ang[i - 1]; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; if (d <= 0) return 'A1~A15가 한 방향으로 돌지 않음'; sweep += d; }
      const last = f.find(x => x.i === 15); return near(sweep * 180 / Math.PI, 270, 30) && last.p.y > c.y ? '' : `원호 ${Math.round(sweep * 180 / Math.PI)}° · A16 아래쪽 ${last.p.y > c.y}`; });
    // 숫자 표시기: 획 위치(자리 가운데 기준)와 자리 순서
    const SEGPOS = { a: (x, y) => y < -2, a1: (x, y) => y < -2 && x < 0, a2: (x, y) => y < -2 && x > 0, d: (x, y) => y > 2, d1: (x, y) => y > 2 && x < 0, d2: (x, y) => y > 2 && x > 0, g: (x, y) => Math.abs(y) < 2, g1: (x, y) => Math.abs(y) < 2 && x < 0, g2: (x, y) => Math.abs(y) < 2 && x > 0,
      b: (x, y) => x > 0 && y < 0, c: (x, y) => x > 0 && y > 0, e: (x, y) => x < 0 && y > 0, f: (x, y) => x < 0 && y < 0, dp: (x, y) => x > 0 && y > 0,
      h: (x, y) => x < 0 && y < 0, i: (x, y) => Math.abs(x) < 1.5 && y < 0, j: (x, y) => x > 0 && y < 0, k: (x, y) => x < 0 && y > 0, l: (x, y) => Math.abs(x) < 1.5 && y > 0, m: (x, y) => x > 0 && y > 0 };
    const segRule = (map) => f => { const bad = [], dg = new Map(); for (const x of f) { if (x.seg == null) continue; if (!dg.has(x.dig)) dg.set(x.dig, []); dg.get(x.dig).push(x); }
      const ds = [...dg.keys()].sort((a, b) => a - b), cx = [];
      for (const k of ds) { const L_ = dg.get(k), body = L_.filter(x => x.seg !== 'dp'), c = { x: body.reduce((s_, x) => s_ + x.p.x, 0) / body.length, y: body.reduce((s_, x) => s_ + x.p.y, 0) / body.length }; cx.push(c.x);
        for (const x of L_) { const fn = (map && map[x.seg]) || SEGPOS[x.seg]; if (fn && !fn(x.p.x - c.x, x.p.y - c.y)) bad.push(`${ds.length > 1 ? (k + 1) + '자리 ' : ''}${x.seg}획 위치`); } }
      for (let i = 1; i < cx.length; i++) if (!(cx[i] > cx[i - 1])) bad.push('자리 순서가 왼쪽→오른쪽이 아님');
      return bad.slice(0, 3).join(', '); };
    const S8 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'];
    const multi = (nm, nd, ca, extra) => checkEls(nm, [...rng_(nd).flatMap(dd => S8.map(sg => ca ? { a: 'D' + (dd + 1), k: sg, seg: sg, dig: dd } : { a: sg, k: 'D' + (dd + 1), seg: sg, dig: dd })), ...(extra || [])], segRule());
    multi('SEG7-2D-CC', 2, false); multi('SEG7-4D-CC', 4, false); multi('SEG7-4D-CA', 4, true); multi('SEG7-BUBBLE', 4, false);
    multi('SEG7-4D-CLK', 4, false, rng_(CHIPS['SEG7-4D-CLK'].els.filter(e => [].concat(e.a).includes('L+')).length).map(() => ({ a: 'L+', k: 'L-' })));
    checkEls('SEG7-BIG-CA', S8.map(sg => ({ a: ['A1', 'A2'], k: sg, seg: sg, dig: 0 })), [segRule(), f => f.every(x => (x.seg === 'dp' ? near(x.e.minV || 0, 3.7, .5) : near(x.e.minV || 0, 7.4, .8))) ? '' : '켜지는 전압(획 약 7.4V, 소수점 약 3.7V)이 다름']);
    checkEls('SEG9-CC', [...S8, 'h', 'i'].map(sg => ({ a: sg, k: 'COM', seg: sg, dig: 0 })), segRule({ h: (x, y) => x < 0 && y < 0, i: (x, y) => x > 0 && y > 0 }));
    checkEls('SEG14-CC', ['a', 'b', 'c', 'd', 'e', 'f', 'g1', 'g2', 'h', 'i', 'j', 'k', 'l', 'm', 'dp'].map(sg => ({ a: sg, k: 'COM', seg: sg, dig: 0 })), segRule());
    checkEls('SEG16-CC', ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f', 'g1', 'g2', 'h', 'i', 'j', 'k', 'l', 'm', 'dp'].map(sg => ({ a: sg, k: 'COM', seg: sg, dig: 0 })), segRule());
    checkEls('SEG-PM1', ['M', 'P', 'ONE', 'DP'].map(sg => ({ a: 'A', k: sg, sg })), f => { const g = n => f.find(x => x.sg === n), M = g('M').e.s, P = g('P').e.s, O = g('ONE').e.s;
      const hz = q => [].concat(q).every(l => l.t === 'l' && near(l.y1, l.y2, .5)), vt = q => [].concat(q).every(l => l.t === 'l' && near(l.x1, l.x2, .5));
      return hz(M) && vt(P) && vt(O) && near(g('P').p.x, g('M').p.x, 2) && g('ONE').p.x > g('P').p.x ? '' : 'M 가로·P 세로(가운데)·ONE 세로(오른쪽) 모양이 아님'; });
    // 아직 안 본 LED 표시기(칩 없는 것)
    for (const nm of Object.keys(CHIPS)) { const d = CHIPS[nm]; if (d.disp === 'gen' && !d.look && !checked.has(nm)) rec('LED 표시기', nm, false, '확인하지 않음'); }
  }

  /* ───── ④ 칩이 든 표시기·드라이버: 실제 칩처럼 신호를 넣는다 ───── */
  {
    const G = '칩 표시기·드라이버', done4 = new Set();
    const chip = name => { const d = CHIPS[name], st = d.init ? d.init() : {}, lv = {}; let out = {};
      const g = n => { if (!(n in d.idx)) throw new Error(name + ': 없는 핀 ' + n); return lv[n] === undefined ? L : lv[n]; };
      const set = o => { Object.assign(lv, o || {}); out = d.eval ? d.eval(g, st) || {} : {}; return out; };
      return { d, st, lv, set, g, get out() { return out; } }; };
    const ok4 = (name, ok, msg) => { done4.add(name); rec(G, `${name} · ${CHIPS[name].title}`, ok, msg); };
    const bits = (v, names) => Object.fromEntries(names.map((n, i) => [n, (v >> i) & 1 ? Hh : L]));
    const segsOn = (d, lit, names) => names.filter((n, i) => lit[i]).join('');
    // 16진 표시기: 표준 16진 글꼴(0~9, A b C d E F), BL 끄기, ~LE 붙잡기
    { const FONT = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg', 'abcefg', 'cdefg', 'adef', 'bcdeg', 'adefg', 'aefg'];
      const c = chip('HEX-DISP'), bad = [];
      for (let v = 0; v < 16; v++) { c.set({ ...bits(v, ['D1', 'D2', 'D4', 'D8']), '~LE': L, BL: L }); const got = segsOn(c.d, c.d.look(c.st).lit, 'abcdefg'.split('')); if (got !== FONT[v]) bad.push(`${v.toString(16)}: ${got}`); }
      c.set({ BL: Hh }); const blank = !c.d.look(c.st).lit.some(Boolean); c.set({ BL: L, ...bits(3, ['D1', 'D2', 'D4', 'D8']) }); c.set({ '~LE': Hh }); c.set(bits(5, ['D1', 'D2', 'D4', 'D8'])); const held = segsOn(c.d, c.d.look(c.st).lit, 'abcdefg'.split('')) === FONT[3];
      ok4('HEX-DISP', !bad.length && blank && held, bad.length ? bad.join(' ') : `0~F 표준 16진 글꼴 · BL HIGH 꺼짐 ${blank} · ~LE HIGH 붙잡기 ${held}`); }
    // 스마트 LED: 전원이 들어오면 켜지고 DIN이 DOUT으로 넘어감(신호 타이밍은 흉내 내지 않는다고 설명에 적힘)
    for (const nm of ['LED-SMART', 'MAT88-SMART']) { const c = chip(nm); const o1 = c.set({ DIN: Hh }), o0 = c.set({ DIN: L });
      const on = c.d.look(c.st, { pat: 'heart' }, null, true).lit.some(Boolean), off = !c.d.look(c.st, { pat: 'heart' }, null, false).lit.some(Boolean);
      const pass = nm === 'MAT88-SMART' ? on && off : on && off && o1.DOUT === Hh && o0.DOUT === L;
      ok4(nm, pass, `전원 켜면 점등 ${on} · 전원 없으면 꺼짐 ${off}${nm === 'LED-SMART' ? ` · DIN→DOUT ${LVK[o1.DOUT]}/${LVK[o0.DOUT]}` : ''} (직렬 색 신호는 단순화 — 설명에 적힘)`); }
    // 4자리 ASCII(병렬): 자리 A1A0에 글자 코드를 놓고 ~WR LOW
    { const c = chip('ASC4-16'); const D = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'];
      'HI!7'.split('').forEach((ch, i) => { c.set({ ...bits(ch.charCodeAt(0), D), ...bits(i, ['A0', 'A1']), '~WR': Hh }); c.set({ '~WR': L }); c.set({ '~WR': Hh }); });
      c.set({ ...bits(66, D), A0: L, A1: L }); const txt = c.d.look(c.st).txt;
      ok4('ASC4-16', txt === 'HI!7', `자리 0~3에 'H','I','!','7' → "${txt}" · ~WR가 HIGH일 때 바뀐 입력은 무시 ${txt[0] === 'H'} (실제 비슷한 부품은 0번 자리가 오른쪽인 경우가 많음 — 이 부품은 설명대로 왼쪽이 0)`); }
    // 8자리 버스형: ~CE·~WR LOW로 쓰기, A3 HIGH = 제어(비트7 지우기, 비트3 끄기, 0~2 밝기), ~RST
    { const c = chip('ASC8-BUS'); const D = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'], base = { '~RST': Hh, '~CE': Hh, '~WR': Hh };
      const wr = (addr, v) => { c.set({ ...base, ...bits(v, D), ...bits(addr, ['A0', 'A1', 'A2', 'A3']) }); c.set({ '~CE': L, '~WR': L }); c.set({ '~CE': Hh, '~WR': Hh }); };
      'BREAD'.split('').forEach((ch, i) => wr(i, ch.charCodeAt(0))); const t1 = c.d.look(c.st).txt; wr(8, 3); const br = c.d.look(c.st).br; wr(8, 8); const t2 = c.d.look(c.st).txt; wr(8, 0x80); const t3 = c.d.look(c.st).txt;
      wr(0, 65); c.set({ '~RST': L }); const t4 = c.d.look(c.st).txt;
      ok4('ASC8-BUS', t1 === 'BREAD   ' && t2 === '' && t3.trim() === '' && t4.trim() === '' && near(br, 1 - 3 / 8, .01), `쓰기 "${t1}" · 밝기 3 → ${br} · 끄기 비트 → 빈 화면 · 지우기 비트·~RST → 지워짐`); }
    // 점 표시기(직렬 28비트): 처음 넣은 비트가 왼쪽 자리 맨 윗줄, COL이 HIGH인 세로칸만, DOUT으로 밀려 나감
    { const c = chip('DOT4-SER'); const clk = v => { c.set({ DATA: v ? Hh : L, CLK: L }); c.set({ CLK: Hh }); };
      clk(1); for (let i = 0; i < 27; i++) clk(0);
      const lit = c.d.look(c.st, null, n => c.lv[n] === undefined ? L : c.lv[n]); c.lv.COL1 = Hh; const l1 = c.d.look(c.st, null, n => c.lv[n] === undefined ? L : c.lv[n]).lit; c.lv.COL1 = L;
      const idx = l1.map((x, i) => x ? i : -1).filter(i => i >= 0), p = idx.map(i => [].concat(c.d.els[i].s)[0]), ps = c.d.els.map(e => [].concat(e.s)[0]);
      const leftTop = p.length === 1 && ps.every(q => q.x >= p[0].x - .01 || q.y > p[0].y) && ps.filter(q => near(q.x, p[0].x, .01)).every(q => q.y >= p[0].y - .01);
      const none = !lit.lit.some(Boolean); const dout = c.out.DOUT;
      ok4('DOT4-SER', leftTop && none && dout === Hh, `첫 비트 → 왼쪽 자리 맨 위 점(COL1) ${leftTop} · COL 모두 LOW면 꺼짐 ${none} · 28번째 클럭(마지막 단)에서 DOUT으로 나옴 ${LVK[dout]}`); }
    // 달링턴 싱크(ULN2803형): IN HIGH → OUT LOW(전류 빨아들임), LOW → 끊김. 1번 IN ↔ 18번 OUT
    { const c = chip('DRV-SINK8'), bad = []; for (let i = 1; i <= 8; i++) { const o = c.set({ ['IN' + i]: Hh }); if (o['OUT' + i] !== L) bad.push('OUT' + i); const o2 = c.set({ ['IN' + i]: L }); if (o2['OUT' + i] !== Z) bad.push('OUT' + i + '끊김'); }
      const pinOK = c.d.idx.IN1 === 0 && c.d.idx.OUT1 === 17 && c.d.idx.GND === 8 && c.d.idx.COM === 9;
      ok4('DRV-SINK8', !bad.length && pinOK, `IN HIGH → OUT LOW, IN LOW → 끊김(오픈 컬렉터) · 핀 1~8 IN, 9 GND, 10 COM, 11~18 OUT8~1 ${pinOK}`); }
    { const c = chip('DRV-SRC8'), bad = []; for (let i = 1; i <= 8; i++) { const o = c.set({ ['IN' + i]: Hh }); if (o['OUT' + i] !== Hh) bad.push('OUT' + i); c.set({ ['IN' + i]: L }); }
      const pinOK = c.d.idx.IN1 === 0 && c.d.idx.OUT1 === 17 && c.d.idx.VS === 8 && c.d.idx.GND === 9;
      ok4('DRV-SRC8', !bad.length && pinOK, `IN HIGH → OUT이 VS 쪽(HIGH), LOW → 끊김 · 핀 1~8 IN, 9 VS, 10 GND, 11~18 OUT8~1 ${pinOK}`); }
    // 전력 시프트 레지스터(TPIC6B595형): SRCK↑에 SER가 0번 단으로 들어가 밀림, RCK↑에 출력으로, 1인 비트가 LOW(오픈 드레인), ~G HIGH면 모두 끊김, ~SRCLR LOW면 레지스터 지움, SEROUT = 7번 단
    { const c = chip('DRV-PSR8'); const base = { '~SRCLR': Hh, '~G': L, RCK: L, SRCK: L };
      const sh = b => { c.set({ ...base, SER: b ? Hh : L, SRCK: L }); c.set({ SRCK: Hh }); }; const pat = [1, 0, 1, 1, 0, 0, 1, 0];
      c.set(base); pat.forEach(sh); const before = c.set({ SRCK: L }); c.set({ RCK: Hh }); const o = c.set({ RCK: L });
      const got = [...Array(8).keys()].map(i => o['D' + i] === L ? 1 : o['D' + i] === Z ? 0 : '?').join(''), exp = pat.slice().reverse().join('');
      const noLatch = [...Array(8).keys()].every(i => before['D' + i] === Z), so = o.SEROUT === (pat[0] ? Hh : L);
      const off = c.set({ '~G': Hh }); const allZ = [...Array(8).keys()].every(i => off['D' + i] === Z); c.set({ '~G': L, '~SRCLR': L }); c.set({ '~SRCLR': Hh, RCK: Hh }); const clr = c.set({ RCK: L });
      const cleared = [...Array(8).keys()].every(i => clr['D' + i] === Z);
      ok4('DRV-PSR8', got === exp && noLatch && so && allZ && cleared, `8비트 ${pat.join('')} 넣고 RCK → D0~D7 ${got}(기대 ${exp}, 첫 비트가 D7) · RCK 전엔 안 바뀜 ${noLatch} · SEROUT ${so} · ~G HIGH 끊김 ${allZ} · ~SRCLR 지움 ${cleared}`); }
    // ASCII → 14/16세그먼트 해독(CD4511 같은 역할): 글자별로 켜질 획
    for (const [nm, exp] of [['DRV-14SEG', { A: 'abcefg1g2', H: 'bcefg1g2', '-': 'g1g2', E: 'adefg1', '1': 'bc', T: 'ail' }], ['DRV-16SEG', { A: 'a1a2bcefg1g2', H: 'bcefg1g2', '-': 'g1g2', E: 'a1a2d1d2efg1', '1': 'bc', T: 'a1a2il' }]]) {
      const c = chip(nm), D = ['D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'], SN = nm === 'DRV-16SEG' ? ['a1', 'a2', 'b', 'c', 'd1', 'd2', 'e', 'f', 'g1', 'g2', 'h', 'i', 'j', 'k', 'l', 'm'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g1', 'g2', 'h', 'i', 'j', 'k', 'l', 'm'];
      const on = o => SN.filter(sg => o[sg] === Hh); const norm = s_ => (s_.match(/[a-m]\d?/g) || []).sort().join(' '); const bad = [];
      for (const [ch, want] of Object.entries(exp)) { const o = c.set({ ...bits(ch.charCodeAt(0), D), '~LE': L, BL: L, DPI: L }); if (norm(on(o).join('')) !== norm(want) && !(ch === '1' && norm(on(o).join('')) === norm('bcj'))) bad.push(`'${ch}': ${on(o).join('')} (기대 ${want})`); }
      const lo = c.set({ ...bits('a'.charCodeAt(0), D) }), up = c.set({ ...bits('A'.charCodeAt(0), D) }); const lower = on(lo).join() === on(up).join();
      const bl = c.set({ BL: Hh }); const blank = SN.every(sg => bl[sg] !== Hh); c.set({ BL: L, ...bits(72, D) }); c.set({ '~LE': Hh }); const held = c.set({ ...bits(45, D) }); const latch = norm(on(held).join('')) === norm(exp.H); const dp = c.set({ '~LE': L, DPI: Hh }).DP === Hh;
      ok4(nm, !bad.length && lower && blank && latch && dp, bad.length ? bad.join(' / ') : `A·H·E·T·1(위 대각선 깃발 포함 글꼴)·- 글자 획 일치 · 소문자=대문자 ${lower} · BL 꺼짐 ${blank} · ~LE 붙잡기 ${latch} · DPI→DP ${dp}`); }
    // 멀티플렉싱 드라이버: 시간을 흘리며 자리마다 켜진 획을 모은다
    const scan = (c, n, dt, pick) => { const seen = new Map(); for (let i = 0; i < n; i++) { simBase += dt; const o = c.set({}); const r = pick(o); if (r) seen.set(r[0], r[1]); } return seen; };
    // 8자리 직렬 3선(MAX7219형): 16비트(주소 4 + 값 8, 앞 비트 먼저), LOAD↑ 저장, 처음엔 꺼짐(주소 12), 자리 LOW·획 HIGH
    { const c = chip('DRV-SER8'); const send = w => { for (let i = 15; i >= 0; i--) { c.set({ DIN: (w >> i) & 1 ? Hh : L, CLK: L }); c.set({ CLK: Hh }); } c.set({ CLK: L, LOAD: L }); c.set({ LOAD: Hh }); c.set({ LOAD: L }); };
      const SEGN = ['DP', 'A', 'B', 'C', 'D', 'E', 'F', 'G'], pick = o => { const k = [...Array(8).keys()].find(k => o['DIG' + k] === L); return k == null ? null : [k, SEGN.filter(s_ => o['SEG' + s_] === Hh).join('')]; };
      c.set({ CLK: L, LOAD: L }); send(0x0130); const pre = scan(c, 50, .02, pick); send(0x0C01); send(0x0B07); send(0x0900); send(0x0130); send(0x0277); const raw = scan(c, 80, .02, pick);
      send(0x09FF); send(0x0103); send(0x028A); const dec = scan(c, 80, .02, pick); send(0x0F01); const test = scan(c, 80, .02, pick);
      const r1 = raw.get(0) === 'BC' && raw.get(1) === 'ABCEFG', r2 = dec.get(0) === 'ABCDG' && dec.get(1) === 'DPG', r3 = [...test.values()].every(v => v === 'DPABCDEFG') && test.size === 8;
      ok4('DRV-SER8', !pre.size && r1 && r2 && r3, `처음엔 꺼짐 ${!pre.size} · 직접 값 0x30→${raw.get(0)}, 0x77→${raw.get(1)} · 숫자 해독 3→${dec.get(0)}, 0x8A(−와 DP)→${dec.get(1)} · 시험 점등 8자리 전부 ${r3}`); }
    // 6자리 2선(TM1637형): 시작(CLK HIGH에서 DIO↓)·끝(DIO↑), 낮은 비트 먼저, 9번째 클럭에 DIO LOW 응답. 공통 애노드: 자리 HIGH·획 LOW
    { const c = chip('DRV-2W6'); let acks = 0; const st_ = () => { c.set({ CLK: Hh, DIO: Hh }); c.set({ DIO: L }); }, sp = () => { c.set({ CLK: L, DIO: L }); c.set({ CLK: Hh }); c.set({ DIO: Hh }); };
      const byte = b => { for (let i = 0; i < 8; i++) { c.set({ CLK: L }); c.set({ DIO: (b >> i) & 1 ? Hh : L }); c.set({ CLK: Hh }); } const o = c.set({ CLK: L, DIO: Hh }); if (o.DIO === L) acks++; c.set({ CLK: Hh }); c.set({ CLK: L }); };
      const SG = [1, 2, 3, 4, 5, 6, 7, 8], pick = o => { const k = [1, 2, 3, 4, 5, 6].find(k => o['GR' + k] === Hh); return k == null ? null : [k, SG.filter(i => o['SG' + i] === L).join('')]; };
      c.set({ CLK: Hh, DIO: Hh }); st_(); byte(0x40); sp(); st_(); byte(0xC0); byte(0x06); byte(0x5B); sp(); const pre = scan(c, 40, .02, pick); st_(); byte(0x8F); sp(); const on = scan(c, 80, .02, pick);
      ok4('DRV-2W6', acks === 5 && !pre.size && on.get(1) === '23' && on.get(2) === '12457', `응답(ACK) ${acks}/5 · 켜기 명령 전엔 꺼짐 ${!pre.size} · 1자리 0x06 → SG${on.get(1)} · 2자리 0x5B → SG${on.get(2)} (낮은 비트가 SG1)`); }
    // 8자리 3선(TM1638형): STB LOW 동안 CLK↑에 낮은 비트 먼저, 짝수 주소 = 자리의 SG1~8. 공통 캐소드: 자리 LOW·획 HIGH
    { const c = chip('DRV-3W8'); const cmd = (...bs) => { c.set({ STB: L }); for (const b of bs) for (let i = 0; i < 8; i++) { c.set({ CLK: L, DIO: (b >> i) & 1 ? Hh : L }); c.set({ CLK: Hh }); } c.set({ STB: Hh, CLK: Hh }); };
      const pick = o => { const k = [1, 2, 3, 4, 5, 6, 7, 8].find(k => o['GR' + k] === L); return k == null ? null : [k, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(i => o['SG' + i] === Hh).join(',')]; };
      c.set({ STB: Hh, CLK: Hh }); cmd(0x40); cmd(0xC0, 0x3F, 0x00, 0x06, 0x00); const pre = scan(c, 40, .02, pick); cmd(0x8F); const on = scan(c, 80, .02, pick);
      ok4('DRV-3W8', !pre.size && on.get(1) === '1,2,3,4,5,6' && on.get(2) === '2,3', `켜기 전 꺼짐 ${!pre.size} · 1자리 0x3F → SG${on.get(1)} · 2자리 0x06 → SG${on.get(2)}`); }
    // I2C 16×8(HT16K33형): 주소 0x70+A2A1A0, 높은 비트 먼저, 바이트마다 응답, 0x21 발진·0x81 켜기, RAM 2n = COMn의 ROW0~7, 2n+1 = ROW8~15. COM LOW·ROW HIGH
    { const c = chip('DRV-I2C'); let acks = 0; const st_ = () => { c.set({ SCL: Hh, SDA: Hh }); c.set({ SDA: L }); }, sp = () => { c.set({ SCL: L, SDA: L }); c.set({ SCL: Hh }); c.set({ SDA: Hh }); };
      const byte = b => { for (let i = 7; i >= 0; i--) { c.set({ SCL: L }); c.set({ SDA: (b >> i) & 1 ? Hh : L }); c.set({ SCL: Hh }); } const o = c.set({ SCL: L, SDA: Hh }); if (o.SDA === L) acks++; c.set({ SCL: Hh }); c.set({ SCL: L }); };
      const pick = o => { const k = [...Array(8).keys()].find(k => o['COM' + k] === L); return k == null ? null : [k, [...Array(16).keys()].filter(i => o['ROW' + i] === Hh).join(',')]; };
      c.set({ SCL: Hh, SDA: Hh, A0: L, A1: L, A2: L }); st_(); byte(0xE0); byte(0x21); sp(); st_(); byte(0xE0); byte(0x00); byte(0x81); byte(0x01); byte(0x00); byte(0xF0); sp(); const pre = scan(c, 40, .02, pick);
      st_(); byte(0xE0); byte(0x81); sp(); const on = scan(c, 80, .02, pick); const other = (() => { const c2 = chip('DRV-I2C'); c2.set({ SCL: Hh, SDA: Hh, A0: Hh }); let a = 0; c2.set({ SDA: L }); for (let i = 7; i >= 0; i--) { c2.set({ SCL: L }); c2.set({ SDA: (0xE0 >> i) & 1 ? Hh : L }); c2.set({ SCL: Hh }); } if (c2.set({ SCL: L, SDA: Hh }).SDA === L) a++; return a; })();
      ok4('DRV-I2C', acks === 10 && !pre.size && on.get(0) === '0,7,8' && on.get(1) === '12,13,14,15' && other === 0, `응답 ${acks}/10 · 켜기 전 꺼짐 ${!pre.size} · COM0 → ROW${on.get(0)} · COM1 → ROW${on.get(1)} · 다른 주소(A0=1)는 응답 안 함 ${other === 0}`); }
    for (const nm of Object.keys(CHIPS)) { const d = CHIPS[nm]; if ((d.disp && d.look) || /^DRV-/.test(nm)) if (!done4.has(nm)) rec(G, nm, false, '확인하지 않음'); }
  }
  return R;
}

(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + FILE); await p.waitForTimeout(800);
  let R; try { R = await p.evaluate(inPage); } catch (e) { console.error('harness error', e.message); await b.close(); process.exit(2); }
  let grp = '', fail = 0;
  for (const r of R) { if (r.grp !== grp) { grp = r.grp; console.log('\n── ' + grp); } if (!r.ok) fail++; if (!r.ok || VERBOSE) console.log((r.ok ? 'PASS  ' : 'FAIL  ') + r.part + (r.msg ? '  — ' + r.msg : '')); }
  console.log(`\n부품 ${R.length}개 확인: 통과 ${R.length - fail}, 불일치 ${fail}` + (errs.length ? ` · 페이지 오류 ${errs.length}: ${errs[0]}` : ''));
  await b.close(); process.exit(fail || errs.length ? 1 : 0);
})();
