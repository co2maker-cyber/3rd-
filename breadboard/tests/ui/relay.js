// 릴레이·솔레노이드·코일 예제(Ⓟ5): 스위치·버튼대로 코일이 붙고 접점·LED가 바뀌는지, 자기유지, SSR, 경고, 회로도 쪽 동작, 아이콘·속성 오류 없음
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
const res=await p.evaluate(()=>{const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg});
  const ex=EXAMPLES.pasrly();S.power=true;loadComps(ex.comps,false,ex.boards);orthoWires();RT.clear();commit(true);settle();
  const px=k=>S.comps.filter(c=>c.t==='px'&&c.kind===k);const on=c=>rlyOn(c,rt(c));
  const ledLit=()=>S.comps.filter(c=>c.t==='led').map(c=>(SIM.led.get(c.id)||{}).lit?1:0).join('');
  const sws=S.comps.filter(c=>c.t==='sw');const set=(i,v)=>{sws[i].on=v;settle();};
  // 스위치 순서: 리드, 큐브(IN1), 솔레노이드(IN2), SSR
  const st0=[on(px('reed')[0]),on(px('rlyc')[0]),!!rt(px('sol')[0]).on,on(px('ssr')[0])];T('처음 모두 꺼짐',st0.every(x=>!x),st0.join(','));
  const l0=ledLit();
  set(0,true);T('리드 릴레이 켜짐',on(px('reed')[0]),fmtV(rt(px('reed')[0]).dv||0));
  set(1,true);const c=px('rlyc')[0];T('큐브 릴레이(DRV-SINK8) 켜짐',on(c),fmtV(rt(c).dv||0));
  set(2,true);T('솔레노이드 당김',rt(px('sol')[0]).on,'');
  set(3,true);T('SSR 켜짐',on(px('ssr')[0]),'');
  const l1=ledLit();T('LED가 바뀜',l0!==l1,l0+' → '+l1);
  T('경고 없음(드라이버·COM 연결)',!SIM.warns.some(w=>w[0]!=='info'||/역전압/.test(w[1])),JSON.stringify(SIM.warns.map(w=>w[1].slice(0,40))));
  // 자기유지: 시작 버튼 누름 → 놓아도 유지 → 정지 누름 → 떨어짐
  const R=px('rlyd')[0],st=px('tact6')[0],sp=px('pushm')[0];
  T('자기유지 처음 꺼짐',!on(R),'');rt(st).pr=1;settle();const a1=on(R);delete rt(st).pr;settle();const a2=on(R);rt(sp).pr=1;settle();const a3=on(R);delete rt(sp).pr;settle();const a4=on(R);
  T('자기유지 동작',a1&&a2&&!a3&&!a4,[a1,a2,a3,a4].join(','));
  // 정격 12V 코일에 5V → 안 붙음 + 경고
  c.cv=12;RT.delete(c.id);settle();T('12V 코일에 5V: 안 붙음·경고',!on(c)&&SIM.warns.some(w=>/정격 12V/.test(w[1])),'');c.cv=5;settle();
  // IC 출력으로 바로: 74HC04 없이 확인 — 큐브 릴레이 코일 정격 전류
  T('코일 저항 5V 큐브 약 69Ω',Math.abs(coilR(c)-69)<2,coilR(c)+'Ω');
  // 래칭: +로 SET, 반대로 RESET, 빼면 유지
  const Lr={t:'px',kind:'rlyl',cv:5,s:0};const r0={};coilUpd(Lr,r0,5);const s1=Lr.s;coilUpd(Lr,r0,0);const s2=Lr.s;coilUpd(Lr,r0,-5);const s3=Lr.s;T('래칭 SET·유지·RESET',s1===1&&s2===1&&s3===0,[s1,s2,s3].join(''));
  // 버저: 코일을 자기 NC 접점으로 끊는 회로 → 떨림 알림, 오류 없음
  // 인덕터: 직류로 이어짐(LED 켜짐)
  const ind=px('indr')[0],net=i=>SIM.netOf[HOLES.get(ind.pins[i]).i];T('인덕터 직류 통과',net(0)===net(1),'');
  T('색띠 100µH = 갈 검 갈',indBands(1e-4).join()===[BANDC[1],BANDC[0],BANDC[1]].join(),indBands(1e-4).join());
  // 속성 창: 부품마다 열어 보기
  let pe=0;for(const k of ['rlyc','rlyd','reed','ssr','sol','indr','inda']){try{const x=px(k)[0];sel={type:'comp',id:x.id};renderInfo();if(!document.querySelector('#info .prop,#info .desc'))pe++;}catch(e){pe++;}}T('속성 창 오류 없음',!pe,'');
  // COM 핀을 안 이으면 역전압 알림
  { set(1,true);const D=S.comps.find(c=>c.chip==='DRV-SINK8'),comH=pinHoles(D)[CHIPS['DRV-SINK8'].idx.COM],n=SIM.netOf[HOLES.get(comH).i];
    const col=+comH.replace(/\D/g,''),w=S.comps.find(c=>c.t==='wire'&&c.pins.some(h=>/^[a-d]\d+$/.test(h)&&+h.slice(1)===col));S.comps=S.comps.filter(c=>c!==w);settle();
    T('COM 안 이으면 역전압 알림',SIM.warns.some(x=>/역전압/.test(x[1])),'');S.comps.push(w);settle();}
  // 버저: 코일을 자기 NC 접점으로 끊는 회로 / IC 출력으로 바로 큰 코일
  loadComps([{t:'px',kind:'rlyc',pins:['c10','c12','c14','c16','c18'],cv:5},{t:'wire',pins:['a10','a16']},{t:'wire',pins:['a14','tp14']},{t:'wire',pins:['a12','tn13']},
    {t:'ic',chip:'74HC04',col:30,b:1},{t:'wire',pins:['a30','tp31']},{t:'wire',pins:['j36','bn37']},{t:'wire',pins:['j30','bn31']},
    {t:'px',kind:'rlyd',pins:['f40','f41','f42','f43','e43','e42','e41','e40'],cv:5},{t:'wire',pins:['i31','i40']},{t:'wire',pins:['a40','tn41']}],false);RT.clear();S.power=true;settle();
  let flips=0,prev=on(px('rlyc')[0]);for(let i=0;i<6;i++){settle();const x=on(px('rlyc')[0]);if(x!==prev)flips++;prev=x;}
  T('버저 회로: 떨림 알림·계속 바뀜',SIM.buzz&&SIM.warns.some(x=>/떨리고/.test(x[1]))&&flips>0,'바뀐 횟수 '+flips);
  T('IC 출력으로 바로 큰 코일 → 경고',on(px('rlyd')[0])&&SIM.warns.some(x=>/20mA/.test(x[1])),SIM.warns.map(x=>x[1].slice(0,30)).join('|'));
  // 회로도: 브레드보드에서 가져와 스위치를 켜면 릴레이가 붙는다
  { const ex=EXAMPLES.pasrly();loadComps(ex.comps,false,ex.boards);orthoWires();RT.clear();commit(true);boardToSch();setVM('sch');SCH.power=true;
    for(const q of SCH.parts)if(q.t==='sw')q.on=true;renderSch();const R=k=>SCH.parts.find(q=>q.t==='px'&&q.kind===k);
    const st=['reed','rlyc','ssr'].map(k=>rlyOn(R(k),srt(R(k))));T('회로도에서 스위치 켜면 릴레이 붙음',st.every(Boolean),st.join(','));
    for(const q of SCH.parts)if(q.t==='sw')q.on=false;renderSch();const st2=['reed','rlyc','ssr'].map(k=>rlyOn(R(k),srt(R(k))));T('회로도에서 끄면 떨어짐',!st2.some(Boolean),st2.join(','));
    setVM('pcb');setVM('bb');}
  return out;});
for(const r of res)console.log((r.ok?'ok  ':'BAD ')+r.k+'  '+r.msg);
console.log('errors',errs);
const bad=res.filter(r=>!r.ok).length+errs.length;console.log(bad?'relay FAIL':'relay PASS');await b.close();})();
