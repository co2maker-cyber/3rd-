#!/usr/bin/env node
/* verify74.js — independent datasheet check of every IC model in breadboard/index.html
 *
 *   node verify74.js [-v] [path/to/index.html]      (-v lists every sub-test, also for passing chips)
 *
 * READ-ONLY: the page is only loaded and CHIPS[*].eval is called directly; nothing is written.
 * Every test addresses the chip by DIP PIN NUMBER (taken from the datasheet), never by the
 * simulator's pin names, so a pin placed on the wrong number shows up as a functional failure
 * as well as a pinout failure. Reference models are written from the datasheet function tables.
 *
 * Exit code: 0 = all chips pass, 1 = at least one failure, 2 = harness error.
 * Env VERIFY74_LENIENT=1 downgrades sub-tests tagged "edge" (datasheet-defined behaviour that is
 * only reachable in unusual use: illegal counter states, the RBO output) to warnings.
 */
const { chromium } = require('playwright');
const path = require('path');
const ARGS = process.argv.slice(2), VERBOSE = ARGS.includes('-v');
const FILE = path.resolve(ARGS.find(a => !a.startsWith('-')) || path.join(__dirname,'..','index.html'));
const LENIENT = !!process.env.VERIFY74_LENIENT;

/* ───────────────────────── runs inside the page ───────────────────────── */
function inPage() {
  const ANY = -1;
  const LV = v => v === ANY ? '?' : Array.isArray(v) ? v.map(LV).join('|') : (['L', 'H', 'X', 'Z', 'S'][v] ?? String(v));
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const bit = (n, k) => (n >> k) & 1;

  /* eval wrapper: inputs/outputs keyed by pin number (1-based) */
  const mkEv = d => (inp, st, volts) => {
    const g = nm => { const i = d.idx[nm]; if (i === undefined) throw new Error(`eval() read a pin name that is not in pins[]: "${nm}"`); const v = inp[i + 1]; return v === undefined ? (d.ttl ? Hh : X) : v; };
    const va = volts ? (nm => { const v = volts[d.idx[nm] + 1]; return v === undefined ? null : v; }) : undefined;
    const o = d.eval(g, st, va) || {}, out = {};
    for (const k of Object.keys(o)) { if (!(k in d.idx)) throw new Error(`eval() returned a pin name that is not in pins[]: "${k}"`); out[d.idx[k] + 1] = o[k]; }
    return out;
  };
  const pinLabel = (d, p) => `${p}(${d.pins[p - 1]})`;
  const fmt = (d, o, pins) => pins.map(p => `${pinLabel(d, p)}=${LV(p in o ? o[p] : Z)}`).join(' ');
  const cmp = (exp, got, pins) => pins.filter(p => { const e = p in exp ? exp[p] : Z, g = p in got ? got[p] : Z; return e === ANY ? false : Array.isArray(e) ? !e.includes(g) : e !== g; });

  /* exhaustive combinational test (+ single-X soundness notes) */
  function comb(T, fail, inPins, ref, opt = {}) {
    const d = T.d, check = opt.check || T.sig;
    const n = inPins.length; let unsound = 0;
    for (let m = 0; m < (1 << n); m++) {
      const inp = {}; inPins.forEach((p, i) => inp[p] = bit(m, i));
      if (opt.fixed) Object.assign(inp, opt.fixed);
      const exp = ref(inp), got = T.ev(inp, d.init ? d.init() : {});
      const bad = cmp(exp, got, check);
      if (bad.length) fail(`in: ${fmt(d, inp, inPins)}  expected ${fmt(d, exp, bad)}  got ${fmt(d, got, bad)}`);
      if (opt.noX) continue;
      for (let i = 0; i < n; i++) {           // one input unknown
        const p = inPins[i], a = { ...inp, [p]: 0 }, b = { ...inp, [p]: 1 }, x = { ...inp, [p]: X };
        const ea = ref(a), eb = ref(b), gx = T.ev(x, d.init ? d.init() : {});
        for (const q of check) {
          const va = q in ea ? ea[q] : Z, vb = q in eb ? eb[q] : Z, vg = q in gx ? gx[q] : Z;
          if (va === ANY || vb === ANY || Array.isArray(va) || Array.isArray(vb)) continue;
          const ok = va === vb ? (vg === va || vg === X) : vg === X;
          if (!ok && unsound++ < 2) T.note(`X-propagation: with ${pinLabel(d, p)}=X and ${fmt(d, inp, inPins.filter(z => z !== p))}, output ${pinLabel(d, q)} could be ${LV(va)} or ${LV(vb)} but the model returns ${LV(vg)}`);
        }
      }
    }
    if (unsound > 2) T.note(`X-propagation: ${unsound} such cases in total`);
  }

  /* randomized sequential test: one input changes per step, fresh init() per run */
  function seq(T, fail, spec) {
    const d = T.d, pins = Object.keys(spec.inputs).map(Number), check = spec.check || T.sig;
    const uniform = {}; for (const p of pins) uniform[p] = [1, spec.inputs[p][1] === 'T' ? 'T' : 0.5];
    const rnd = rng(spec.seed || 12345);
    for (const prof of [spec.inputs, uniform]) for (let run = 0; run < (spec.runs || 30); run++) {
      const st = d.init ? d.init() : {}, ref = spec.ref(); let inp = {};
      for (let t = 0; ; t++) { for (const p of pins) { const pr = prof[p][1]; inp[p] = rnd() < (pr === 'T' ? 0.5 : pr) ? 1 : 0; } if (!spec.allow || spec.allow(inp)) break; if (t > 5000) throw new Error('cannot build an initial vector'); }
      const hist = ['power-on'];
      const step = () => {
        const exp = ref(inp), got = T.ev(inp, st), bad = cmp(exp, got, check);
        if (bad.length) { fail(`after [… ${hist.slice(-7).join(', ')}] with inputs ${fmt(d, inp, pins)}: expected ${fmt(d, exp, bad)}  got ${fmt(d, got, bad)}`); return false; }
        const again = T.ev(inp, st), diff = check.filter(p => (again[p] ?? Z) !== (got[p] ?? Z));
        if (diff.length) { fail(`eval() is not idempotent (2nd call with unchanged inputs changed ${fmt(d, again, diff)}) after [… ${hist.slice(-5).join(', ')}]`); return false; }
        return true;
      };
      if (!step()) continue;
      const wsum = pins.reduce((s, p) => s + prof[p][0], 0);
      for (let s = 0; s < (spec.steps || 2500); s++) {
        let r = rnd() * wsum, pin = pins[pins.length - 1]; for (const p of pins) { r -= prof[p][0]; if (r < 0) { pin = p; break; } }
        const pr = prof[pin][1], nv = pr === 'T' ? 1 - inp[pin] : (rnd() < pr ? 1 : 0);
        if (nv === inp[pin]) continue;
        const cand = { ...inp, [pin]: nv }; if (spec.allow && !spec.allow(cand)) continue;
        hist.push(`${d.pins[pin - 1]}:${inp[pin]}→${nv}`); inp = cand;
        if (!step()) break;
      }
    }
  }

  /* ───────────── reference definitions (datasheet pinouts + function tables) ───────────── */
  const REF = {};
  // pins: datasheet function per pin number; "a|b" lists accepted spellings, "~" = active-low
  const add = (names, r) => { r.pins = r.pins.split(' '); for (const n of names) REF[n] = r; };
  const both = n => ['74HC' + n, '74LS' + n];

  // ── gates ──
  const AND_ = a => +a.every(v => v), OR_ = a => +a.some(v => v);
  const gateChip = (names, pins, groups, fn, label) => add(names, {
    pins, vcc: 14, gnd: 7, outs: groups.map(g => g[1]),
    test(T) {
      T.sub(`truth table (${label})`, 'core', fail => comb(T, fail, groups.flatMap(g => g[0]), inp => { const e = {}; for (const [ins, out] of groups) e[out] = fn(ins.map(p => inp[p])); return e; }));
    }
  });
  const P00 = '1A 1B 1Y 2A 2B 2Y GND 3Y 3A 3B 4Y 4A 4B VCC', G00 = [[[1, 2], 3], [[4, 5], 6], [[9, 10], 8], [[12, 13], 11]];
  const P02 = '1Y 1A 1B 2Y 2A 2B GND 3A 3B 3Y 4A 4B 4Y VCC', G02 = [[[2, 3], 1], [[5, 6], 4], [[8, 9], 10], [[11, 12], 13]];
  const P04 = '1A 1Y 2A 2Y 3A 3Y GND 4Y 4A 5Y 5A 6Y 6A VCC', G04 = [[[1], 2], [[3], 4], [[5], 6], [[9], 8], [[11], 10], [[13], 12]];
  const P10 = '1A 1B 2A 2B 2C 2Y GND 3Y 3A 3B 3C 1Y 1C VCC', G10 = [[[1, 2, 13], 12], [[3, 4, 5], 6], [[9, 10, 11], 8]];
  const P20 = '1A 1B NC 1C 1D 1Y GND 2Y 2A 2B NC 2C 2D VCC', G20 = [[[1, 2, 4, 5], 6], [[9, 10, 12, 13], 8]];
  const P30 = 'A B C D E F GND Y NC NC G H NC VCC', G30 = [[[1, 2, 3, 4, 5, 6, 11, 12], 8]];
  gateChip(both('00'), P00, G00, a => 1 - AND_(a), 'quad 2-input NAND');
  gateChip(both('02'), P02, G02, a => 1 - OR_(a), 'quad 2-input NOR');
  gateChip(both('04'), P04, G04, a => 1 - a[0], 'hex inverter');
  gateChip(['74LS14'], P04, G04, a => 1 - a[0], 'hex Schmitt inverter');
  gateChip(both('08'), P00, G00, AND_, 'quad 2-input AND');
  gateChip(both('32'), P00, G00, OR_, 'quad 2-input OR');
  gateChip(both('86'), P00, G00, a => a[0] ^ a[1], 'quad 2-input XOR');
  gateChip(['74LS10'], P10, G10, a => 1 - AND_(a), 'triple 3-input NAND');
  gateChip(['74LS11'], P10, G10, AND_, 'triple 3-input AND');
  gateChip(['74LS27'], P10, G10, a => 1 - OR_(a), 'triple 3-input NOR');
  gateChip(['74LS20'], P20, G20, a => 1 - AND_(a), 'dual 4-input NAND');
  gateChip(['74LS21'], P20, G20, AND_, 'dual 4-input AND');
  gateChip(['74LS30'], P30, G30, a => 1 - AND_(a), '8-input NAND');

  // ── 74125 quad tri-state buffer (enable active low) ──
  add(['74LS125'], {
    pins: '~1C|~1G|~1OE 1A 1Y ~2C|~2G|~2OE 2A 2Y GND 3Y 3A ~3C|~3G|~3OE 4Y 4A ~4C|~4G|~4OE VCC', vcc: 14, gnd: 7, outs: [3, 6, 8, 11],
    test(T) {
      const B = [[1, 2, 3], [4, 5, 6], [10, 9, 8], [13, 12, 11]];
      T.sub('truth table (C̅=L → Y=A, C̅=H → Hi-Z)', 'core', fail => comb(T, fail, B.flatMap(b => [b[0], b[1]]), inp => { const e = {}; for (const [c, a, y] of B) e[y] = inp[c] ? Z : inp[a]; return e; }));
    }
  });

  // ── 74138 3-to-8 decoder ──
  add(both('138'), {
    pins: 'A B C ~G2A ~G2B G1 ~Y7 GND ~Y6 ~Y5 ~Y4 ~Y3 ~Y2 ~Y1 ~Y0 VCC', vcc: 16, gnd: 8, outs: [15, 14, 13, 12, 11, 10, 9, 7],
    test(T) {
      const Y = [15, 14, 13, 12, 11, 10, 9, 7];
      T.sub('truth table (G1·G̅2A·G̅2B, active-low outputs)', 'core', fail => comb(T, fail, [1, 2, 3, 4, 5, 6], inp => { const en = inp[6] && !inp[4] && !inp[5], s = inp[1] | inp[2] << 1 | inp[3] << 2, e = {}; Y.forEach((p, k) => e[p] = en && k === s ? 0 : 1); return e; }));
    }
  });
  // ── 74139 dual 2-to-4 decoder ──
  add(['74LS139'], {
    pins: '~1G 1A 1B ~1Y0 ~1Y1 ~1Y2 ~1Y3 GND ~2Y3 ~2Y2 ~2Y1 ~2Y0 2B 2A ~2G VCC', vcc: 16, gnd: 8, outs: [4, 5, 6, 7, 12, 11, 10, 9],
    test(T) {
      const H = [{ g: 1, a: 2, b: 3, y: [4, 5, 6, 7] }, { g: 15, a: 14, b: 13, y: [12, 11, 10, 9] }];
      T.sub('truth table', 'core', fail => comb(T, fail, [1, 2, 3, 15, 14, 13], inp => { const e = {}; for (const h of H) { const s = inp[h.a] | inp[h.b] << 1; h.y.forEach((p, k) => e[p] = !inp[h.g] && k === s ? 0 : 1); } return e; }));
    }
  });
  // ── 74151 8-to-1 mux ──
  add(['74LS151'], {
    pins: 'D3 D2 D1 D0 Y W|~Y|~W ~G|~S|~E GND C B A D7 D6 D5 D4 VCC', vcc: 16, gnd: 8, outs: [5, 6],
    test(T) {
      const D = [4, 3, 2, 1, 15, 14, 13, 12];
      T.sub('truth table (strobe H → Y=L, W=H)', 'core', fail => comb(T, fail, [...D, 11, 10, 9, 7], inp => { const y = inp[7] ? 0 : inp[D[inp[11] | inp[10] << 1 | inp[9] << 2]]; return { 5: y, 6: 1 - y }; }));
    }
  });
  // ── 74153 dual 4-to-1 mux ──
  add(['74LS153'], {
    pins: '~1G B 1C3 1C2 1C1 1C0 1Y GND 2Y 2C0 2C1 2C2 2C3 A ~2G VCC', vcc: 16, gnd: 8, outs: [7, 9],
    test(T) {
      const C1 = [6, 5, 4, 3], C2 = [10, 11, 12, 13];
      T.sub('truth table (strobe H → Y=L)', 'core', fail => comb(T, fail, [...C1, ...C2, 14, 2, 1, 15], inp => { const s = inp[14] | inp[2] << 1; return { 7: inp[1] ? 0 : inp[C1[s]], 9: inp[15] ? 0 : inp[C2[s]] }; }));
    }
  });
  // ── 74157 quad 2-to-1 mux ──
  add(['74LS157'], {
    pins: 'S|~A/B|SEL 1A 1B 1Y 2A 2B 2Y GND 3Y 3B 3A 4Y 4B 4A ~G|~E VCC', vcc: 16, gnd: 8, outs: [4, 7, 9, 12],
    test(T) {
      const M = [[2, 3, 4], [5, 6, 7], [11, 10, 9], [14, 13, 12]];
      T.sub('truth table (S=L → A, S=H → B, strobe H → L)', 'core', fail => comb(T, fail, [1, 15, ...M.flatMap(m => [m[0], m[1]])], inp => { const e = {}; for (const [a, b, y] of M) e[y] = inp[15] ? 0 : inp[inp[1] ? b : a]; return e; }));
    }
  });
  // ── 74283 4-bit adder ──
  add(both('283'), {
    pins: 'S2 B2 A2 S1 A1 B1 C0 GND C4 S4 B4 A4 S3 A3 B3 VCC', vcc: 16, gnd: 8, outs: [4, 1, 13, 10, 9],
    test(T) {
      const A = [5, 3, 14, 12], B = [6, 2, 15, 11], S = [4, 1, 13, 10];
      T.sub('A+B+C0 for all 512 input combinations', 'core', fail => comb(T, fail, [...A, ...B, 7], inp => { const num = P => P.reduce((s, p, k) => s | inp[p] << k, 0), s = num(A) + num(B) + inp[7], e = { 9: bit(s, 4) }; S.forEach((p, k) => e[p] = bit(s, k)); return e; }, { noX: false }));
    }
  });
  // ── 7485 4-bit magnitude comparator ──
  add(['74LS85'], {
    pins: 'B3 A<Bi|A<B_in|IA<B A=Bi|A=B_in|IA=B A>Bi|A>B_in|IA>B A>B A=B A<B GND B0 A0 B1 A1 A2 B2 A3 VCC', vcc: 16, gnd: 8, outs: [5, 6, 7],
    test(T) {
      const A = [10, 12, 13, 15], B = [9, 11, 14, 1];
      T.sub('function table incl. cascade inputs (all 2048 combinations)', 'core', fail => comb(T, fail, [...A, ...B, 4, 3, 2], inp => {
        const num = P => P.reduce((s, p, k) => s | inp[p] << k, 0), a = num(A), b = num(B), gi = inp[4], ei = inp[3], li = inp[2];
        let o;                                   // [A>B, A<B, A=B]
        if (a > b) o = [1, 0, 0]; else if (a < b) o = [0, 1, 0];
        else if (ei) o = [0, 0, 1];              // X X H → L L H
        else if (gi && !li) o = [1, 0, 0];       // H L L → H L L
        else if (!gi && li) o = [0, 1, 0];       // L H L → L H L
        else if (gi && li) o = [0, 0, 0];        // H H L → L L L
        else o = [1, 1, 0];                      // L L L → H H L
        return { 5: o[0], 7: o[1], 6: o[2] };
      }));
    }
  });

  // ── BCD → 7-segment decoders ──
  const SEGPIN = { a: 13, b: 12, c: 11, d: 10, e: 9, f: 15, g: 14 }, SEGS = Object.values(SEGPIN);
  const FONT = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'cdefg', 'abc', 'abcdefg', 'abcfg',   // 0-9 (6 and 9 without tails)
    'deg', 'cdg', 'bfg', 'adfg', 'defg', ''];                                                                // 10-15 of the '46/'47/'48
  const bcd = inp => inp[7] | inp[1] << 1 | inp[2] << 2 | inp[6] << 3;
  const segOut = (lit, on, off) => { const e = {}; for (const s in SEGPIN) e[SEGPIN[s]] = lit(s) ? on : off; return e; };
  const ttlDecoder = (names, on, off, segNames, outKind) => add(names, {
    pins: `B C ~LT ~BI|~BI/RBO|~BI/~RBO|BI/RBO ~RBI D A GND ${segNames} VCC`, vcc: 16, gnd: 8, outs: SEGS, ioPins: [4],
    test(T) {
      T.sub(`segment patterns 0–15, LT, BI, RBI (${outKind})`, 'core', fail => comb(T, fail, [7, 1, 2, 6, 3, 4, 5], inp => {
        const v = bcd(inp);
        if (!inp[4]) return segOut(() => false, on, off);              // BI low: blank, overrides everything
        if (!inp[3]) return segOut(() => true, on, off);               // LT low: all on
        if (v === 0 && !inp[5]) return segOut(() => false, on, off);   // ripple-blank the zero
        return segOut(s => FONT[v].includes(s), on, off);
      }, { check: SEGS }));
      T.sub('BI/RBO pin 4 acts as ripple-blanking OUTPUT (low when RBI=L, DCBA=0, LT=H)', 'edge', fail => {
        for (let m = 0; m < 64; m++) {
          const inp = { 7: bit(m, 0), 1: bit(m, 1), 2: bit(m, 2), 6: bit(m, 3), 3: bit(m, 4), 5: bit(m, 5) };   // pin 4 left open
          const active = inp[3] && !inp[5] && bcd(inp) === 0, got = T.ev(inp, {}), g = 4 in got ? got[4] : Z;
          if (active ? g !== L : (g !== Z && g !== Hh)) fail(`in: ${fmt(T.d, inp, [7, 1, 2, 6, 3, 5])}, pin 4 open: expected pin 4 ${active ? 'driven L (RBO)' : 'not driven low'}, got ${LV(g)}`);
        }
      });
    }
  });
  ttlDecoder(['74LS47', '74LS46'], L, Z, '~e ~d ~c ~b ~a ~g ~f', 'open-collector, ON = L, OFF = Hi-Z');
  ttlDecoder(['74LS48'], Hh, L, 'e d c b a g f', 'active-high, ON = H, OFF = L');
  add(['CD4511'], {
    pins: 'B C ~LT ~BI|~BL LE|~LE|LE/~STROBE D A VSS e d c b a g f VDD', vcc: 16, gnd: 8, outs: SEGS,
    test(T) {
      const out = (inp, v) => !inp[3] ? segOut(() => true, 1, 0) : !inp[4] ? segOut(() => false, 1, 0) : v === null ? segOut(() => true, ANY, ANY) : segOut(s => v <= 9 && FONT[v].includes(s), 1, 0);
      T.sub('transparent (LE=L): patterns 0–9, blank for 10–15, LT, BI (active-high outputs)', 'core', fail => comb(T, fail, [7, 1, 2, 6, 3, 4], inp => out(inp, bcd(inp)), { fixed: { 5: 0 } }));
      T.sub('LE latch (LE=H holds the code present while LE was L; LT/BI still act)', 'core', fail => seq(T, fail, {
        inputs: { 7: [2, .5], 1: [2, .5], 2: [2, .5], 6: [2, .5], 3: [1, .9], 4: [1, .9], 5: [3, .5] }, check: SEGS, seed: 4511,
        ref() { let v = null; return inp => { if (!inp[5]) v = bcd(inp); return out(inp, v); }; }
      }));
    }
  });

  // ── flip-flops ──
  const dff = () => { let q = null, pc = null; return (clr, pre, clk, dd) => { const rise = pc === 0 && clk === 1; pc = clk; if (!clr && !pre) { q = null; return [1, 1]; } if (!clr) q = 0; else if (!pre) q = 1; else if (rise) q = dd; return q === null ? [ANY, ANY] : [q, 1 - q]; }; };
  const jkff = () => { let q = null, pc = null; return (clr, pre, clk, j, k) => { const fall = pc === 1 && clk === 0; pc = clk; if (!clr && !pre) { q = null; return [1, 1]; } if (!clr) q = 0; else if (!pre) q = 1; else if (fall) { if (j && k) q = q === null ? null : 1 - q; else if (j) q = 1; else if (k) q = 0; } return q === null ? [ANY, ANY] : [q, 1 - q]; }; };
  add(both('74'), {
    pins: '~1CLR 1D 1CLK|1CK|1CP ~1PRE 1Q ~1Q GND ~2Q 2Q ~2PRE 2CLK|2CK|2CP 2D ~2CLR VCC', vcc: 14, gnd: 7, outs: [5, 6, 9, 8],
    test(T) {
      const F = [{ clr: 1, d: 2, clk: 3, pre: 4, q: 5, qn: 6 }, { clr: 13, d: 12, clk: 11, pre: 10, q: 9, qn: 8 }];
      T.sub('rising-edge D FF, async PRE̅/CLR̅ (both low → Q=Q̅=H)', 'core', fail => seq(T, fail, {
        seed: 74, inputs: Object.assign({}, ...F.map(f => ({ [f.clr]: [1, .85], [f.pre]: [1, .85], [f.clk]: [5, 'T'], [f.d]: [3, .5] }))),
        ref() { const m = F.map(dff); return inp => { const e = {}; F.forEach((f, i) => { const [q, qn] = m[i](inp[f.clr], inp[f.pre], inp[f.clk], inp[f.d]); e[f.q] = q; e[f.qn] = qn; }); return e; }; }
      }));
    }
  });
  const jkChip = (names, pins, vcc, gnd, F) => add(names, {
    pins, vcc, gnd, outs: F.flatMap(f => [f.q, f.qn]),
    test(T) {
      T.sub('negative-edge JK FF (hold/reset/set/toggle), async PRE̅/CLR̅ (both low → Q=Q̅=H)', 'core', fail => seq(T, fail, {
        seed: 112, inputs: Object.assign({}, ...F.map(f => ({ [f.clr]: [1, .85], [f.pre]: [1, .85], [f.clk]: [5, 'T'], [f.j]: [2, .5], [f.k]: [2, .5] }))),
        ref() { const m = F.map(jkff); return inp => { const e = {}; F.forEach((f, i) => { const [q, qn] = m[i](inp[f.clr], inp[f.pre], inp[f.clk], inp[f.j], inp[f.k]); e[f.q] = q; e[f.qn] = qn; }); return e; }; }
      }));
    }
  });
  jkChip(['74LS112'], '1CLK|1CK|~1CLK 1K 1J ~1PRE 1Q ~1Q ~2Q GND 2Q ~2PRE 2J 2K 2CLK|2CK|~2CLK ~2CLR ~1CLR VCC', 16, 8,
    [{ clk: 1, k: 2, j: 3, pre: 4, q: 5, qn: 6, clr: 15 }, { clk: 13, k: 12, j: 11, pre: 10, q: 9, qn: 7, clr: 14 }]);
  jkChip(['74LS76'], '1CLK|1CK|~1CLK ~1PRE ~1CLR 1J VCC 2CLK|2CK|~2CLK ~2PRE ~2CLR 2J ~2Q 2Q 2K GND ~1Q 1Q 1K', 5, 13,
    [{ clk: 1, pre: 2, clr: 3, j: 4, k: 16, q: 15, qn: 14 }, { clk: 6, pre: 7, clr: 8, j: 9, k: 12, q: 11, qn: 10 }]);
  add(['74LS75'], {
    pins: '~1Q 1D 2D C34|3C4C|E34|EN34 VCC 3D 4D ~4Q 4Q 3Q ~3Q GND C12|1C2C|E12|EN12 ~2Q 2Q 1Q', vcc: 5, gnd: 12, outs: [16, 1, 15, 14, 10, 11, 9, 8],
    test(T) {
      const Lt = [{ d: 2, q: 16, qn: 1, c: 13 }, { d: 3, q: 15, qn: 14, c: 13 }, { d: 6, q: 10, qn: 11, c: 4 }, { d: 7, q: 9, qn: 8, c: 4 }];
      T.sub('transparent latch (C=H: Q follows D, C=L: hold), enables 1-2 on pin 13 and 3-4 on pin 4', 'core', fail => seq(T, fail, {
        seed: 75, inputs: { 2: [2, .5], 3: [2, .5], 6: [2, .5], 7: [2, .5], 13: [2, 'T'], 4: [2, 'T'] },
        ref() { const q = [null, null, null, null]; return inp => { const e = {}; Lt.forEach((l, i) => { if (inp[l.c]) q[i] = inp[l.d]; e[l.q] = q[i] === null ? ANY : q[i]; e[l.qn] = q[i] === null ? ANY : 1 - q[i]; }); return e; }; }
      }));
    }
  });
  add(['74LS175'], {
    pins: '~CLR|~MR 1Q ~1Q 1D 2D ~2Q 2Q GND CLK|CK|CP 3Q ~3Q 3D 4D ~4Q 4Q VCC', vcc: 16, gnd: 8, outs: [2, 3, 7, 6, 10, 11, 15, 14],
    test(T) {
      const D = [4, 5, 12, 13], Q = [2, 7, 10, 15], QN = [3, 6, 11, 14];
      T.sub('quad rising-edge D FF with common clock and async CLR̅', 'core', fail => seq(T, fail, {
        seed: 175, inputs: { 1: [1, .9], 9: [5, 'T'], 4: [2, .5], 5: [2, .5], 12: [2, .5], 13: [2, .5] },
        ref() { let q = [null, null, null, null], pc = null; return inp => { const rise = pc === 0 && inp[9] === 1; pc = inp[9]; if (!inp[1]) q = [0, 0, 0, 0]; else if (rise) q = D.map(p => inp[p]); const e = {}; q.forEach((v, i) => { e[Q[i]] = v === null ? ANY : v; e[QN[i]] = v === null ? ANY : 1 - v; }); return e; }; }
      }));
    }
  });
  add(['74LS164'], {
    pins: 'A|DSA B|DSB QA|Q0 QB|Q1 QC|Q2 QD|Q3 GND CLK|CK|CP ~CLR|~MR QE|Q4 QF|Q5 QG|Q6 QH|Q7 VCC', vcc: 14, gnd: 7, outs: [3, 4, 5, 6, 10, 11, 12, 13],
    test(T) {
      const Q = [3, 4, 5, 6, 10, 11, 12, 13];
      T.sub('8-bit SIPO: rising edge shifts QA→QH, QA←A·B, async CLR̅', 'core', fail => seq(T, fail, {
        seed: 164, inputs: { 1: [2, .7], 2: [2, .7], 8: [6, 'T'], 9: [1, .93] },
        ref() { let q = Array(8).fill(null), pc = null; return inp => { const rise = pc === 0 && inp[8] === 1; pc = inp[8]; if (!inp[9]) q = Array(8).fill(0); else if (rise) q = [inp[1] & inp[2], ...q.slice(0, 7)]; const e = {}; q.forEach((v, i) => e[Q[i]] = v === null ? ANY : v); return e; }; }
      }));
    }
  });

  // ── counters ──
  add(both('161'), {
    pins: '~CLR|~MR CLK|CK|CP A|P0 B|P1 C|P2 D|P3 ENP|CEP GND ~LOAD|~PE ENT|CET QD|Q3 QC|Q2 QB|Q1 QA|Q0 RCO|TC VCC', vcc: 16, gnd: 8, outs: [14, 13, 12, 11, 15],
    test(T) {
      const ref = () => { let n = null, pc = null; return inp => { const rise = pc === 0 && inp[2] === 1; pc = inp[2];
        if (!inp[1]) n = 0;                                                                // asynchronous clear
        else if (rise) { if (!inp[9]) n = inp[3] | inp[4] << 1 | inp[5] << 2 | inp[6] << 3;   // synchronous load beats count
          else if (inp[7] && inp[10] && n !== null) n = (n + 1) & 15; }
        const q = k => n === null ? ANY : bit(n, k);
        return { 14: q(0), 13: q(1), 12: q(2), 11: q(3), 15: !inp[10] ? 0 : n === null ? ANY : +(n === 15) }; }; };  // RCO = ENT·QA·QB·QC·QD
      T.sub('async CLR̅, sync LOAD̅ (priority over count), ENP·ENT, wrap 15→0, RCO=ENT·(count=15)', 'core', fail => seq(T, fail, {
        seed: 161, steps: 4000, inputs: { 1: [1, .97], 2: [10, 'T'], 3: [1, .5], 4: [1, .5], 5: [1, .5], 6: [1, .5], 7: [1, .9], 9: [1, .92], 10: [1, .9] }, ref
      }));
    }
  });
  const ripplePins = r9 => `CKB|~CKB|CP1|~CP1|B R01|R0(1)|MR1 R02|R0(2)|MR2 NC VCC ${r9 ? 'R91|R9(1)|MS1 R92|R9(2)|MS2' : 'NC NC'} QC|Q2 QB|Q1 GND QD|Q3 QA|Q0 NC CKA|~CKA|CP0|~CP0|A`;
  // flip-flop level reference: A toggles on CKA↓; B/C/D section on CKB↓
  const ref90 = () => { let a = null, b = null, c = null, dd = null, pa = null, pb = null; return inp => { const fa = pa === 1 && inp[14] === 0, fb = pb === 1 && inp[1] === 0; pa = inp[14]; pb = inp[1];
    if (inp[6] && inp[7]) { a = 1; b = 0; c = 0; dd = 1; }            // R9(1)·R9(2): set to 9, has priority
    else if (inp[2] && inp[3]) { a = b = c = dd = 0; }                 // R0(1)·R0(2): reset to 0
    else { if (fa && a !== null) a ^= 1;
      if (fb && b !== null) { const ob = b, oc = c, od = dd; b = od ? 0 : ob ^ 1; dd = ob && oc ? 1 : 0; if (ob && !b) c = oc ^ 1; } }
    const o = v => v === null ? ANY : v; return { 12: o(a), 9: o(b), 8: o(c), 11: o(dd) }; }; };
  const ref93 = () => { let a = null, n = null, pa = null, pb = null; return inp => { const fa = pa === 1 && inp[14] === 0, fb = pb === 1 && inp[1] === 0; pa = inp[14]; pb = inp[1];
    if (inp[2] && inp[3]) { a = 0; n = 0; } else { if (fa && a !== null) a ^= 1; if (fb && n !== null) n = (n + 1) & 7; }
    const o = k => n === null ? ANY : bit(n, k); return { 12: a === null ? ANY : a, 9: o(0), 8: o(1), 11: o(2) }; }; };
  const rippleChip = (name, r9, ref, mod) => add([name], {
    pins: ripplePins(r9), vcc: 5, gnd: 10, outs: [12, 9, 8, 11],
    test(T) {
      const inputs = { 14: [6, 'T'], 1: [6, 'T'], 2: [1, .25], 3: [1, .25] }; if (r9) { inputs[6] = [1, .25]; inputs[7] = [1, .25]; }
      T.sub(`independent CKA(÷2)/CKB(÷${r9 ? 5 : 8}) sections on falling edges, gated resets${r9 ? ' (R9 beats R0)' : ''}`, 'core', fail => seq(T, fail, { seed: mod, inputs, ref }));
      T.sub(`cascaded (QA wired to CKB): counts 0…${mod - 1} and wraps`, 'core', fail => {
        const st = T.d.init(), inp = { 14: 1, 1: 1, 2: 1, 3: 1, 6: 0, 7: 0 };
        const settle = () => { let o; for (let i = 0; i < 8; i++) { o = T.ev(inp, st); if (o[12] === inp[1]) break; inp[1] = o[12]; } return o; };
        const val = o => [12, 9, 8, 11].reduce((s, p, k) => s | (o[p] === Hh ? 1 : 0) << k, 0);
        let o = settle(); if (val(o) !== 0) fail(`reset (R0 both H) should give 0, got ${val(o)}`);
        inp[2] = 0; settle();
        for (let i = 1; i <= 2 * mod + 3; i++) { inp[14] = 0; o = settle(); const v = val(o); inp[14] = 1; const o2 = settle();
          if (v !== i % mod) { fail(`after ${i} falling edges on CKA expected ${i % mod}, got ${v}`); break; }
          if (val(o2) !== v) { fail(`count changed on the RISING edge of CKA (${v} → ${val(o2)})`); break; } }
        if (r9) { inp[6] = inp[7] = 1; o = settle(); if (val(o) !== 9) fail(`R9(1)=R9(2)=H should set 9, got ${val(o)}`);
          inp[2] = inp[3] = 1; o = settle(); if (val(o) !== 9) fail(`R9 must override R0 (expected 9, got ${val(o)})`);
          inp[6] = 0; o = settle(); if (val(o) !== 0) fail(`R0 with one R9 low should reset to 0, got ${val(o)}`); }
      });
    }
  });
  rippleChip('74LS90', true, ref90, 10); rippleChip('74LS93', false, ref93, 16);

  // 74192 (BCD) next-state from the datasheet logic (T flip-flop steering), incl. states 10–15
  const up192 = q => { const a = bit(q, 0), b = bit(q, 1), c = bit(q, 2), dd = bit(q, 3); return (q ^ 1 ^ ((a && !dd) << 1) ^ ((a && b) << 2) ^ (((a && b && c) || (a && dd)) << 3)) & 15; };
  const dn192 = q => { const a = bit(q, 0), b = bit(q, 1), c = bit(q, 2), dd = bit(q, 3); return (q ^ 1 ^ ((!a && (b || c || dd)) << 1) ^ ((!a && !b && (c || dd)) << 2) ^ ((!a && !b && !c) << 3)) & 15; };
  const refUD = dec => () => { let q = null, pu = null, pd = null; return inp => { const up = inp[5], dn = inp[4], ru = pu === 0 && up === 1, rd = pd === 0 && dn === 1; pu = up; pd = dn;
    if (inp[14]) q = 0;                                                           // CLR (active high, async) beats LOAD
    else if (!inp[11]) q = inp[15] | inp[1] << 1 | inp[10] << 2 | inp[9] << 3;       // LOAD̅ async
    else if (q !== null) { if (ru && dn) q = dec ? up192(q) : (q + 1) & 15; else if (rd && up) q = dec ? dn192(q) : (q - 1) & 15; }
    const o = k => q === null ? ANY : bit(q, k);
    const co = up ? 1 : q === null ? ANY : dec ? +!(bit(q, 0) && bit(q, 3)) : +(q !== 15);   // CO̅ = NOT(UP̅·QA·QD) ('192) / NOT(UP̅·QA·QB·QC·QD) ('193)
    const bo = dn ? 1 : q === null ? ANY : +(q !== 0);                                        // BO̅ = NOT(DOWN̅·Q̅A·Q̅B·Q̅C·Q̅D)
    return { 3: o(0), 2: o(1), 6: o(2), 7: o(3), 12: co, 13: bo }; }; };
  const udPins = 'B|P1 QB|Q1 QA|Q0 DOWN|CPD|DN UP|CPU QC|Q2 QD|Q3 GND D|P3 C|P2 ~LOAD|~PL ~CO|~TCU ~BO|~TCD CLR|MR A|P0 VCC';
  const udIn = { 5: [8, 'T'], 4: [5, 'T'], 14: [1, .04], 11: [1, .93], 15: [1, .5], 1: [1, .5], 10: [1, .5], 9: [1, .5] };
  const data = inp => inp[15] | inp[1] << 1 | inp[10] << 2 | inp[9] << 3;
  add(['74LS193'], {
    pins: udPins, vcc: 16, gnd: 8, outs: [3, 2, 6, 7, 12, 13],
    test(T) {
      T.sub('async CLR (high) > async LOAD̅ > count; UP/DOWN rising edges; wrap 15↔0; CO̅/BO̅ follow the low clock phase', 'core', fail => seq(T, fail, { seed: 193, steps: 4000, inputs: udIn, ref: refUD(false), allow: i => i[5] || i[4] }));
    }
  });
  add(['74LS192'], {
    pins: udPins, vcc: 16, gnd: 8, outs: [3, 2, 6, 7, 12, 13],
    test(T) {
      T.sub('BCD range (loads 0–9 only): async CLR > async LOAD̅ > count; wrap 9↔0; CO̅ at 9, BO̅ at 0', 'core', fail => seq(T, fail, { seed: 192, steps: 4000, inputs: udIn, ref: refUD(true), allow: i => (i[5] || i[4]) && (i[11] || data(i) <= 9) }));
      T.sub('invalid codes 10–15 loaded via LOAD̅ (datasheet state diagram: up 10→11→6, 12→13→4, 14→15→2; down 15→14→…→10→9; CO̅ = NOT(UP̅·QA·QD))', 'edge', fail => {
        const pulse = (pinNo, start) => { const st = T.d.init(), inp = { 5: 1, 4: 1, 14: 0, 11: 0, 15: bit(start, 0), 1: bit(start, 1), 10: bit(start, 2), 9: bit(start, 3) };
          T.ev(inp, st); inp[11] = 1; T.ev(inp, st); inp[pinNo] = 0; const lo = T.ev(inp, st); inp[pinNo] = 1; const o = T.ev(inp, st);
          return { n: [3, 2, 6, 7].reduce((s, p, k) => s | (o[p] === Hh ? 1 : 0) << k, 0), co: lo[12], bo: lo[13] }; };
        for (let s = 10; s < 16; s++) {
          const u = pulse(5, s), dn = pulse(4, s);
          if (u.n !== up192(s)) fail(`load ${s}, one UP pulse: expected ${up192(s)}, got ${u.n}`);
          if (dn.n !== dn192(s)) fail(`load ${s}, one DOWN pulse: expected ${dn192(s)}, got ${dn.n}`);
          const eco = (s & 9) === 9 ? L : Hh; if (u.co !== eco) fail(`load ${s}, UP low: expected CO̅=${LV(eco)}, got ${LV(u.co)}`);
        }
      });
    }
  });

  // ── NE555 ──
  add(['NE555'], {
    pins: 'GND TRIG|~TRIG|TR OUT ~RESET|RESET|~RST CTRL|CV|CONT THRES|THR|TH DISCH|DIS VCC', vcc: 8, gnd: 1, outs: [3, 7],
    test(T) {
      const d = T.d, run = (st, rst, trig, thr, ctrl) => { const v = { 2: trig, 6: thr }; if (ctrl !== undefined) v[5] = ctrl; return T.ev({ 4: rst }, st, v); };
      T.sub('comparator thresholds ⅓/⅔·VCC (VCC=5 V), trigger beats threshold, RESET̅ beats both, DISCH, CTRL override', 'core', fail => {
        const st = d.init(); const exp = (o, out, what) => { const dis = out === Hh ? Z : L; if (o[3] !== out || (o[7] ?? Z) !== dis) fail(`${what}: expected OUT=${LV(out)} DISCH=${LV(dis)}, got OUT=${LV(o[3])} DISCH=${LV(o[7] ?? Z)}`); };
        exp(run(st, 1, 1.0, 1.0), Hh, 'TRIG 1.0 V (< 1.67 V)');
        exp(run(st, 1, 2.5, 2.5), Hh, 'both between thresholds → hold HIGH');
        exp(run(st, 1, 3.30, 3.30), Hh, 'THRES 3.30 V (< 3.33 V) → still HIGH');
        exp(run(st, 1, 3.40, 3.40), L, 'THRES 3.40 V (> 3.33 V)');
        exp(run(st, 1, 2.5, 2.5), L, 'both between thresholds → hold LOW');
        exp(run(st, 1, 1.70, 1.70), L, 'TRIG 1.70 V (> 1.67 V) → still LOW');
        exp(run(st, 1, 1.60, 1.60), Hh, 'TRIG 1.60 V (< 1.67 V)');
        exp(run(st, 1, 1.0, 4.5), Hh, 'TRIG low and THRES high together → trigger wins');
        exp(run(st, 0, 1.0, 1.0), L, 'RESET̅ low with TRIG low → reset wins');
        exp(run(st, 1, 2.5, 2.5), L, 'after reset released, between thresholds → stays LOW');
        const s2 = d.init();
        exp(run(s2, 1, 0.9, 0.9, 2.0), Hh, 'CTRL=2.0 V: TRIG 0.9 V (< CTRL/2)');
        exp(run(s2, 1, 1.2, 1.2, 2.0), Hh, 'CTRL=2.0 V: TRIG 1.2 V (> CTRL/2), THRES 1.2 V → hold');
        exp(run(s2, 1, 2.5, 2.5, 2.0), L, 'CTRL=2.0 V: THRES 2.5 V (> CTRL)');
        exp(run(s2, 1, 1.2, 1.2, 2.0), L, 'CTRL=2.0 V: TRIG 1.2 V must not retrigger');
      });
      T.sub('astable: t_high≈0.693(R1+R2)C, t_low≈0.693·R2·C, capacitor swings ⅓…⅔ VCC', 'core', fail => {
        const st = d.init(), R1 = 10e3, R2 = 100e3, C = 1e-6, dt = 1e-5; let v = 0, prev = null, tEdge = 0, hi = [], lo = [], vmin = 9, vmax = 0;
        for (let i = 0; i < 100000; i++) { const o = run(st, 1, v, v), out = o[3], dis = (o[7] ?? Z) === L;
          if (prev !== null && out !== prev) { const t = i * dt; if (tEdge) (prev === Hh ? hi : lo).push(t - tEdge); tEdge = t; }
          if (hi.length + lo.length >= 1) { vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
          prev = out; v += dt * ((dis ? 0 : 5) - v) / ((dis ? R2 : R1 + R2) * C); }
        const avg = a => a.reduce((s, x) => s + x, 0) / a.length, eh = 0.693 * (R1 + R2) * C, el = 0.693 * R2 * C;
        if (hi.length < 2 || lo.length < 2) return fail(`no oscillation (high phases ${hi.length}, low phases ${lo.length})`);
        if (Math.abs(avg(hi) / eh - 1) > 0.02) fail(`t_high expected ≈${eh.toFixed(4)} s, got ${avg(hi).toFixed(4)} s`);
        if (Math.abs(avg(lo) / el - 1) > 0.02) fail(`t_low expected ≈${el.toFixed(4)} s, got ${avg(lo).toFixed(4)} s`);
        if (Math.abs(vmin - 5 / 3) > 0.02 || Math.abs(vmax - 10 / 3) > 0.02) fail(`capacitor should swing 1.667…3.333 V, got ${vmin.toFixed(3)}…${vmax.toFixed(3)} V`);
      });
      T.sub('monostable: pulse width ≈ 1.1·R·C after a low TRIG pulse; RESET̅ ends it early', 'core', fail => {
        const R = 100e3, C = 1e-6, dt = 1e-5, sim = resetAt => { const st = d.init(); let v = 0, w = 0, started = false;
          for (let i = 0; i < 40000; i++) { const t = i * dt, trig = t >= 0.01 && t < 0.011 ? 0 : 5, rst = resetAt != null && t >= resetAt ? 0 : 1; const o = run(st, rst, trig, v), dis = (o[7] ?? Z) === L;
            if (o[3] === Hh) { started = true; w += dt; } else if (!started && t < 0.01 && o[3] !== L) return -1;
            v = dis ? 0 : v + dt * (5 - v) / (R * C); } return w; };
        const w = sim(null); if (Math.abs(w / (1.1 * R * C) - 1) > 0.02) fail(`pulse width expected ≈${(1.1 * R * C).toFixed(4)} s, got ${w.toFixed(4)} s`);
        const w2 = sim(0.05); if (Math.abs(w2 - 0.04) > 0.001) fail(`RESET̅ low at t=50 ms should end the pulse after 40 ms, got ${w2.toFixed(4)} s`);
      });
    }
  });

  /* ───────────── run ───────────── */
  const norm = s => String(s).replace(/\s/g, '');
  const names = Object.keys(CHIPS), report = { names, levels: { L, Hh, X, Z }, chips: [], missingRef: names.filter(n => !REF[n]), refWithoutChip: Object.keys(REF).filter(n => !CHIPS[n]), gates: [] };
  for (const name of names) {
    const d = CHIPS[name], r = REF[name], res = { name, title: d.title, subs: [], notes: [], pin: [] };
    report.chips.push(res);
    if (!r) { res.pin.push('NO REFERENCE MODEL for this chip — not verified'); continue; }
    // pinout
    if (d.pins.length !== r.pins.length) res.pin.push(`package has ${r.pins.length} pins, simulator defines ${d.pins.length}`);
    r.pins.forEach((want, i) => { const have = d.pins[i]; if (have === undefined) return; if (!want.split('|').map(norm).includes(norm(have))) res.pin.push(`pin ${i + 1}: datasheet function "${want.split('|')[0]}", simulator has "${have}"`); });
    const vp = d.idx[d.vcc] + 1, gp = d.idx[d.gnd] + 1;
    if (vp !== r.vcc) res.pin.push(`supply +: datasheet pin ${r.vcc}, simulator uses pin ${vp} (${d.vcc})`);
    if (gp !== r.gnd) res.pin.push(`supply −: datasheet pin ${r.gnd}, simulator uses pin ${gp} (${d.gnd})`);
    const outsHave = [...d.outs].map(n => d.idx[n] + 1).sort((a, b) => a - b).join(','), outsWant = [...r.outs].sort((a, b) => a - b).join(',');
    if (outsHave !== outsWant) res.pin.push(`output pin set: datasheet {${outsWant}}, simulator outs {${outsHave}}`);
    const wantTtl = /^74LS/.test(name); if (/^(74HC|CD)/.test(name) && d.ttl) res.pin.push('CMOS part is flagged ttl (floating input would read HIGH)'); if (wantTtl && !d.ttl) res.pin.push('74LS part is not flagged ttl (floating input should read HIGH)');
    // function
    const sig = d.pins.map((_, i) => i + 1).filter(p => p !== r.vcc && p !== r.gnd && !(r.ioPins || []).includes(p));
    const T = { d, ev: mkEv(d), sig, note: m => res.notes.push(m), sub(title, tag, fn) { const s = { title, tag, n: 0, msgs: [] }; res.subs.push(s); try { fn(m => { if (s.n++ < 4) s.msgs.push(m); }); } catch (e) { s.n++; s.msgs.push('EXCEPTION: ' + (e && e.stack || e)); } } };
    r.test(T);
  }
  // standalone gates
  const GREF = { AND: (a, b) => a & b, OR: (a, b) => a | b, NOT: a => 1 - a, NAND: (a, b) => 1 - (a & b), NOR: (a, b) => 1 - (a | b), XOR: (a, b) => a ^ b, XNOR: (a, b) => 1 - (a ^ b) };
  for (const k of Object.keys(GATES)) {
    const d = GATES[k], f = GREF[k], res = { name: k, errs: [] }; report.gates.push(res);
    if (!f) { res.errs.push('no reference for this gate'); continue; }
    const wantPins = k === 'NOT' ? 'A,Y' : 'A,B,Y'; if (d.pins.join(',') !== wantPins) res.errs.push(`pins ${d.pins.join(',')} (expected ${wantPins})`);
    for (let m = 0; m < 4; m++) { const a = m & 1, b = m >> 1, o = d.eval(n => n === 'A' ? a : b), e = f(a, b); if (o.Y !== e) res.errs.push(`A=${a} B=${b}: expected Y=${e}, got ${LV(o.Y)}`); }
    if (d.fn && k !== 'NOT') for (let m = 0; m < 4; m++) if (d.fn(m & 1, m >> 1) !== f(m & 1, m >> 1)) res.errs.push(`fn(${m & 1},${m >> 1}) wrong`);
  }
  for (const k of Object.keys(GREF)) if (!GATES[k]) report.gates.push({ name: k, errs: ['gate missing from GATES'] });
  return report;
}

