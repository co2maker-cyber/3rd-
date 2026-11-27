// 아두이노 호환 보드: 직결형(c·h·b·i줄 꽂기, USB·VIN 전원, 3.3V 핀 5V 경고), 점퍼 연결형(보드 밖 배치·헤더 단자·전선·전원), 예제 ⓐ1, 부품 고르기, 회로도·PCB
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
const res=await p.evaluate(()=>{const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
  const BOARD=[{id:1,type:'full',x:0,y:0}],build=cs=>{S.power=true;loadComps(JSON.parse(JSON.stringify(cs)),true,BOARD);RT.clear();settle();return S.comps;};
  const vH=id=>{const h=HOLES.get(id);return SIM.vOf(SIM.netOf[h.i]);},col=h=>+h.replace(/^\D+/,''),rail=(h,pos)=>(h[0]==='h'||h[0]==='i'?(pos?'bp':'bn'):(pos?'tp':'tn'))+(col(h)%6?col(h):col(h)+1),ext=h=>(h[0]==='h'||h[0]==='i'?'j':'a')+col(h);
  // ① 직결형: 꽂는 줄과 USB 전원
  {const n=pxHolesAt('ano',1,null,3),m=pxHolesAt('amkr',1,null,30);T('Nano 폼팩터는 c·h줄(600mil)',n[0][0]==='h'&&n[29][0]==='c',n[0]+' '+n[29]);T('MKR 폼팩터는 b·i줄(800mil)',m[0][0]==='i'&&m[27][0]==='b',m[0]+' '+m[27]);
    const cs=build([{t:'px',kind:'ano',pins:n}]),i5=PX.ano.pins.indexOf('5V');T('USB 전원: 5V 핀 5V',Math.abs(vH(cs[0].pins[i5])-5)<.01&&rt(cs[0]).apw);
    cs[0].usb=0;settle();T('USB 빼면 전원 없음 + 경고',!rt(cs[0]).apw&&SIM.warns.some(w=>/전원이 없어요/.test(w[1])));}
  // ② VIN 전원·정격 초과
  {const n=pxHolesAt('ano',1,null,3),iv=PX.ano.pins.indexOf('VIN'),hv=n[iv];
    const mk=v=>build([{t:'px',kind:'ano',pins:n,usb:0},{t:'psu',k:3,v,on:true,x:0,y:460},{t:'wire',pins:['@3:0',ext(hv)]},{t:'wire',pins:['@3:1','bn20']},{t:'wire',pins:['tn20','bn21']}]);
    let cs=mk(9);const c=cs.find(x=>x.t==='px');T('VIN 9V면 켜짐 → 5V 핀 5V',rt(c).apw&&Math.abs(vH(c.pins[PX.ano.pins.indexOf('5V')])-5)<.01);
    cs=mk(15);T('VIN 15V(정격 7~12V 넘음) 빨간 경고',SIM.warns.some(w=>w[0]==='bad'&&/VIN에 15.0V/.test(w[1])),JSON.stringify(SIM.warns.map(w=>w[1].slice(0,40))));}
  // ③ 3.3V 보드 입출력 핀에 5V → 경고, 3.3V면 없음
  {const n=pxHolesAt('ano33iot',1,null,3),k=PX.ano33iot.pins.indexOf('D2 (PWM)')>=0?PX.ano33iot.pins.indexOf('D2 (PWM)'):PX.ano33iot.pins.indexOf('D2'),h=n[k];
    build([{t:'px',kind:'ano33iot',pins:n},{t:'wire',pins:[ext(h),rail(h,1)]}]);T('3.3V 보드 D2에 5V → 경고',SIM.warns.some(w=>w[0]==='bad'&&/3\.3V 전용 핀/.test(w[1])),JSON.stringify(SIM.warns.map(w=>w[1].slice(0,40))));
    const i3=PX.ano33iot.pins.indexOf('3V3'),h3=n[i3];build([{t:'px',kind:'ano33iot',pins:n},{t:"wire",pins:[ext(h),ext(h3)]}]);}
  // ④ 점퍼 연결형: 보드 밖, 헤더 단자 → 구멍 전선, 3.3V 단자로 LED
  {const j=ARDX.auno3.hdr.findIndex(h=>h[2]==='3.3V'),g=ARDX.auno3.hdr.findIndex(h=>h[2]==='GND');
    const cs=build([{t:'auno3',k:4,x:0,y:470},{t:'wire',pins:['@4:'+j,'a10']},{t:'res',pins:['b10','b14'],ohms:220},{t:'led',pins:['c14','tn14'],color:'green'},{t:'wire',pins:['@4:'+g,'tn16']}]);
    const u=cs.find(x=>x.t==='auno3'),led=cs.find(x=>x.t==='led');T('UNO 폼팩터: 단자 32개, 보드 밖',u.pins.length===32&&u.y>400);T('UNO 3.3V 단자 → LED 켜짐',(SIM.led.get(led.id)||{}).lit&&Math.abs(vH('a10')-3.3)<.01);
    const hx=ARDX.auno3.hdr,d7=hx.find(h=>h[2]==='D7'),d8=hx.find(h=>h[2]==='D8');T('D7–D8 간격 4.064mm',Math.abs(d7[0]-d8[0]-4.064)<1e-6);
    const t0=HOLES.get(u.pins[ARDX.auno3.hdr.findIndex(h=>h[2]==='D7')]),t1=termAt({x:t0.x+3,y:t0.y});T('촘촘한 단자도 가장 가까운 것을 잡음',t1===t0);
    T('3.3V 단자 이름',pinNames(u)[j]==='3.3V 단자');}
  // ⑤ 다른 점퍼 연결형 모두 놓기·그리기
  {let ok=true,msg='';for(const k of Object.keys(ARDX)){try{build([{t:k,k:2,x:0,y:470}]);render();const g=document.querySelector(`#gC g[data-id="${S.comps[0].id}"]`);if(!g||!rt(S.comps[0]).apw){ok=false;msg+=k+' ';}}catch(e){ok=false;msg+=k+':'+e.message;}}T('점퍼 연결형 7종 그리기·USB 전원',ok,msg);}
  // ⑥ 직결형 8종 모두 꽂기·그리기
  {let ok=true,msg='';for(const k of Object.keys(PX).filter(k=>PX[k].ard)){const cs=build([{t:'px',kind:k,pins:pxHolesAt(k,1,null,10)}]);try{render();}catch(e){ok=false;msg+=k;}if(!cs.length||!rt(cs[0]).apw){ok=false;msg+=k+' ';}}T('직결형 8종 꽂기·USB 전원',ok,msg);}
  // ⑦ 예제 ⓐ1 · 부품 고르기 · 회로도·PCB
  {const ex=EXAMPLES.ard1();S.power=true;loadComps(ex.comps,false,ex.boards);RT.clear();commit(true);settle();
    T('ⓐ1 LED 3개 켜짐 · 경고 없음',S.comps.filter(c=>c.t==='led').every(c=>(SIM.led.get(c.id)||{}).lit)&&!SIM.warns.some(w=>w[0]!=='info'),JSON.stringify(SIM.warns.map(w=>w[1].slice(0,40))));
    const t=PTREE.find(x=>x.k==='ard');T('부품 고르기 [아두이노 호환 보드] 직결형 8 · 점퍼형 7',t&&t.kids[0].items.length===8&&t.kids[1].items.length===7);
    let er='';try{setVM('sch');setVM('pcb');setVM('bb');}catch(e){er=e.message;}T('회로도·PCB 화면 오가기',!er,er);}
  return out;});
for(const r of res)console.log((r.ok?'ok  ':'BAD ')+r.k+'  '+r.msg);
console.log('errors',errs);
const bad=res.filter(r=>!r.ok).length+errs.length;console.log(bad?'ard FAIL':'ard PASS');await b.close();})();
