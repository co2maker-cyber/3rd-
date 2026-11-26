// PCB 시험 4: PCB에서 부품 놓기(회로도·브레드보드에도 들어감)·장착 구멍·지우기·되돌리기, PCB 연결 → 회로도 반영,
// 층 쌓기(1·2·4·6층, 안쪽 신호 층·GND/VCC 판), 여러 층 자동 배선, 층별 거버·드릴(NPTH)·README, 저장·불러오기
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
const ok=[];const chk=(n,v,x)=>{ok.push(!!v);console.log((v?'ok  ':'FAIL')+' '+n+(x?' '+x:''));};
const scr=async(x,y)=>p.evaluate(([x,y])=>{const r=pcbSvg().getBoundingClientRect();return{x:r.left+(x-pv.x)*pv.s,y:r.top+(y-pv.y)*pv.s};},[x,y]);
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(1000);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);loadComps([],false);});
await p.click('[data-vm="pcb"]');await p.waitForTimeout(500);
await p.evaluate(()=>{PCB.w=50;PCB.h=40;pCommit();pcbFit();});
// ① [부품] 버튼 → 부품 고르기 창(PCB 목록) → 저항 → 누른 자리에 놓기
await p.click('#pAdd');await p.waitForTimeout(150);
chk('PCB 부품 목록 맨 앞 = PCB 기구',await p.evaluate(()=>!!document.querySelector('#partGrid [data-pf="pcbx"]')&&!document.querySelector('#partGrid [data-pf="pwr"]')));
await p.fill('#partQ','저항');await p.waitForTimeout(100);await p.click('#partGrid [data-pt="res"]');
let a=await scr(15,10);await p.mouse.move(a.x-10,a.y);await p.mouse.move(a.x,a.y);
chk('놓기 미리보기',await p.evaluate(()=>ptool==='place'&&document.querySelectorAll('#pcb .pghost').length===1));
await p.mouse.click(a.x,a.y);await p.waitForTimeout(150);
let r=await p.evaluate(()=>({fps:PCB.fps.map(f=>[f.key,f.x,f.y]),sch:SCH.parts.map(q=>q.t),bb:S.comps.map(c=>c.t),tool:ptool}));
chk('저항 놓음 → 회로도·브레드보드에도',r.fps.length===1&&r.sch.join()==='res'&&r.bb.includes('res')&&r.tool==='select'&&Math.abs(r.fps[0][1]-15.24)<.01,JSON.stringify(r));
// LED: 더블클릭으로 화면 가운데, 장착 구멍
await p.evaluate(()=>{pcbPick('led');pcbPlaceAt({x:15,y:25});pcbPick('pcb:mh3');pcbPlaceAt({x:42,y:32});setPTool('select');});
r=await p.evaluate(()=>{const C=pcalc();return{refs:C.fps.map(f=>C.byKey.get(f.key).ref),np:C.pads.filter(q=>q.np).length,xp:PCB.xp.length};});
chk('LED·장착 구멍 H1',r.refs.join()==='R1,D1,H1'&&r.np===1&&r.xp===1,JSON.stringify(r));
// ② 손으로 이은 연결 → 회로도 반영
r=await p.evaluate(()=>{const C=pcalc(),A=C.pads.find(q=>q.P.ref==='R1'&&q.k===0),B=C.pads.find(q=>q.P.ref==='D1'&&q.k===0);pPush();
  PCB.tr.push({id:PCB.nextId++,l:'B',w:.4,a:{x:A.x,y:A.y},b:{x:A.x,y:B.y}},{id:PCB.nextId++,l:'B',w:.4,a:{x:A.x,y:B.y},b:{x:B.x,y:B.y}});pCommit();
  return{dry:pcbToSch(true),bad:pcbDRC().filter(e=>e.k==='bad').map(e=>e.t)};});
