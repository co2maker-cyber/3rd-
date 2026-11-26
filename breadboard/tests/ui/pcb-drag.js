// PCB 끌기·지우개: 마우스로 빈 곳을 끌면 범위 선택 → 고른 것 함께 옮기기(붙은 선 끝이 따라와 연결 유지) → 되돌리기,
// 지우개로 누르기·문지르기(한 번 = 되돌리기 한 번), 손가락: 빈 곳 끌면 화면 이동, 지우개는 손가락으로 문질러 지움
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg||''}),errs=[];
const open=async ctx=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(800);
  await p.evaluate(()=>{const e2=EXAMPLES.pasdio();S.power=true;loadComps(e2.comps,false,e2.boards);commit(true);setVM('pcb');$('pside').hidden=true;pcbAutoRoute();pcbFit();});await p.waitForTimeout(400);return p;};
const scr=p=>p.evaluate(()=>{const r=pcbSvg().getBoundingClientRect();window.__toS=(x,y)=>({x:r.left+(x-pv.x)*pv.s,y:r.top+(y-pv.y)*pv.s});return 1;});
const att=p=>p.evaluate(()=>{const C=pcalc(),near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<.05;let ok=0,all=0;for(const t of PCB.tr)for(const e of [t.a,t.b]){all++;if(C.pads.some(q=>near(q,e))||PCB.vias.some(v=>near(v,e))||PCB.tr.some(u=>u!==t&&(near(u.a,e)||near(u.b,e))))ok++;}return{ok,all,rats:C.rats.length};});
// ── 마우스
{const ctx=await b.newContext({viewport:{width:1300,height:850}}),p=await open(ctx);await scr(p);
  const a0=await att(p);T('자동 배선 뒤 모든 선 끝이 이어짐',a0.ok===a0.all&&a0.rats===0,JSON.stringify(a0));
  const R=await p.evaluate(()=>({a:__toS(-3,-3),b:__toS(PCB.w/2,PCB.h+3)}));
  await p.mouse.move(R.a.x,R.a.y);await p.mouse.down();await p.mouse.move(R.b.x,R.b.y,{steps:10});await p.mouse.up();
  const sel=await p.evaluate(()=>psel&&psel.type==='multi'?{fps:psel.fps.length,segs:psel.segs.length}:null);T('빈 곳을 끌면 범위 선택',sel&&sel.fps>3&&sel.segs>3,JSON.stringify(sel));
  const m=await p.evaluate(()=>{const k=psel.fps[0],el=document.querySelector(`#pcb [data-fp="${k}"]`).getBoundingClientRect();return{k,y:PCB.fps.find(f=>f.key===k).y,cx:el.x+el.width/2,cy:el.y+el.height/2,ys:PCB.fps.filter(f=>psel.fps.includes(f.key)).map(f=>f.y)};});
  await p.mouse.move(m.cx,m.cy);await p.mouse.down();await p.mouse.move(m.cx,m.cy+80,{steps:10});await p.mouse.up();
  const mv=await p.evaluate(m=>{const ys=PCB.fps.filter(f=>psel.fps.includes(f.key)).map(f=>f.y);return[...new Set(ys.map((y,i)=>+(y-m.ys[i]).toFixed(3)))];},m),a1=await att(p);
  T('고른 부품이 함께 같은 만큼 옮겨짐',mv.length===1&&mv[0]>0,JSON.stringify(mv));T('옮겨도 선 끝이 패드·비아에 붙어 있음',a1.ok===a1.all&&a1.rats===0,JSON.stringify(a1));
  await p.keyboard.press('Control+z');T('Ctrl+Z로 한 번에 되돌림',await p.evaluate(m=>PCB.fps.find(f=>f.key===m.k).y===m.y,m),'');
  // 부품 하나 끌기(예전처럼)
  await p.mouse.click(5,300);await scr(p);const one=await p.evaluate(()=>{const f=PCB.fps[PCB.fps.length-1],el=document.querySelector(`#pcb [data-fp="${f.key}"]`).getBoundingClientRect();return{k:f.key,x:f.x,cx:el.x+el.width/2,cy:el.y+el.height/2};});
  await p.mouse.move(one.cx,one.cy);await p.mouse.down();await p.mouse.move(one.cx-60,one.cy,{steps:8});await p.mouse.up();T('부품 하나 끌어 옮기기',await p.evaluate(o=>PCB.fps.find(f=>f.key===o.k).x<o.x,one),'');
  // 지우개
  await p.keyboard.press('e');T('E 키로 지우개',await p.evaluate(()=>ptool==='erase'),'');await scr(p);
  const n0=await p.evaluate(()=>PCB.tr.length),c=await p.evaluate(()=>{const t=PCB.tr[0];return __toS((t.a.x+t.b.x)/2,(t.a.y+t.b.y)/2);});
  await p.mouse.click(c.x,c.y);const n1=await p.evaluate(()=>PCB.tr.length);T('지우개로 선 누르면 지워짐',n1===n0-1,n0+' → '+n1);
  const L=await p.evaluate(()=>({l:__toS(0,PCB.h/2),r:__toS(PCB.w,PCB.h/2)}));await p.mouse.move(L.l.x,L.l.y);await p.mouse.down();await p.mouse.move(L.r.x,L.r.y,{steps:30});await p.mouse.up();
  const n2=await p.evaluate(()=>PCB.tr.length);T('문지르면 지나간 선이 지워짐',n2<n1-3,n1+' → '+n2);
  await p.keyboard.press('Control+z');T('문지른 것 한 번에 되돌림',await p.evaluate(()=>PCB.tr.length)===n1,'');
  // 범위 선택 → Delete
  await p.keyboard.press('s');await scr(p);const R2=await p.evaluate(()=>({a:__toS(-3,-3),b:__toS(PCB.w+3,PCB.h+3)}));await p.mouse.move(R2.a.x,R2.a.y);await p.mouse.down();await p.mouse.move(R2.b.x,R2.b.y,{steps:6});await p.mouse.up();
  await p.keyboard.press('Delete');const d=await p.evaluate(()=>({tr:PCB.tr.length,via:PCB.vias.length,fps:PCB.fps.length}));T('전체 범위 선택 → Delete: 선·비아만 지움',d.tr===0&&d.via===0&&d.fps>10,JSON.stringify(d));
  await ctx.close();}
