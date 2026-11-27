// 35차 센서·출력 장치: 저항형 센서 분배, 전압 출력 센서, 역접속·3.3V 과전압 고장, 조이스틱, 초음파 에코, PIR, 릴레이 모듈, OLED I2C(정상·바뀜·센서 값), LCD 명암·제어선, TFT 3.3V 경고, 모터·부저, 예제 ⓢ1~ⓢ4, 속성 창
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1500,height:950}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
const r=await p.evaluate(async()=>{const R={},B=[{id:1,type:'full',x:0,y:0}];opt.tol=false;const run=cs=>{S.power=true;loadComps(cs,true,B);RT.clear();settle();render();};
  const v=id=>{const h=HOLES.get(id);return SIM.vOf(SIM.netOf[h.i]);};const W=()=>SIM.warns.map(w=>w[1]);const wait=ms=>new Promise(r=>setTimeout(r,ms));const K=k=>S.comps.find(c=>c.kind===k);
  run([{t:'res',pins:['tp3','a3'],ohms:10000},{t:'px',kind:'sldr',pins:['b3','b5'],lux:300},{t:'wire',pins:['c5','tn7']}]);R.ldr=[v('e3'),ldrR(K('sldr'))];K('sldr').lux=0;settle();R.ldrDark=v('e3');
  run([{t:'px',kind:'sntc',pins:['b3','b5'],temp:50}]);R.ntc=ntcR(K('sntc'));
  run([{t:'px',kind:'slm35',pins:['c10','c11','c12'],temp:30},{t:'wire',pins:['a10','tp10']},{t:'wire',pins:['a12','tn13']}]);R.lm35=v('e11');
  run([{t:'px',kind:'slm35',pins:['c10','c11','c12'],temp:30},{t:'wire',pins:['a10','tn10']},{t:'wire',pins:['a12','tp13']}]);R.rev=W().some(x=>/거꾸로/.test(x));
  run([{t:'px',kind:'sbme',pins:['c10','c11','c12','c13']},{t:'wire',pins:['a10','tp10']},{t:'wire',pins:['a11','tn11']}]);await wait(30);R.bme=!!rt(K('sbme')).fail&&W().some(x=>/망가/.test(x));
  run([{t:'px',kind:'sjoy',pins:['c20','c21','c22','c23','c24'],jx:.2,jy:.8},{t:'wire',pins:['a20','tn20']},{t:'wire',pins:['a21','tp21']}]);R.joy=[v('e22'),v('e23')];
  run([{t:'px',kind:'susr',pins:['c30','c31','c32','c33'],cm:100},{t:'wire',pins:['a30','tp29']},{t:'wire',pins:['a33','tn33']},{t:'fg',k:1,x:0,y:460,wave:'sq',hz:2,vpp:5,off:0,duty:50},{t:'wire',pins:['@1:0','a31']},{t:'wire',pins:['@1:1','tn40']}]);
  {const us=K('susr');let hi=0;const t0=performance.now();while(performance.now()-t0<1500){await wait(2);if(rt(us).echo)hi++;}R.echo=[hi,rt(us).e1-rt(us).e0];}
  run([{t:'px',kind:'spir',pins:['c40','c41','c42'],hold:1},{t:'wire',pins:['a40','tp40']},{t:'wire',pins:['a42','tn43']}]);rt(K('spir')).mt=simNow();settle();R.pir1=v('e41');await wait(1300);settle();R.pir2=v('e41');
  run([{t:'px',kind:'arel',pins:['c45','c46','c47','c50','c51','c52']},{t:'wire',pins:['a45','tp45']},{t:'wire',pins:['a46','tn46']},{t:'wire',pins:['a47','tn47']}]);R.rel=rt(K('arel')).on;
  // OLED + 선형 온도 센서 on Nano 폼팩터 보드
  const n=pxHolesAtB('ano',1,3,B),P=nm=>n[PX.ano.pins.findIndex(x=>x.startsWith(nm))],col=h=>+h.replace(/^\D+/,''),j=h=>'j'+col(h),I=h=>(h[0]==='h'?'i':'b')+col(h);
  run([{t:'px',kind:'ano',pins:n},{t:'px',kind:'doled',pins:['a40','a41','a42','a43'],src:'sense'},{t:'wire',pins:['b40',j(P('GND'))]},{t:'wire',pins:['b41',j(P('5V'))]},{t:'wire',pins:['b42',j(P('A5'))]},{t:'wire',pins:['b43',j(P('A4'))]},
    {t:'px',kind:'slm35',pins:['c50','c51','c52'],temp:31},{t:'wire',pins:['a50',I(P('5V'))]},{t:'wire',pins:['a52',I(P('GND'))]},{t:'wire',pins:['a51',j(P('A0'))]}]);
  R.oled=[rt(K('doled')).st,rt(K('doled')).sense];const w=S.comps.filter(x=>x.t==='wire');w[2].pins[0]='b43';w[3].pins[0]='b42';settle();R.swap=[rt(K('doled')).st,W().some(x=>/바뀌었/.test(x))];
  // TFT 5V 보드 경고
  run([{t:'px',kind:'ano',pins:n},{t:'wire',pins:[j(P('5V')),'bp14']},{t:'wire',pins:[j(P('GND')),'bn16']},{t:'wire',pins:['bp2','tp2']},{t:'wire',pins:['bn2','tn2']},
    {t:'px',kind:'dtft',pins:rng(8,i=>'a'+(40+i))},{t:'wire',pins:['b40','tp40']},{t:'wire',pins:['b41','tn41']},{t:'wire',pins:['b42',I(P('D10'))]},{t:'wire',pins:['b44',I(P('D9'))]},{t:'wire',pins:['b45',I(P('D11'))]},{t:'wire',pins:['b46',I(P('D13'))]}]);
  R.tft=[rt(K('dtft')).st,W().some(x=>/3.3V 로직/.test(x))];
  run([{t:'px',kind:'adcm',pins:['a10','a13']},{t:'wire',pins:['b10','tp10']},{t:'wire',pins:['b13','tn13']},{t:'px',kind:'abuz',pins:['a20','a23']},{t:'wire',pins:['b20','tp20']},{t:'wire',pins:['b23','tn23']}]);R.mot=rt(K('adcm')).dv;R.buz=rt(K('abuz')).on;
  // LCD 명암: VO를 + 에 바로 → 글자 안 보임 경고
  run([{t:'px',kind:'dlcd16',pins:rng(16,i=>'h'+(30+i))},{t:'wire',pins:['j30','bn31']},{t:'wire',pins:['j31','bp32']},{t:'wire',pins:['j32','bp33']}]);R.lcdhi=W().some(x=>/VO 전압이 .*높아/.test(x))&&rt(K('dlcd16')).st==='NO_INIT';
  // 모든 새 부품 속성 창
  const ks=Object.values(PX).filter(d=>d.sub==='sen'||d.sub==='out').map(d=>d.k);R.n=ks.length;const bad=[];
  for(const k of ks){try{run([{t:'px',kind:k,pins:pxHolesAt(k,1,'c',3)}]);const c=S.comps[0];sel={type:'comp',id:c.id};SEL.clear();SEL.add(c.id);renderInfo();if(!/부품 설명/.test(document.getElementById('info').textContent))bad.push(k);}catch(e){bad.push(k+':'+e.message);}}
  R.bad=bad;R.tree=!!PTREE.find(x=>x.k==='sio');return R;});
