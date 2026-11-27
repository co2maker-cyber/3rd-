// 부품의 실제 특성: 저항 오차·정격 전력(뜨거움·탐), 커패시터 오차·ESR·누설·정격 전압(고장)·극성(거꾸로)·X7R 직류 바이어스, 새 부품으로 바꾸기, RC 시정수
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
const r=await p.evaluate(async()=>{const R={},B=[{id:1,type:'full',x:0,y:0}],run=cs=>{S.power=true;loadComps(cs,true,B);RT.clear();settle();};const v=id=>{const h=HOLES.get(id);return SIM.vOf(SIM.netOf[h.i]);};const wait=ms=>new Promise(r=>setTimeout(r,ms));
  // 저항 오차: 표시 값의 ±5% 안, 꽂은 자리마다 늘 같음
  run([{t:'res',pins:['a3','a7'],ohms:1000}]);const c0=S.comps[0];R.eff=resEff(c0);R.eff2=resEff(c0);
  // 저항 전력: 1/4W 에 5V — 82Ω → 0.3W 뜨거움, 10Ω → 2.5W 탐
  run([{t:'res',pins:['tp3','a3'],ohms:82},{t:'wire',pins:['b3','tn4']}]);R.hot=SIM.warns.some(w=>/뜨거워요/.test(w[1]));
  run([{t:'res',pins:['tp3','a3'],ohms:10},{t:'wire',pins:['b3','tn4']}]);await wait(30);const rb=S.comps.find(c=>c.t==='res');R.burnt=!!rt(rb).burnt;R.burnWarn=SIM.warns.some(w=>/타서 끊어졌어요/.test(w[1]));R.burnI=rt(rb).i;
  delete rt(rb).burnt;rb.pw=5;settle();R.ok5w=!rt(rb).burnt&&rt(rb).p>2;
  // 커패시터 정격 전압: 16V 전해에 24V → 고장(단락)
  run([{t:'psu',k:3,v:24,on:true,x:0,y:460},{t:'wire',pins:['@3:0','a10']},{t:'wire',pins:['@3:1','tn13']},{t:'res',pins:['b10','b14'],ohms:1000,pw:5},{t:'cap',pins:['c14','tn14'],farad:1e-4,dk:'alu',vr:16}]);
  for(let i=0;i<60;i++){simBase+=.05;settle();}await wait(30);const cp=S.comps.find(c=>c.t==='cap');R.fail=!!rt(cp).fail;R.failV=v('d14');
  // 거꾸로 꽂은 전해
  run([{t:'cap',pins:['tn5','a5'],farad:1e-5,dk:'alu'},{t:'wire',pins:['b5','tp5']}]);for(let i=0;i<10;i++){simBase+=.05;settle();}await wait(30);R.rev=SIM.warns.some(w=>/거꾸로 꽂혔어요/.test(w[1]));
  // RC 충전: 10kΩ·100µF, τ≈1초 → 1초 뒤 약 63%(오차·ESR 안)
  run([{t:'res',pins:['tp3','a3'],ohms:10000},{t:'cap',pins:['b3','tn4'],farad:1e-4,dk:'alu'}]);const cc=S.comps.find(c=>c.t==='cap');rt(cc).v=0;SIM.lastA=simNow();
  for(let i=0;i<20;i++){simBase+=.05;settle();}R.rc=rt(cc).v/5;
  // X7R 직류 바이어스: 50V 정격에 25V면 용량이 줄어듦
  run([{t:'cap',pins:['a20','a22'],farad:1e-7,dk:'x7r'}]);const cx=S.comps.find(c=>c.t==='cap');const c1=capEff(cx);rt(cx).v=25;const c2=capEff(cx);R.bias=c2/c1;
  // 속성 칸 계산 결과 · 새 부품으로 바꾸기
  run([{t:'res',pins:['tp3','a3'],ohms:10},{t:'wire',pins:['b3','tn4']}]);await wait(40);const rr=S.comps.find(c=>c.t==='res');sel={type:'comp',id:rr.id};SEL.clear();SEL.add(rr.id);renderInfo();
  rr.ohms=1000;R.live=document.getElementById('info').textContent.includes('계산 결과');const btn=document.getElementById('partNew');R.btn=!!btn;if(btn)btn.click();R.revived=!rt(rr).burnt;
  return R;});
T('저항 오차: ±5% 안, 늘 같은 값',Math.abs(r.eff/1000-1)<=.05&&r.eff===r.eff2,r.eff);
T('저항 정격 넘으면 뜨거움 경고',r.hot);T('정격 2배 넘으면 타서 끊어짐 · 전류 0',r.burnt&&r.burnWarn&&r.burnI===0,JSON.stringify([r.burnt,r.burnWarn,r.burnI]));T('5W 저항은 견딤',r.ok5w);
T('커패시터 정격 1.3배 넘으면 고장(단락)',r.fail,JSON.stringify([r.fail,r.failV]));T('극성 커패시터 거꾸로 경고',r.rev);
T('RC 충전 1τ ≈ 63% (오차 안)',r.rc>.5&&r.rc<.75,r.rc.toFixed(3));T('X7R 직류 바이어스로 용량 감소',r.bias<.8&&r.bias>.6,r.bias.toFixed(2));
T('속성에 계산 결과 · 새 부품으로 바꾸기',r.live&&r.btn&&r.revived,JSON.stringify([r.live,r.btn,r.revived]));
for(const x of out)console.log((x.ok?'ok  ':'BAD ')+x.k+'  '+x.msg);console.log('errors',errs);
const bad=out.filter(x=>!x.ok).length+errs.length;console.log(bad?'real FAIL':'real PASS');await b.close();})();
