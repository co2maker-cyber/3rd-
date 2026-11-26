// 다이오드 예제(Ⓟ6): 바르게·거꾸로, 순방향 전압 순서(게르마늄 < 쇼트키 < 실리콘), 브리지, 제너 5.1V, OR 묶기, 역전압 다이오드 알림, 회로도 동작
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
const res=await p.evaluate(()=>{const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg||''});
  const ex=EXAMPLES.pasdio();S.power=true;loadComps(ex.comps,false,ex.boards);orthoWires();RT.clear();commit(true);settle();
  const px=k=>S.comps.filter(c=>c.t==='px'&&c.kind===k),v=h=>SIM.vOf(SIM.netOf[HOLES.get(h).i]),lit=c=>!!(SIM.led.get(c.id)||{}).lit;
  const ledOf=h=>{const n=SIM.netOf[HOLES.get(h).i];return S.comps.find(c=>c.t==='led'&&S.comps.some(r=>r.t==='res'&&r.pins.some(x=>SIM.netOf[HOLES.get(x).i]===n)&&r.pins.some(x=>SIM.netOf[HOLES.get(x).i]===SIM.netOf[HOLES.get(c.pins[0]).i])));};
  const [d1,d2]=px('d4148');T('바르게 꽂은 1N4148 → LED 켜짐',lit(ledOf(d1.pins[1])));T('거꾸로 꽂은 1N4148 → LED 꺼짐',!lit(ledOf(d2.pins[0])));
  const drop=k=>{const c=px(k)[0];return v(c.pins[0])-v(c.pins[1]);};const g=drop('dge'),s=drop('d5819'),r=drop('d4007');T('순방향 전압 게르마늄 < 쇼트키 < 실리콘',g<s&&s<r,`${g.toFixed(2)} < ${s.toFixed(2)} < ${r.toFixed(2)}V`);
  const br=px('brdg')[0];T('브리지: 입력을 뒤집어 넣어도 + 단자가 +',v(br.pins[0])-v(br.pins[2])>3,(v(br.pins[0])-v(br.pins[2])).toFixed(2)+'V');
  const z=px('dz51')[0],vz=v(z.pins[1]);T('제너 12V → 5.1V 근처',vz>5&&vz<5.4,vz.toFixed(2)+'V');
  T('경고 없음(역전압 다이오드가 있어 COM 알림도 없음)',!SIM.warns.length,SIM.warns.map(w=>w[1].slice(0,40)).join('|'));
  const sw=S.comps.filter(c=>c.t==='sw'),orL=()=>lit(ledOf(px('d4148')[3].pins[1]));
  const st=[];for(const [a,b_] of [[0,0],[1,0],[0,1],[1,1]]){sw[sw.length-2].on=!!a;sw[sw.length-1].on=!!b_;settle();st.push(orL()?1:0);}
  T('다이오드 OR 묶기 (00·10·01·11)',st.join('')==='0111',st.join(''));
  // 역전압 다이오드를 빼면 COM 알림
  const f=S.comps.find(c=>c.kind==='d4007'&&c.pins.some(h=>/^2:/.test(h)));sw[1-0].on=true;for(const c of sw)c.on=true;settle();
  S.comps=S.comps.filter(c=>c!==f);settle();T('역전압 다이오드를 빼면 알림',SIM.warns.some(w=>/역전압/.test(w[1])),'');S.comps.push(f);settle();
  // 다이오드를 전원에 바로(저항 없이) → 단락 경고
  loadComps([{t:'wire',pins:['a3','tp3']},{t:'px',kind:'d4007',pins:['c3','c7']},{t:'wire',pins:['a7','tn7']}],false);RT.clear();settle();T('저항 없이 정방향 → 경고',SIM.warns.some(w=>w[0]==='bad'&&/저항 없이/.test(w[1])),'');
  // 제너 전력 초과: 12V → 22Ω → 제너
  loadComps([{t:'psu',k:1,x:20,y:440,v:12},{t:'wire',pins:['@1:0','a3']},{t:'wire',pins:['@1:1','a20']},{t:'res',pins:['b3','b9'],ohms:22,pw:5,mat:'wire'},{t:'px',kind:'dz51',pins:['c20','c9']}],false);RT.clear();settle();
  T('제너 1W 넘음 → 경고',SIM.warns.some(w=>/W가 열로/.test(w[1])&&/제너/.test(w[1])),SIM.warns.map(w=>w[1].slice(0,30)).join('|'));
  // 회로도: 브레드보드 예제를 가져와 OR 묶기
  { const ex=EXAMPLES.pasdio();loadComps(ex.comps,false,ex.boards);orthoWires();RT.clear();commit(true);boardToSch();setVM('sch');SCH.power=true;
    const sws=SCH.parts.filter(q=>q.t==='sw');for(const q of sws)q.on=false;renderSch();const led=()=>[...SIM_S.led.values()].filter(x=>x.lit).length;const n0=led();
    sws[sws.length-1].on=true;renderSch();const n1=led();T('회로도: 다이오드 OR 스위치를 켜면 LED가 더 켜짐',n1>n0,n0+' → '+n1);setVM('bb');}
  // 속성 창
  let pe=0;for(const k of ['d4148','d4007','d5819','dz51','dge','brdg'])try{const ex=EXAMPLES.pasdio();loadComps(ex.comps,false,ex.boards);settle();sel={type:'comp',id:px(k)[0].id};renderInfo();if(!document.querySelector('#info .desc'))pe++;}catch(e){pe++;}T('속성 창 오류 없음',!pe,'');
  // [속성] 버튼이 실제로 값을 바꾸는지(px 부품: 가변저항·릴레이 코일·인덕터·공심 코일·스위치)
  { const got=[];for(const [k,id,v,key,exp] of [['pot16','pxV','1000','ohms',1000],['rlyc','pxC','12','cv',12],['indr','pxH','0.001','henry',.001],['indair','pxN','50','turns',50],['tog1','pxS','1','s',1]]){
      loadComps([{t:'px',kind:k,pins:pxHolesAt(k,1,PX[k].lay==='dip'?'e':'c',10)}],false);settle();sel={type:'comp',id:S.comps[0].id};renderInfo();
      const bt=[...document.querySelectorAll('#'+id+' button')].find(x=>x.dataset.v===v||x.dataset.side===v);if(bt)bt.click();got.push(k+':'+(S.comps[0][key]===exp?'ok':'안 바뀜'));}
    T('px 부품 [속성] 버튼이 값을 바꿈',got.every(x=>x.endsWith('ok')),got.join(' ')); }
  return out;});
for(const r of res)console.log((r.ok?'ok  ':'BAD ')+r.k+'  '+r.msg);console.log('errors',errs);
const bad=res.filter(r=>!r.ok).length+errs.length;console.log(bad?'diode FAIL':'diode PASS');await b.close();})();