T('CdS 분배기 300lux 0.58V · 어두우면 4.9V',Math.abs(r.ldr[0]-5*r.ldr[1]/(1e4+r.ldr[1]))<.01&&r.ldrDark>4.9,JSON.stringify([r.ldr,r.ldrDark]));
T('NTC 50°C ≈ 3.6kΩ',Math.abs(r.ntc-3588)<60,r.ntc);T('선형 온도 센서 30°C → 0.30V',Math.abs(r.lm35-.3)<.002,r.lm35);T('역접속 경고',r.rev);T('3.3V 전용 센서에 5V → 고장',r.bme);
T('조이스틱 X 1.0V · Y 4.0V',Math.abs(r.joy[0]-1)<.01&&Math.abs(r.joy[1]-4)<.01,JSON.stringify(r.joy));T('초음파: TRIG마다 에코 5.83ms',r.echo[0]>0&&Math.abs(r.echo[1]-.00583)<1e-4,JSON.stringify(r.echo));
T('PIR 감지 3.3V → 유지 시간 뒤 0V',Math.abs(r.pir1-3.3)<.01&&r.pir2<.1,JSON.stringify([r.pir1,r.pir2]));T('릴레이 모듈 IN LOW → 붙음',r.rel);
T('OLED I2C 정상 + 센서 값 TEMP 31.0C',r.oled[0]==='READY'&&r.oled[1][0]==='TEMP 31.0C',JSON.stringify(r.oled));T('SDA·SCL 바뀜 경고',r.swap[0]==='BUS_ERR'&&r.swap[1]);
T('TFT 정상 + 5V 보드 3.3V 로직 경고',r.tft[0]==='READY'&&r.tft[1]);T('모터 5V · 능동 부저 울림',r.mot===5&&r.buz);T('LCD VO 높으면 글자 안 보임 경고',r.lcdhi);
T('새 부품 29종 속성 창(설명 맨 밑)',r.n===29&&!r.bad.length,JSON.stringify(r.bad));T('부품 고르기에 [센서 · 출력 장치]',r.tree);
// 예제
for(const k of ['sx1','sx2','sx3','sx4']){await p.selectOption('#ex',k);await p.waitForTimeout(k==='sx2'?3500:600);
  const q=await p.evaluate(k=>{const K=x=>S.comps.find(c=>c.kind===x);if(k==='sx1'){const L=S.comps.find(c=>c.t==='led');const a=(SIM.led.get(L.id)||{}).lit;K('sldr').lux=0;settle();const b2=(SIM.led.get(L.id)||{}).lit;return[!a&&b2,[a,b2]];}
    if(k==='sx2')return[rt(K('asrv')).ang===90,rt(K('asrv')).ang];if(k==='sx3'){const r=rt(K('dlcd16'));return[r.st==='READY'&&/^TEMP 23\.\dC$/.test((r.sense||[])[0]||'')&&r.bl&&r.vo>.3&&r.vo<1.2,[r.st,r.sense,r.vo]];}
    const r=rt(K('doled'));return[r.st==='READY'&&(r.sense||[])[0]==='DIST 42cm',[r.st,r.sense]];},k);
  T('예제 '+k,q[0],JSON.stringify(q[1]));}
for(const x of out)console.log((x.ok?'ok  ':'BAD ')+x.k+'  '+x.msg);console.log('errors',errs);
const bad=out.filter(x=>!x.ok).length+errs.length;console.log(bad?'sensor-disp FAIL':'sensor-disp PASS');await b.close();})();
