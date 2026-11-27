// 도구 막대 계측기 묶음 · 파워 서플라이 3채널 · 함수 발생기 3채널(위상) · 오실로스코프 4채널(4분할·위상차 측정·위상 이동) · 예전 파일 호환 · 속성 채널 탭
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
// 도구 막대
const tb=await p.evaluate(()=>[...document.querySelectorAll('.toolbar .instg [data-tool]')].map(b=>b.dataset.tool+(b.querySelector('svg')?'+':'')).join(','));
T('도구 막대에 계측기·전원 단추(그림 포함)',tb==='psu+,bat+,fg+,osc+,spa+',tb);
await p.evaluate(()=>{S.comps=[];commit&&commit(true);});await p.dblclick('.toolbar .instg [data-tool="osc"]');await p.waitForTimeout(200);
T('두 번 누르면 오실로스코프가 놓임',await p.evaluate(()=>S.comps.some(c=>c.t==='osc')));
const r=await p.evaluate(async()=>{const R={},B=[{id:1,type:'full',x:0,y:0}];const v=id=>{const h=HOLES.get(id);return SIM.vOf(SIM.netOf[h.i]);};
  const run=cs=>{S.power=true;loadComps(cs,true,B);RT.clear();settle();render();};
  // 파워 서플라이 3채널: CH1 5V 레일, CH2 12V, CH3 −12V, 꺼진 채널은 내보내지 않음
  run([{t:'psu',k:1,x:0,y:440,v:5,on:true,ch:[{v:12,on:true},{v:-12,on:true}]},{t:'wire',pins:['@1:0','tp2']},{t:'wire',pins:['@1:1','tn2']},{t:'wire',pins:['@1:2','a10']},{t:'wire',pins:['@1:4','a14']}]);
  R.psu=[v('tp5'),v('c10'),v('c14')];
  const ps=S.comps.find(c=>c.t==='psu');ps.ch[0].on=false;settle();R.off=[v('c10'),SIM.warns.some(w=>/CH2의 출력이 꺼져/.test(w[1]))];
  // 예전 파일: 채널 1개짜리 psu·fg·osc
  run([{t:'psu',k:1,x:0,y:440,v:9,on:true},{t:'wire',pins:['@1:0','a3']},{t:'wire',pins:['@1:1','tn3']},{t:'fg',k:2,x:220,y:440,wave:'sq',hz:1,vpp:5},{t:'osc',k:3,x:470,y:440,tdiv:.5,vdiv:2,vdiv2:2,pos1:3.25,pos2:6.75,on1:true,on2:true,run:true}]);
  const P0=S.comps.find(c=>c.t==='psu'),F0=S.comps.find(c=>c.t==='fg'),O0=S.comps.find(c=>c.t==='osc');
  R.old=[v('c3'),P0.ch.length,P0.ch.every(q=>q.on===false),F0.ch.length,F0.ch.every(q=>q.on===false),P0.pins.length,F0.pins.length,O0.pins.length,O0.pos1];
  // 함수 발생기 3상 → 오실로스코프 4채널
  run([{t:'fg',k:2,x:220,y:440,wave:'sin',hz:2,vpp:4,off:0,ph:0,on:true},{t:'wire',pins:['@2:0','a20']},{t:'wire',pins:['@2:2','a24']},{t:'wire',pins:['@2:4','a28']},{t:'wire',pins:['@2:1','tn20']},
    {t:'osc',k:3,x:470,y:440,tdiv:.2},{t:'wire',pins:['@3:0','e20']},{t:'wire',pins:['@3:1','e24']},{t:'wire',pins:['@3:2','e28']}]);
  const F=S.comps.find(c=>c.t==='fg');sel={type:'comp',id:F.id};SEL.clear();SEL.add(F.id);renderInfo();document.getElementById('fg3ph').click();
  R.ph=[F.ch[0].ph,F.ch[1].ph,F.ch[0].on,F.ch[1].on,F.ch[1].hz];
  const O=S.comps.find(c=>c.t==='osc');rt(O).buf=[];await new Promise(r=>setTimeout(r,2600));const o=oscTrace(O);R.meas=o.meas;R.d=o.d.map(x=>x.length>20);
  const pm=k=>{const m=/CH1보다 (\d+)° (앞섬|늦음)/.exec(o.meas[k]);return m?(m[2]==='앞섬'?1:-1)*+m[1]:null;};R.dphi=[pm(1),pm(2)];
  // 오실로스코프 위상 이동: CH2를 −120° 옮기면 그려진 선이 바뀜
  const d0=o.d[1];O.ph2=-120;R.shift=oscTrace(O).d[1]!==d0;O.ph2=0;
  R.svg=[document.querySelectorAll(`#bb g.c[data-id="${O.id}"] .tr4`).length,document.querySelectorAll(`#bb g.c[data-id="${O.id}"] .om4`).length];
  // 속성: 채널 탭으로 CH2 고르고 전압 바꾸기
  run([{t:'psu',k:1,x:0,y:440,v:5,on:true}]);const P=S.comps.find(c=>c.t==='psu');sel={type:'comp',id:P.id};SEL.clear();SEL.add(P.id);renderInfo();
  document.querySelector('#chSel [data-ch="1"]').click();const btn=[...document.querySelectorAll('#info [data-f="2:v"] button')].find(b=>b.dataset.v==='24');btn.click();
  document.querySelector('#info [data-f="2:on"] button[data-v="1"]').click();R.prop=[P.ch[0].v,P.ch[0].on,P.v];
  // 저장 → 다시 읽기
  const js=JSON.stringify(S.comps.map(c=>({...c})));loadComps(JSON.parse(js),true,B);const P2=S.comps.find(c=>c.t==='psu');R.rt=[P2.ch[0].v,P2.ch[0].on];
  return R;});
