// 28차: IC 핀 번호·기능 표시, 전선 호버 정보, 경고 카드 위치·작성 중 안 띄움, 신호 보기에서도 선 색, 한 개씩 배치, 풀 보드 2장 묶음, 저항 회로(옴의 법칙)
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
const r=await p.evaluate(()=>{const R={},B=[{id:1,type:'full',x:0,y:0}],run=cs=>{S.power=true;loadComps(cs,true,B);RT.clear();settle();render();};const v=id=>{const h=HOLES.get(id);return SIM.vOf(SIM.netOf[h.i]);};
  // 저항: 전압 나누기·LED 전류
  run([{t:'res',pins:['tp3','a3'],ohms:1000},{t:'res',pins:['b3','tn4'],ohms:9000}]);R.div=v('c3');
  run([{t:'res',pins:['tp3','a3'],ohms:10000},{t:'res',pins:['b3','tn4'],ohms:10000}]);R.div2=v('c3');
  const led=o=>{run([{t:'res',pins:['tp3','a3'],ohms:o},{t:'led',pins:['b3','b5'],color:'red'},{t:'wire',pins:['c5','tn5']}]);const c=S.comps.find(x=>x.t==='led');return{lit:(SIM.led.get(c.id)||{}).lit,i:rt(c).ai,br:(SIM.led.get(c.id)||{}).br};};
  R.l220=led(220);R.l10k=led(10000);R.l10M=led(1e7);
  // IC 핀 글씨
  run([{t:'ic',chip:'74HC00',col:10,b:1}]);const g=document.querySelector(`#gC g[data-id="${S.comps[0].id}"]`);R.icTxt=[...g.querySelectorAll('text')].map(t=>t.textContent).join(' ');
  // 전선 호버
  run([{t:'ic',chip:'74HC00',col:10,b:1},{t:'wire',pins:['a10','tp10']},{t:'wire',pins:['j12','b30']}]);const w=S.comps.find(c=>c.t==='wire');R.tip=wireTip(w);R.tip2=wireTip(S.comps.filter(c=>c.t==='wire')[1]);
  // 한 개씩 배치
  run([]);setTool('ic:74HC04');place(null,{x:300,y:200});R.toolAfter=tool;R.n1=S.comps.length;
  setTool('res');const h1=HOLES.get('a30'),h2=HOLES.get('a34');place(h1);place(h2);R.toolAfterRes=tool;R.nRes=S.comps.filter(c=>c.t==='res').length;
  // 보드 2장 묶음
  addBoardPair();const G=S.boards.filter(x=>x.grp!=null);R.pair=G.length;const x0=G.map(o=>o.x);moveBoard(G[0],G[0].x+40,G[0].y+20);R.moved=G.map((o,i)=>o.x-x0[i]);
  R.pairHoles=HOLES.has(pref(G[1].id)+'a63');save();R.saveGrp=store.get('circuit').boards.filter(x=>x.grp!=null).length;
  // 신호 보기에서도 고른 색
  run([{t:'wire',pins:['tp5','a5'],color:'#2F6FDB'}]);sigMode=true;render();const wc=S.comps[0];const st=()=>[...document.querySelectorAll(`#gC g[data-id="${wc.id}"] [stroke]`)].map(e=>e.getAttribute('stroke'));
  const s0=st();SEL.clear();SEL.add(wc.id);sel={type:'comp',id:wc.id};recolorSel('#E57A1F');const s1=st();sigMode=false;render();R.sig=[s0.includes('#2F6FDB'),s1.includes('#E57A1F')&&s1.includes(LVCOL[Hh])];
  return R;});
T('전압 나누기 1k·9k → 4.5V',Math.abs(r.div-4.5)<.01,r.div);T('전압 나누기 10k·10k → 2.5V',Math.abs(r.div2-2.5)<.01,r.div2);
T('LED 220Ω: 켜짐 · 약 13.6mA',r.l220.lit&&Math.abs(r.l220.i-.0136)<.001,JSON.stringify(r.l220));T('LED 10kΩ: 어둡게 켜짐(밝기 낮음)',r.l10k.lit&&r.l10k.br<.5,JSON.stringify(r.l10k));T('LED 10MΩ: 꺼짐',!r.l10M.lit,JSON.stringify(r.l10M));
T('IC 핀 번호·기능 늘 표시',/\b14\b/.test(r.icTxt)&&/VCC/.test(r.icTxt)&&/GND/.test(r.icTxt)&&/1A/.test(r.icTxt),r.icTxt.slice(0,80));
T('전선 호버: IC 핀 번호와 기능',/74HC00 14번 VCC/.test(r.tip),r.tip);T('전선 호버: 신호 줄',/74HC00 \d+번/.test(r.tip2),r.tip2);
T('IC 한 개 놓으면 선택 도구로',r.toolAfter==='select'&&r.n1===1,r.toolAfter);T('저항도 한 개 놓으면 선택 도구로',r.toolAfterRes==='select'&&r.nRes===1,r.toolAfterRes);
T('풀 보드 2장 묶음: 함께 움직임',r.pair===2&&r.moved.every(d=>d===40)&&r.pairHoles&&r.saveGrp===2,JSON.stringify([r.pair,r.moved,r.pairHoles,r.saveGrp]));
T('신호 보기에서도 고른 선 색 + 신호 줄',r.sig[0]&&r.sig[1],JSON.stringify(r.sig));
// 경고 카드: 작성 중에는 안 뜨고, 왼쪽 아래
const al=await p.evaluate(()=>{loadComps([],true,[{id:1,type:'full',x:0,y:0}]);closeAlerts();setTool('wire');WSEEN.clear();S.comps.push({t:'wire',id:900,pins:['tp3','tn3']});commit(true);notifyWarns();const n1=document.querySelectorAll('#alerts .alert').length;
  closeAlerts();setTool('select');WSEEN.clear();notifyWarns();const n2=document.querySelectorAll('#alerts .alert').length,cs=getComputedStyle(document.getElementById('alerts'));return{n1,n2,left:cs.left,bottom:cs.bottom,tf:cs.transform};});
T('경고: 작성 중엔 안 띄움',al.n1===0,al.n1);T('경고: 선택 도구에선 왼쪽 아래 구석',al.n2>0&&al.left==='10px'&&al.tf==='none',JSON.stringify(al));
for(const x of out)console.log((x.ok?'ok  ':'BAD ')+x.k+'  '+x.msg);console.log('errors',errs);
const bad=out.filter(x=>!x.ok).length+errs.length;console.log(bad?'r28 FAIL':'r28 PASS');await b.close();})();
