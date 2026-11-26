// 트랜지스터·MOSFET 예제(Ⓟ7): 스위치로 켜고 끄기(NPN·PNP·N·P채널·달링턴), 릴레이 구동, 경고, 회로도 동작, 속성 창, PCB 발자국, 파일 목록, 검색
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
const res=await p.evaluate(()=>{const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg||''});
  const TR=['q3904','q3906','m7000','qbc547','q2222','qtip','mnpow','mppow'];
  const load=()=>{const ex=EXAMPLES.pastr();S.power=true;loadComps(ex.comps,false,ex.boards);orthoWires();RT.clear();commit(true);settle();};load();
  const px=k=>S.comps.find(c=>c.t==='px'&&c.kind===k),on=k=>!!rt(px(k)).on,leds=()=>S.comps.filter(c=>c.t==='led').map(c=>(SIM.led.get(c.id)||{}).lit?1:0).join('');
  // 처음: 스위치 켬(NPN·N 켜짐) / 끔(PNP·P는 LOW라 켜짐 아님 — 예제 배치대로)
  const s0=TR.map(k=>on(k)?1:0).join(''),l0=leds();
  T('처음 상태: 3904·3906·7000·N파워 켜짐, 547·2222·TIP·P파워 꺼짐',s0==='11100010',s0);
  T('경고 없음',!SIM.warns.length,SIM.warns.map(w=>w[1].slice(0,40)).join('|'));
  for(const c of S.comps)if(c.t==='sw')c.on=!c.on;settle();const s1=TR.map(k=>on(k)?1:0).join(''),l1=leds();
  T('스위치를 모두 뒤집으면 반대로',s1==='00011101',s1);
  T('LED도 반대로 켜짐',l0==='11100010'&&l1==='00011101',l0+' → '+l1);
  T('2N2222A가 켜지면 릴레이가 붙음',rlyOn(px('rlyc'),rt(px('rlyc')))&&!SIM.warns.length,SIM.warns.map(w=>w[1].slice(0,40)).join('|'));
  T('베이스 전류 표시(2N2222A 1kΩ ≈ 4.3mA)',rt(px('q2222')).ib>.003&&rt(px('q2222')).ib<.005,(rt(px('q2222')).ib*1000).toFixed(2)+'mA');
  // 역전압 다이오드를 빼고 끄면 알림이 없어도 되지만, 베이스 저항을 빼고 바로 + 에 물리면 경고
  loadComps([{t:'px',kind:'q2222',pins:['c13','c14','c15']},{t:'wire',pins:['a13','tn13']},{t:'wire',pins:['a14','tp14']}],false);RT.clear();settle();
  T('베이스에 저항 없이 + → 경고',SIM.warns.some(w=>w[0]==='bad'&&/베이스\(B\)가 저항 없이/.test(w[1])),'');
  loadComps([{t:'px',kind:'mnpow',pins:['c13','c14','c15']},{t:'wire',pins:['a15','tn15']}],false);RT.clear();settle();
  T('게이트가 떠 있으면 경고',SIM.warns.some(w=>/게이트\(G\)가 아무 데도/.test(w[1])),'');
  // 3.3V 서플라이로 2N7000을 켜면 '덜 켜짐' 알림
  loadComps([{t:'psu',k:1,x:20,y:440,v:3.3},{t:'wire',pins:['@1:0','a14']},{t:'wire',pins:['@1:1','a13']},{t:'px',kind:'m7000',pins:['c13','c14','c15']},{t:'res',pins:['d15','d19'],ohms:1000},{t:'wire',pins:['a19','a14']}],false);RT.clear();settle();
  T('3.3V 게이트 → 덜 켜짐 알림',on('m7000')&&SIM.warns.some(w=>/덜 켜져요/.test(w[1])),SIM.warns.map(w=>w[1].slice(0,40)).join('|'));
  // 회로도: 예제를 가져와 스위치로 켜고 끄기
  { load();boardToSch();setVM('sch');SCH.power=true;renderSch();const st=()=>TR.map(k=>srt(SCH.parts.find(q=>q.kind===k)).on?1:0).join('');const a=st();
    for(const q of SCH.parts)if(q.t==='sw')q.on=!q.on;renderSch();const b_=st();T('회로도: 같은 켜짐·꺼짐, 뒤집으면 반대',a==='11100010'&&b_==='00011101',a+' → '+b_);
    const q=SCH.parts.find(q=>q.kind==='q3904'),sym=symOf(q);T('회로도 기호: B·C·E 핀',sym.pins.map(x=>x.name).sort().join('')==='BCE','');
    const m=symOf(SCH.parts.find(q=>q.kind==='mppow'));T('MOSFET 기호: G·D·S 핀',m.pins.map(x=>x.name).sort().join('')==='DGS','');setVM('bb');}
  // 속성 창
  { load();let pe=0;for(const k of TR)try{sel={type:'comp',id:px(k).id};renderInfo();if(![...document.querySelectorAll('#info .desc')].some(d=>/지금: (켜짐|꺼짐)/.test(d.textContent)))pe++;}catch(e){pe++;}T('속성 창(지금 켜짐·꺼짐)',!pe,''); }
  // PCB 발자국: TO-92·TO-220 이름과 핀 3개
  { const P=SCH.parts.filter(q=>q.t==='px'&&PX[q.kind].tr).map(q=>fpDef(q));T('PCB 발자국 TO-92·TO-220',P.every(D=>D.pads.length===3&&/^TO-(92|220) \(/.test(D.pkg)),P.map(D=>D.pkg).join(' | ')); }
  // 파일 배치(목록): 번호·이름으로 알아보고 핀 이름(E·B·C, G·D·S)으로 잇기
  { const txt='SW1 SW on\nQ1 2N3904\nQ2 BC547\nQ3 transistor PNP\nQ4 MOSFET\nQ5 TIP120\nR1 R 4.7k\nR2 R 330\nD1 LED green\nVCC: SW1.1, R2.1\nN1: SW1.2, R1.1\nN2: R1.2, Q1.B\nGND: Q1.E\nN3: R2.2, D1.A\nN4: D1.K, Q1.C';
    const sp=parseSpec(txt),kinds=sp.parts.map(x=>x.kind||x.t).join(' ');
    T('목록에서 트랜지스터를 알아봄',kinds==='sw q3904 qbc547 q3906 m7000 qtip res res led'&&!sp.errors.length,kinds+' '+sp.errors.join('|'));
    $('impText').value=txt;runImport();const led=S.comps.find(c=>c.t==='led');
    T('목록으로 꽂은 NPN 스위치 동작',!!(SIM.led.get(led.id)||{}).lit&&rt(S.comps.find(c=>c.kind==='q3904')).on,SIM.warns.map(w=>w[1].slice(0,30)).join('|')); }
  // 부품 고르기: 분류·검색
  { openParts();const n=q=>{$('partQ').value=q;$('partQ').dispatchEvent(new Event('input'));return document.querySelectorAll('#partGrid .pcard').length;};
    const r={transistor:n('transistor'),mosfet:n('mosfet'),ko:n('트랜지스터')};closeParts();T('부품 검색(transistor·mosfet·트랜지스터)',r.transistor>=9&&r.mosfet>=3&&r.ko>=6,JSON.stringify(r)); }
  return out;});
for(const r of res)console.log((r.ok?'ok  ':'BAD ')+r.k+'  '+r.msg);console.log('errors',errs);
const bad=res.filter(r=>!r.ok).length+errs.length;console.log(bad?'transistor FAIL':'transistor PASS');await b.close();})();
