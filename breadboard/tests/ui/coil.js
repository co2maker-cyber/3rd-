// 코일(인덕터) 계산: RL 충전 곡선(이론값 1% 안), 교류 임피던스 |Z|=√(R²+(2πfL)²), 끊을 때 역전압과 다이오드 보호, 포화 경고, 속성 칸, 저항 회로 옴의 법칙, LED 실제 전류 경고
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
const r=await p.evaluate(async()=>{const R={},B=[{id:1,type:'full',x:0,y:0}];opt.tol=false;const run=cs=>{S.power=true;loadComps(cs,true,B);RT.clear();settle();};const v=id=>{const h=HOLES.get(id);return SIM.vOf(SIM.netOf[h.i]);};
  // 저항: 전압 나누기·병렬
  run([{t:'res',pins:['tp3','a3'],ohms:1000},{t:'res',pins:['b3','b8'],ohms:2000},{t:'wire',pins:['c8','tn9']}]);R.div=v('e3');
  run([{t:'res',pins:['tp3','a3'],ohms:1000},{t:'res',pins:['b3','b8'],ohms:2000},{t:'res',pins:['c3','c8'],ohms:2000},{t:'wire',pins:['d8','tn9']}]);R.par=v('e3');
  // RL 충전: 5V → 100Ω → 0.1H(DCR 포함) → GND
  run([{t:'res',pins:['tp3','a3'],ohms:100},{t:'px',kind:'indt',henry:0.1,pins:['b3','b6']},{t:'wire',pins:['c6','tn7']}]);
  {const L=S.comps.find(c=>c.t==='px'),m=indModel(L),tau=m.L/(100+m.R),I=5/(100+m.R);rt(L).iL=0;SIM.lastA=simNow();const t0=SIM.lastA;let err=0;
   for(let i=0;i<8;i++){simBase+=tau/2;settle();const ex=I*(1-Math.exp(-(SIM.lastA-t0)/tau));err=Math.max(err,Math.abs(rt(L).iL-ex)/I);}R.rlErr=err;R.rlEnd=rt(L).iL/I;}
  // 교류: 함수 발생기 1kHz → 10mH → 100Ω
  run([{t:'fg',x:0,y:460,hz:1000,vpp:2,off:-1,wave:'sin'},{t:'wire',pins:['@1:0','a10']},{t:'wire',pins:['@1:1','tn13']},{t:'px',kind:'indt',henry:0.01,pins:['b10','b13']},{t:'res',pins:['c13','tn15'],ohms:100}]);
  {const L=S.comps.find(c=>c.t==='px');let mx=0;SIM.lastA=simNow();for(let i=0;i<400;i++){simBase+=.000031;settle();if(i>100)mx=Math.max(mx,Math.abs(rt(L).iL));}const m=indModel(L);R.ac=mx/(1/Math.hypot(100+m.R,2*Math.PI*1000*m.L));R.acWarn=SIM.warns.some(w=>/역전압/.test(w[1]));}
  // 끊을 때 역전압: 다이오드 없으면 경고, 있으면 약 0.7V
  const fly=dio=>{run([{t:'sw',pins:['tp3','a3'],on:true},{t:'px',kind:'indt',henry:0.01,pins:['b3','b6']},{t:'res',pins:['c6','tn7'],ohms:100,pw:1},...(dio?[{t:'px',kind:'d4007',pins:['d6','d3']}]:[])]);
    for(let i=0;i<20;i++){simBase+=.002;settle();}S.comps.find(c=>c.t==='sw').on=false;simBase+=.0001;settle();return[rt(S.comps.find(c=>c.kind==='indt')).vpk,SIM.warns.some(w=>/역전압/.test(w[1]))];};
  R.fly=fly(false);R.flyD=fly(true);
  // 포화: 1mH 축형을 5V에 바로
  run([{t:'px',kind:'inda',henry:1e-3,pins:['tp3','tn4']}]);for(let i=0;i<10;i++){simBase+=.01;settle();}R.sat=SIM.warns.some(w=>/포화/.test(w[1]));
  // LED: 회로 계산 전류로 과전류 경고
  run([{t:'res',pins:['tp3','a3'],ohms:47},{t:'led',pins:['b3','b8'],color:'red'},{t:'wire',pins:['c8','tn9']}]);R.led=SIM.warns.some(w=>/LED에 약 5\dmA/.test(w[1]));
  // 속성: 임피던스·공진
  run([{t:'px',kind:'indr',henry:1e-4,pins:['a3','a5']},{t:'cap',pins:['b5','b8'],farad:1e-6}]);const c=S.comps[0];sel={type:'comp',id:c.id};SEL.clear();SEL.add(c.id);renderInfo();const tx=document.getElementById('info').textContent;
  R.info=/임피던스/.test(tx)&&/1kHz 0\.6\d+Ω/.test(tx)&&/공진/.test(tx)&&/15\.\dkHz/.test(tx);R.tx=tx.slice(tx.indexOf('계산 결과'),tx.indexOf('계산 결과')+400);
  return R;});
T('저항 전압 나누기 1k:2k → 3.33V',Math.abs(r.div-10/3)<.01,r.div);T('병렬 저항 1k:(2k‖2k) → 2.5V',Math.abs(r.par-2.5)<.01,r.par);
T('RL 충전 곡선 이론값 2% 안',r.rlErr<.02&&r.rlEnd>.99,r.rlErr.toFixed(4));T('교류 1kHz 전류 = V/|Z| (3% 안)',Math.abs(r.ac-1)<.03&&!r.acWarn,r.ac.toFixed(3));
T('다이오드 없이 끊으면 역전압 경고',r.fly[0]>100&&r.fly[1],JSON.stringify(r.fly));T('다이오드로 역전압 막음',r.flyD[0]<10&&!r.flyD[1],JSON.stringify(r.flyD));
T('전류 넘으면 포화 경고',r.sat);T('LED 과전류는 계산 전류로 경고',r.led);T('속성에 임피던스·공진 주파수',r.info,r.tx);
for(const x of out)console.log((x.ok?'ok  ':'BAD ')+x.k+'  '+x.msg);console.log('errors',errs);
const bad=out.filter(x=>!x.ok).length+errs.length;console.log(bad?'coil FAIL':'coil PASS');await b.close();})();
