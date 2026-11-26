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
      for (let s = 0; s < n; s++)cases.push([`${s + 1}단`, { s }, null, [...Array(poles).keys()].map(p => `C${p + 1}-${L_[p]}${s + 1}`)]); check(k, cases); }
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
    // 인덕터·비드: 직류로 이어짐(thru), 리액턴스 계산용 값, 색띠(µH)
    for (const k of ['inda', 'indr', 'indt', 'bead']) { const d = PX[k], ok = d.thru && d.pins.length === 2 && (k === 'bead' || d.init().henry > 0);
      rec('수동 소자', `${k} · ${d.title}`, ok, ok ? '직류에서 1-2 이어짐' + (k !== 'bead' ? ` · 기본 ${henTx(d.init().henry)}` : '') : '정의 확인'); }
    { const t = [[1e-4, [1, 0, 1]], [4.7e-5, [4, 7, 0]], [1e-6, [1, 0, -1]], [2.2e-3, [2, 2, 2]]], bad = t.filter(([L_, e]) => indBands(L_).join() !== [BANDC[e[0]], BANDC[e[1]], e[2] < 0 ? '#C9A227' : BANDC[e[2]]].join());
      rec('수동 소자', '인덕터 색띠 (µH)', !bad.length, bad.length ? bad.map(x => henTx(x[0])).join(' ') : '100µH 갈검갈 · 47µH 노보검 · 1µH 갈검금 · 2.2mH 빨빨빨'); }
    // 다 확인했는지
    const done = new Set(R.filter(r => r.grp === '수동 소자').map(r => r.part.split(' ')[0])); for (const k of Object.keys(PX)) if (!done.has(k)) rec('수동 소자', k, false, '확인하지 않음');
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