T('파워 서플라이 CH1 5V · CH2 12V · CH3 −12V',r.psu[0]===5&&r.psu[1]===12&&r.psu[2]===-12,r.psu.join(' / '));
T('꺼진 채널은 전압 없음 + 경고',r.off[0]!==12&&r.off[1],JSON.stringify(r.off));
T('예전 파일: CH1 그대로, CH2·CH3 꺼짐, 단자 6·6·4개',r.old[0]===9&&r.old[1]===2&&r.old[2]&&r.old[3]===2&&r.old[4]&&r.old[5]===6&&r.old[6]===6&&r.old[7]===4&&r.old[8]===3.25,JSON.stringify(r.old));
T('3상 만들기: 위상 120°·240°, 모두 켜짐, 주파수 같음',r.ph[0]===120&&r.ph[1]===240&&r.ph[2]&&r.ph[3]&&r.ph[4]===2,JSON.stringify(r.ph));
T('오실로스코프 위상차 측정 +120° / −120° (±10°)',r.dphi[0]!=null&&Math.abs(r.dphi[0]-120)<=10&&r.dphi[1]!=null&&Math.abs(r.dphi[1]+120)<=10,JSON.stringify(r.meas));
T('세 채널 선이 그려짐',r.d[0]&&r.d[1]&&r.d[2]&&!r.d[3],JSON.stringify(r.d));T('채널별 위상 이동으로 선이 옮겨짐',r.shift);T('화면에 CH4 선·측정 칸',r.svg[0]===1&&r.svg[1]===1);
T('속성 채널 탭: CH2 24V 켜기 (CH1 그대로)',r.prop[0]===24&&r.prop[1]===true&&r.prop[2]===5,JSON.stringify(r.prop));T('저장·다시 읽기에 채널 설정 남음',r.rt[0]===24&&r.rt[1]===true);
for(const x of out)console.log((x.ok?'ok  ':'BAD ')+x.k+'  '+x.msg);console.log('errors',errs);
const bad=out.filter(x=>!x.ok).length+errs.length;console.log(bad?'inst3 FAIL':'inst3 PASS');await b.close();})();
