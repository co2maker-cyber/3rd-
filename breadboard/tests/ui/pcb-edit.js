// PCB 시험 2: 손으로 편집하기 — 부품 끌기·돌리기, 배선 도구로 패드→꺾기→패드, 층 바꾸기(비아), 지우기, 실행 취소,
// 내보내기 zip(거버·드릴) 구조, 저장 파일에 PCB가 들어가고 다시 불러와지는지
const {chromium}=require('playwright');const path=require('path');const zlib=require('zlib');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html')+'#nand');await p.waitForTimeout(1000);
await p.evaluate(()=>{const t=document.getElementById('tut');if(t&&!t.hidden&&typeof endTut==='function')endTut(true);});
const ok=[];const chk=(n,v)=>{ok.push(!!v);console.log((v?'ok  ':'FAIL')+' '+n);};
await p.click('[data-vm="pcb"]');await p.waitForTimeout(600);
const scr=async(x,y)=>p.evaluate(([x,y])=>{const r=pcbSvg().getBoundingClientRect();return{x:r.left+(x-pv.x)*pv.s,y:r.top+(y-pv.y)*pv.s};},[x,y]);
let s0=await p.evaluate(()=>({n:pcalc().fps.length,rats:pcalc().rats.length}));chk('PCB 화면에 부품이 놓임 '+JSON.stringify(s0),s0.n>=5&&s0.rats>0);
// 부품 끌기: U1을 오른쪽으로 5.08mm
const u=await p.evaluate(()=>{const f=PCB.fps.find(f=>f.key.includes(':ic'));return{key:f.key,x:f.x,y:f.y};});
let a=await scr(u.x,u.y);await p.mouse.move(a.x,a.y);await p.mouse.down();await p.mouse.move(a.x+20,a.y,{steps:4});let bb=await scr(u.x+5.08,u.y);await p.mouse.move(bb.x,bb.y,{steps:4});await p.mouse.up();
const u2=await p.evaluate(k=>{const f=PCB.fps.find(f=>f.key===k);return{x:f.x,y:f.y};},u.key);chk(`부품 끌기 ${u.x}→${u2.x}`,Math.abs(u2.x-u.x-5.08)<.01&&u2.y===u.y);
await p.keyboard.press('r');chk('R로 돌리기',await p.evaluate(k=>PCB.fps.find(f=>f.key===k).rot===90,u.key));
await p.keyboard.press('Control+z');await p.keyboard.press('Control+z');
chk('실행 취소 2번 → 처음 자리',await p.evaluate(([k,x])=>{const f=PCB.fps.find(f=>f.key===k);return f.rot===0&&Math.abs(f.x-x)<.01;},[u.key,u.x]));
// 배선: 첫 래츠네스트의 두 패드를 잇는다(가운데 한 번 꺾기)
const r=await p.evaluate(()=>{const r=pcalc().rats[0];return{a:{x:r.a.x,y:r.a.y},b:{x:r.b.x,y:r.b.y},n:pcalc().rats.length};});
await p.keyboard.press('t');
a=await scr(r.a.x,r.a.y);await p.mouse.click(a.x,a.y);
const mid=await scr(r.b.x,r.a.y);await p.mouse.click(mid.x,mid.y);
await p.keyboard.press('v');   // 층 바꾸기 → 비아
bb=await scr(r.b.x,r.b.y);await p.mouse.click(bb.x,bb.y);await p.waitForTimeout(100);
const s1=await p.evaluate(()=>({tr:PCB.tr.length,vias:PCB.vias.length,rats:pcalc().rats.length,layers:[...new Set(PCB.tr.map(t=>t.l))].join(''),route:!!proute}));
chk('손 배선: 선 2개·비아 1개·래츠 하나 줄어듦 '+JSON.stringify(s1),s1.tr>=2&&s1.vias===1&&s1.rats===r.n-1&&s1.layers.length===2&&!s1.route);
console.log('     (손 배선 점검: '+(await p.evaluate(()=>pcbDRC().filter(e=>e.k==='bad').map(e=>e.t).join(' / ')||'오류 없음'))+')');
await p.keyboard.press('Escape');await p.keyboard.press('Control+z');
chk('배선 실행 취소 한 번에 지워짐',await p.evaluate(()=>PCB.tr.length===0&&PCB.vias.length===0));
// 자동 배선 → 선 하나 지우기
await p.click('#pRoute');await p.waitForTimeout(800);
const s2=await p.evaluate(()=>({tr:PCB.tr.length,rats:pcalc().rats.length}));chk('[자동 배선] 버튼 '+JSON.stringify(s2),s2.tr>0&&s2.rats===0);
const t=await p.evaluate(()=>{const t=PCB.tr.find(t=>Math.hypot(t.a.x-t.b.x,t.a.y-t.b.y)>3);return{x:(t.a.x+t.b.x)/2,y:(t.a.y+t.b.y)/2,id:t.id,l:t.l};});
await p.keyboard.press('s');if(t.l!==(await p.evaluate(()=>player)))await p.evaluate(()=>{player=player==='F'?'B':'F';renderPcb();});
a=await scr(t.x,t.y);await p.mouse.click(a.x,a.y);
chk('선 누르면 고르기',await p.evaluate(id=>psel&&psel.type==='seg'&&psel.id===id,t.id));
await p.keyboard.press('Delete');chk('Delete로 선 지움 → 래츠 생김',await p.evaluate(()=>pcalc().rats.length>=1));
// 내보내기 zip 구조
const z=await p.evaluate(()=>{const G=pcbGerbers();const zip=makeZip([['a.gtl',G.cu.F],['b.drl',G.drl]]);return{b64:btoa(String.fromCharCode(...zip)),F:G.cu.F,drl:G.drl,edge:G.edge,silk:G.silk};});
const buf=Buffer.from(z.b64,'base64');chk('zip 머리·끝 표시',buf.readUInt32LE(0)===0x04034b50&&buf.readUInt32LE(buf.length-22)===0x06054b50);
const n1=buf.readUInt16LE(26),l1=buf.readUInt32LE(18),body=buf.slice(30+n1,30+n1+l1).toString('utf8');chk('zip 안 파일 = 거버 내용',body===z.F);
chk('거버: 형식·단위·끝',/%FSLAX46Y46\*%/.test(z.F)&&/%MOMM\*%/.test(z.F)&&/M02\*\n$/.test(z.F)&&/D03\*/.test(z.F)&&/D01\*/.test(z.F));
chk('드릴: Excellon 머리·공구·끝',/^M48\n/.test(z.drl)&&/METRIC/.test(z.drl)&&/T1C\d/.test(z.drl)&&/M30\n$/.test(z.drl));
chk('외곽선 4변',(z.edge.match(/D01\*/g)||[]).length===4);
chk('실크에 부품 이름 글자',(z.silk.match(/D01\*/g)||[]).length>40);
// 저장 파일에 PCB
const sv=await p.evaluate(()=>{const d=JSON.parse(JSON.stringify(circuitData()));return{has:!!d.pcb&&d.pcb.tr.length>0,n:d.pcb.tr.length,d};});
chk('저장 파일에 PCB 들어감',sv.has);
await p.evaluate(()=>{loadComps([],false);});chk('새 회로 → PCB 비움',await p.evaluate(()=>PCB.tr.length===0&&PCB.fps.length===0));
await p.evaluate(d=>{loadComps(d.comps,false,d.boards);schLoadIf(d.sch,d.comps);pcbLoadIf(d.pcb);},sv.d);await p.waitForTimeout(300);
chk('불러오면 PCB 선 그대로',await p.evaluate(n=>PCB.tr.length===n&&pcalc().fps.length>=5,sv.n));
chk('페이지 오류 없음 '+errs.join('|'),!errs.length);
console.log(ok.every(Boolean)?'pcb-edit PASS':'pcb-edit FAIL');await b.close();})();