chk('PCB에서 이은 연결 1개 · 점검 오류 없음',r.dry===1&&!r.bad.length,JSON.stringify(r));
await p.click('[data-pa="tosch"]');await p.waitForTimeout(150);
r=await p.evaluate(()=>({dry:pcbToSch(true),w:SCH.wires.length,bbw:S.comps.filter(c=>c.t==='wire').length,names:pcalc().pads.filter(q=>!q.np).map(q=>q.name)}));
chk('[회로도에 반영] → 회로도 선·브레드보드 전선',r.dry===0&&r.w===1&&r.bbw===1&&r.names[0]===r.names[2],JSON.stringify(r));
await p.keyboard.press('Control+z');r=await p.evaluate(()=>({w:SCH.wires.length,tr:PCB.tr.length}));chk('실행 취소 → 회로도 선도 빠짐',r.w===0&&r.tr===2,JSON.stringify(r));
await p.keyboard.press('Control+y');chk('다시 실행',await p.evaluate(()=>SCH.wires.length===1));
// ③ 하나 골라 Delete → 회로도에서도, 되돌리면 같은 자리
const led=await p.evaluate(()=>{const f=PCB.fps.find(f=>/:led$/.test(f.key));psel={type:'fp',key:f.key};renderPcb();return{x:f.x,y:f.y};});
await p.keyboard.press('Delete');r=await p.evaluate(()=>({sch:SCH.parts.map(q=>q.t),fps:PCB.fps.length}));chk('부품 지우기 → 회로도에서도',r.sch.join()==='res'&&r.fps===2,JSON.stringify(r));
await p.keyboard.press('Control+z');r=await p.evaluate(()=>{const C=pcalc(),f=C.fps.find(f=>/:led$/.test(f.key));return f&&{x:f.x,y:f.y,sch:SCH.parts.length};});
chk('되돌리면 LED가 같은 자리로',r&&r.x===led.x&&r.y===led.y&&r.sch===2,JSON.stringify(r));
await p.evaluate(()=>{psel={type:'fp',key:'m1'};renderPcb();});await p.keyboard.press('Delete');chk('장착 구멍 지우기',await p.evaluate(()=>!PCB.xp.length&&!PCB.fps.some(f=>f.key==='m1')));
await p.keyboard.press('Control+z');
// ④ 층 쌓기: 예제 회로로
await p.goto('file://'+path.join(__dirname,'../../index.html')+'#nand');await p.waitForTimeout(900);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
await p.click('[data-vm="pcb"]');await p.waitForTimeout(500);
const rats2=await p.evaluate(()=>pcalc().rats.length);
await p.selectOption('#pNL','4');await p.waitForTimeout(100);
r=await p.evaluate(()=>({nl:PCB.nl,LS:pLayers(),sig:pSig(),planes:pcalc().planes.map(x=>x.L+':'+x.name),rats:pcalc().rats.length,rows:document.querySelectorAll('.pst.cu').length}));
chk('4층: In1 GND 판·In2 VCC 판 → 전원 연결은 판으로 이어짐',r.nl===4&&r.sig.join()==='F,B'&&r.planes.join()==='In1:GND,In2:VCC'&&r.rats<rats2&&r.rows===4,JSON.stringify(r)+' 2층 래츠 '+rats2);
await p.click('#pRoute');await p.waitForTimeout(900);
r=await p.evaluate(()=>({rats:pcalc().rats.length,lay:[...new Set(PCB.tr.map(t=>t.l))],bad:pcbDRC().filter(e=>e.k==='bad').length}));chk('4층 자동 배선',r.rats===0&&!r.bad&&r.lay.every(L=>L==='F'||L==='B'),JSON.stringify(r));
let G=await p.evaluate(()=>{const G=pcbGerbers();return{files:G.files('x').map(f=>f[0]),In1:G.cu.In1,F:G.cu.F,readme:G.readme,drl:G.drl};});
chk('거버 4층 파일',['x-F_Cu.gtl','x-In1_Cu.g1','x-In2_Cu.g2','x-B_Cu.gbl','x-F_Mask.gts','x-B_Mask.gbs','x-Edge_Cuts.gm1','x.drl'].every(f=>G.files.includes(f)),G.files.join(' '));
chk('판 거버: L2 Inr Plane·영역·지우기 극성·서멀',/Copper,L2,Inr,Plane/.test(G.In1)&&/G36\*/.test(G.In1)&&/G37\*/.test(G.In1)&&/%LPC\*%/.test(G.In1)&&/%LPD\*%\nD\d+\*\n.*D02/.test(G.In1)&&/M02\*\n$/.test(G.In1));
chk('겉 층: L1 Top Signal',/Copper,L1,Top,Signal/.test(G.F));
chk('README 층 순서',/L1 앞면\(F\)[\s\S]*L2 안쪽 1\(In1\)[\s\S]*GND 판[\s\S]*L4 뒷면\(B\)/.test(G.readme)&&/4층/.test(G.readme));
chk('드릴 PTH 1~4층 표시',/Plated,1,4,PTH/.test(G.drl));
// 안쪽 층을 신호로 → 선을 그릴 수 있고 자동 배선이 써요
await p.selectOption('[data-it="0"]','sig');await p.waitForTimeout(100);
r=await p.evaluate(()=>({sig:pSig(),planes:pcalc().planes.length}));chk('In1 신호 층',r.sig.join()==='F,In1,B'&&r.planes===1,JSON.stringify(r));
await p.click('#pLayerB');chk('층 버튼: 앞면 → In1',await p.evaluate(()=>player==='In1'&&document.getElementById('pLayer').textContent==='In1'));
// 안쪽 신호 층만 써서 배선: 바깥 층을 막은 듯이 F·B 선을 In1으로 옮겨도 점검 통과
r=await p.evaluate(()=>{PCB.tr.forEach(t=>t.l='In1');pcache=null;const n=pcbDRC().filter(e=>e.k==='bad').length;PCB.tr=[];PCB.vias=[];pcache=null;pcbAutoRoute();return{n,rats:pcalc().rats.length,bad:pcbDRC().filter(e=>e.k==='bad').length,L:[...new Set(PCB.tr.map(t=>t.l))]};});
chk('신호 층 3장 자동 배선',r.rats===0&&!r.bad,JSON.stringify(r));
// 6층, 1층
await p.selectOption('#pNL','6');await p.waitForTimeout(100);
G=await p.evaluate(()=>({LS:pLayers(),f:pcbGerbers().files('x').map(f=>f[0]).filter(f=>/_Cu\./.test(f))}));chk('6층 구리 파일 6장',G.f.length===6&&G.f.includes('x-In4_Cu.g4'),G.f.join(' '));
await p.selectOption('#pNL','1');await p.waitForTimeout(100);
r=await p.evaluate(()=>{pcbAutoRoute();const G=pcbGerbers();return{LS:pLayers(),vias:PCB.vias.length,lay:[...new Set(PCB.tr.map(t=>t.l))],files:G.files('x').map(f=>f[0]),B:/Copper,L1,Bot/.test(G.cu.B)};});
chk('1층: 뒷면만·비아 없음·F 구리·F 마스크 없음',r.LS.join()==='B'&&!r.vias&&r.lay.every(L=>L==='B')&&!r.files.includes('x-F_Cu.gtl')&&!r.files.includes('x-F_Mask.gts')&&r.B,JSON.stringify(r));
// 저장 → 불러오기
await p.selectOption('#pNL','4');await p.evaluate(()=>{pSetInner(1,{t:'sig'});pAction('mh4');});
const sv=await p.evaluate(()=>JSON.parse(JSON.stringify(circuitData())));
chk('저장 파일에 층·판·구멍',sv.pcb.nl===4&&sv.pcb.inner[0].t==='plane'&&sv.pcb.inner[1].t==='sig'&&sv.pcb.xp.length===4,JSON.stringify({nl:sv.pcb.nl,inner:sv.pcb.inner,xp:sv.pcb.xp.length}));
await p.evaluate(()=>{loadComps([],false);});
await p.evaluate(d=>{loadComps(d.comps,false,d.boards);schLoadIf(d.sch,d.comps);pcbLoadIf(d.pcb);},sv);await p.waitForTimeout(200);
r=await p.evaluate(()=>({nl:PCB.nl,sig:pSig(),np:pcalc().pads.filter(q=>q.np).length,npth:!!pcbGerbers().npth}));chk('불러오면 그대로·NPTH 드릴',r.nl===4&&r.sig.join()==='F,In2,B'&&r.np===4&&r.npth,JSON.stringify(r));
// 이상한 값 막기
r=await p.evaluate(()=>{pcbLoad({w:30,h:30,nl:3,inner:[{t:'x'}],xp:[{key:'bad',kind:'mh3'},{key:'m1',kind:'zz'}],tr:[{l:'In3',w:.4,a:{x:1,y:1},b:{x:2,y:2}}]});return{nl:PCB.nl,xp:PCB.xp.length,l:PCB.tr[0].l,inner:PCB.inner.length};});
chk('잘못된 층 값 정리',r.nl===2&&r.xp===0&&r.l==='B'&&r.inner===0,JSON.stringify(r));
chk('페이지 오류 없음 '+errs.join('|'),!errs.length);
console.log(ok.every(Boolean)?'pcb-layers PASS':'pcb-layers FAIL');await b.close();})();