/* ───────────────────────── node side ───────────────────────── */
(async () => {
  const browser = await chromium.launch();
  let rep; const pageErrors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => pageErrors.push(e.message));
    await page.goto('file://' + FILE); await page.waitForTimeout(300);
    rep = await page.evaluate(inPage);
  } finally { await browser.close(); }

  console.log(`file: ${FILE}`);
  console.log(`Object.keys(CHIPS) (${rep.names.length}): ${rep.names.join(' ')}`);
  if (pageErrors.length) console.log('page errors while loading:', pageErrors);
  let failed = 0, warned = 0;
  for (const c of rep.chips) {
    const hard = c.subs.filter(s => s.n && !(LENIENT && s.tag === 'edge')), soft = c.subs.filter(s => s.n && LENIENT && s.tag === 'edge');
    const bad = c.pin.length || hard.length; if (bad) failed++; if (soft.length) warned++;
    console.log(`${bad ? 'FAIL' : soft.length ? 'WARN' : 'PASS'}  ${c.name.padEnd(8)} ${c.title}`);
    for (const p of c.pin) console.log(`        pinout ✗ ${p}`);
    for (const s of c.subs) {
      if (!s.n) { if (bad || soft.length || VERBOSE) console.log(`        ok      ${s.title}`); continue; }
      console.log(`        ${LENIENT && s.tag === 'edge' ? 'warn' : 'FAIL'} [${s.tag}] ${s.title} — ${s.n} mismatch(es)`);
      for (const m of s.msgs) console.log(`            · ${m}`);
    }
    for (const n of c.notes) console.log(`        note    ${n}`);
  }
  let gfail = 0;
  for (const g of rep.gates) { if (g.errs.length) gfail++; console.log(`${g.errs.length ? 'FAIL' : 'PASS'}  gate ${g.name}${g.errs.length ? ': ' + g.errs.join('; ') : ''}`); }
  const total = rep.chips.length;
  console.log('─'.repeat(72));
  if (rep.missingRef.length) console.log(`COVERAGE ✗ chips without a reference model: ${rep.missingRef.join(' ')}`);
  else console.log(`coverage: reference table covers all ${total} entries of CHIPS`);
  if (rep.refWithoutChip.length) console.log(`note: reference models with no chip in the page: ${rep.refWithoutChip.join(' ')}`);
  console.log(`chips: ${total - failed}/${total} passed, ${failed} failed${warned ? `, ${warned} with warnings` : ''};  standalone gates: ${rep.gates.length - gfail}/${rep.gates.length} passed`);
  process.exit(failed || gfail || rep.missingRef.length ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
