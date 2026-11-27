// 20차 부품(아날로그 IC·금속 캔/TO-3 트랜지스터·JFET·다이오드·한 줄 브리지·모듈 블록·CPU): 예제 Ⓟ8, 보드에 놓기·그리기, 속성 창, 회로도 기호, PCB 발자국·자동 배선, 부품 고르기 검색, 목록 불러오기(nid)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
const res=await p.evaluate(()=>{const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg||''});
  const NEW=['q3055','q2955','q2222m','q2907m','qp39','q18s','jfn','jfn92','d914','d5711','d4004','oa2j','oa4j','oa2n','oa2b','oa4','oa1p','cmp2','reg317','dac10','cpu64','batt','byto','bytx','bconv','bfilt','bif','bref','bcrt','ctrim','cfeed','indv','xfmr','xflb','xtal21','xtal10','dpin','dvar','dzref','eprom','sram','gpib','coax','rlyrf','edge','rpg','kp44','fuse','ntc','tco','fan','emif'];
  const st=()=>{for(let i=0;i<6;i++)settle();};
  const load=()=>{setVM('bb');const ex=EXAMPLES.paana();S.power=true;loadComps(ex.comps,false,ex.boards);orthoWires();RT.clear();commit(true);st();};load();
  const px=k=>S.comps.find(c=>c.t==='px'&&c.kind===k),leds=()=>S.comps.filter(c=>c.t==='led').map(c=>(SIM.led.get(c.id)||{}).lit?1:0).join('');
  // ① 예제 Ⓟ8: 와이퍼 3.5V → 비교기 LED 켜짐, 증폭기 출력 LED 켜짐 / 1.5V → 비교기 LED 꺼짐
  { const l0=leds(),a0=(rt(px('cmp2')).ast||[])[0];px('trim6').pos=.3;st();const l1=leds();
    T('예제 Ⓟ8: 비교기·증폭기 LED (와이퍼 70% → 30%)',l0==='11'&&l1==='01'&&a0&&a0.st===1,l0+' → '+l1);
    T('예제 Ⓟ8: 경고 없음',!SIM.warns.filter(w=>w[0]!=='info').length,SIM.warns.map(w=>w[1].slice(0,40)).join('|')); }
  // ①-2 예제 Ⓟ9: DIP 1010 → 10비트 코드 640 → 1.5 × (1 + 640/1024) ≈ 2.44V, LED 켜짐 / 모두 끄면 1.5V, LED 꺼짐 · 블록 8종 연결
  { setVM('bb');const ex=EXAMPLES.pasa();S.power=true;loadComps(ex.comps,false,ex.boards);orthoWires();RT.clear();commit(true);st();
    const a=px('oa2b'),vo=()=>SIM.vOf(SIM.netOf[HOLES.get(pinHoles(a)[0]).i]),lit=()=>!!(SIM.led.get(S.comps.find(c=>c.t==='led').id)||{}).lit;
    const v0=vo(),l0=lit(),c0=(rt(px('dac10')).ast||[])[0];px('dip4').bits=[0,0,0,0];st();const v1=vo(),l1=lit();
    const sw=S.comps.find(c=>c.t==='sw'),gl=()=>!!(SIM.led.get(S.comps.filter(c=>c.t==='led')[1].id)||{}).lit,g0=gl();sw.on=false;st();const g1=gl();
    T('예제 Ⓟ9: DAC 스윕 전압·빔 켜기·블록 연결 (보드 3개)',ex.boards.length===3&&g0&&!g1&&Math.abs(v0-2.4375)<.02&&l0&&c0&&c0.code===640&&Math.abs(v1-1.5)<.01&&!l1&&S.comps.filter(c=>c.t==='px'&&PX[c.kind].blk).length===8&&!SIM.warns.filter(w=>w[0]!=='info').length,
      `코드 ${c0&&c0.code} → ${v0.toFixed(3)}V(LED ${l0}) · 0 → ${v1.toFixed(3)}V(LED ${l1})`); }
  // ② 새 부품마다 보드에 놓고 그리기·속성 창
  { const bad=[];for(const k of NEW){try{const d=PX[k];if(!d){bad.push(k+' 없음');continue;}const ids=pxHolesAt(k,1,'c',5);if(!ids){bad.push(k+' 자리');continue;}
      loadComps([{t:'px',kind:k,pins:ids}],false);RT.clear();S.power=true;st();render();
      const svg=document.querySelector('#bb, svg');sel={type:'comp',id:S.comps[0].id};renderInfo();const tx=$('info').textContent;
      if(d.ana&&!/지금:/.test(tx))bad.push(k+' 속성(지금)');if(d.blk&&!/시뮬레이션 없음|계산하지 않아요/.test(tx))bad.push(k+' 속성(블록)');if(d.tr&&!/지금:/.test(tx))bad.push(k+' 속성(트랜지스터)');
      if(d.nid&&!tx.includes(d.nid)&&(d.ana||d.blk))bad.push(k+' nid 표시');
      const s=d.draw(S.comps[0],pinHoles(S.comps[0]).map(id=>HOLES.get(id)),rt(S.comps[0]),false);if(!s||/NaN|undefined/.test(s))bad.push(k+' 그림');}catch(e){bad.push(k+' '+e.message);}}
    T('새 부품 56종: 보드 그리기·속성 창',!bad.length,bad.join(' | ')); }
  // ③ 전원 없는 연산 증폭기 → 경고, 속성 창 "전원 부족"
  { loadComps([{t:'px',kind:'oa2j',pins:pxHolesAt('oa2j',1,'c',5)}],false);RT.clear();S.power=true;st();sel={type:'comp',id:S.comps[0].id};renderInfo();
    T('전원 없는 연산 증폭기: 경고·속성 창',SIM.warns.some(w=>/전원이 안 들어와요/.test(w[1]))&&/전원 부족/.test($('info').textContent),''); }
  // ④ 회로도 기호: 핀 수가 부품과 같음, 이름이 겹치지 않음
  { const bad=[];for(const k of NEW){const sym=symOf({t:'px',kind:k,id:-1});if(sym.pins.length!==PX[k].pins.length)bad.push(k+' '+sym.pins.length);}
    load();boardToSch();setVM('sch');SCH.power=true;renderSch();const ok=SCH.parts.filter(q=>q.t==='px').length===3;setVM('bb');
    T('회로도 기호 핀 수 · 예제를 회로도로',!bad.length&&ok,bad.join(' ')); }
  // ⑤ PCB: 발자국 이름, 예제 자동 배선 → 점검 오류 없음
  { const pk=NEW.map(k=>fpDef({t:'px',kind:k})),bad=pk.map((D,i)=>D.pads.length<PX[NEW[i]].pins.length||!D.pkg?NEW[i]:'').filter(Boolean);
    const F=k=>pk[NEW.indexOf(k)].pkg;T('PCB 발자국 (TO-3·TO-18·TO-39·TO-99·DIP-64 등)',!bad.length&&/^TO-3 /.test(F('q3055'))&&/^TO-18 /.test(F('q2222m'))&&/^TO-18 /.test(F('jfn'))&&/^TO-39 /.test(F('qp39'))&&/^TO-99 /.test(F('oa1p'))&&/900mil/.test(F('cpu64')),bad.join(' ')+' '+['q3055','q2222m','qp39','oa1p','cpu64'].map(F).join(' | '));
    load();setVM('pcb');const C0=pcalc();if(C0.rats.length)pcbAutoRoute();const C=pcalc(),E=pcbDRC().filter(e=>e.k==='bad');setVM('bb');
    T('PCB: 예제 Ⓟ8 자동 배선',!C.rats.length&&!E.length,`부품 ${C.fps.length} · 못 이음 ${C.rats.length} · 오류 ${E.map(e=>e.t).join('/')}`); }
  // ⑥ 부품 고르기: 새 분류 둘 + 검색
  { openParts();const n=q=>{$('partQ').value=q;$('partQ').dispatchEvent(new Event('input'));return document.querySelectorAll('#partGrid .pcard').length;};
    const r={op:n('연산 증폭기'),cmp:n('비교기'),yig:n('YIG'),cpu:n('마이크로프로세서'),to3:n('TO-3'),dac:n('D/A')};closeParts();
    const A=PTREE.find(x=>x.k==='aic'),sub=A?A.kids.map(x=>x.k+':'+x.items.length):[],pas=PTREE.find(x=>x.k==='pas').kids.map(x=>x.k);
    T('부품 고르기: [아날로그 · 혼합신호 IC · 모듈] 분류 3개, 수동 소자에는 없음, 검색',sub.join()==='a-ana:8,a-dig:5,a-blk:8'&&!pas.some(k=>/ana|dig|blk/.test(k))&&SCHTREE.includes(A)&&r.op>=6&&r.cmp>=1&&r.yig>=2&&r.cpu>=1&&r.to3>=2&&r.dac>=1,sub.join(' ')+' '+JSON.stringify(r)); }
  // ⑦ 목록 불러오기: 중립 이름(nid)으로 적은 부품
  { const txt='U1 OPAMP_DUAL_GP_SS\nU2 COMP_DUAL_OC_36V\nQ1 BJT_NPN_SW_40V_800MA\nR1 R 10k\nN1: U1.OUT1, R1.1\nN2: R1.2, U1.IN1−';
    const sp=parseSpec(txt),kinds=sp.parts.map(x=>x.kind||x.t).join(' ');T('목록: nid로 부품 알아봄',kinds==='oa2b cmp2 q2222m res',kinds+' '+sp.errors.join('|')); }
  return out;});
for(const r of res)console.log((r.ok?'ok  ':'BAD ')+r.k+'  '+r.msg);console.log('errors',errs);
const bad=res.filter(r=>!r.ok).length+errs.length;console.log(bad?'analog-ic FAIL':'analog-ic PASS');await b.close();})();