// ── 손가락
{const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),p=await open(ctx),cdp=await ctx.newCDPSession(p);
  const tp=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
  const swipe=async(a,b_,n)=>{await tp('touchStart',[a]);for(let i=1;i<=n;i++)await tp('touchMove',[{x:a.x+(b_.x-a.x)*i/n,y:a.y+(b_.y-a.y)*i/n}]);await tp('touchEnd',[]);};
  await scr(p);const pv0=await p.evaluate(()=>[pv.x,pv.y]),e=await p.evaluate(()=>__toS(PCB.w+4,-4));
  await swipe(e,{x:e.x-60,y:e.y+80},8);const pv1=await p.evaluate(()=>[pv.x,pv.y]);T('손가락: 빈 곳 끌면 화면 이동',pv1[0]!==pv0[0]||pv1[1]!==pv0[1],'');
  await p.evaluate(()=>{pcbFit();setPTool('erase');});await scr(p);const n0=await p.evaluate(()=>PCB.tr.length),L=await p.evaluate(()=>({l:__toS(0,PCB.h/2),r:__toS(PCB.w,PCB.h/2)}));
  await swipe(L.l,L.r,30);const n1=await p.evaluate(()=>PCB.tr.length);T('손가락: 지우개로 문질러 지움',n1<n0,n0+' → '+n1);
  await ctx.close();}
for(const r of out)console.log((r.ok?'ok  ':'BAD ')+r.k+'  '+r.msg);console.log('errors',errs);
const bad=out.filter(r=>!r.ok).length+errs.length;console.log(bad?'pcb-drag FAIL':'pcb-drag PASS');await b.close();})();
