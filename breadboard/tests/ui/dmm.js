// 멀티미터: 전압(VΩ−COM)·전류(A→COM 직렬, 0.1Ω 션트, 10A 퓨즈)·저항(저항망 계산, OL), 잘못 꽂은 단자 경고, 도구 막대 단추, 속성 창 설명은 맨 밑
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
const r=await p.evaluate(async()=>{const R={},B=[{id:1,type:'full',x:0,y:0}];opt.tol=false;const run=cs=>{S.power=true;loadComps(cs,true,B);RT.clear();settle();render();};
  const rd=()=>rt(S.comps.find(c=>c.t==='dmm')).rd;const wait=ms=>new Promise(r=>setTimeout(r,ms));
  R.tb=!!document.querySelector('.toolbar .instg [data-tool="dmm"] svg');
  // 전압: 1k·2k 나누기 가운데 → 3.333V
  const div=[{t:'res',pins:['tp3','a3'],ohms:1000},{t:'res',pins:['b3','b8'],ohms:2000},{t:'wire',pins:['c8','tn9']}];
  run([...div,{t:'dmm',k:1,x:0,y:440,mode:'v'},{t:'wire',pins:['@1:0','tn20']},{t:'wire',pins:['@1:1','e3']}]);R.v=[rd().x,rd().t];
  // 전류: 5V → 1k → (A·COM) → 2k → GND : 1.667mA
  run([{t:'res',pins:['tp3','a3'],ohms:1000},{t:'dmm',k:1,x:0,y:440,mode:'a'},{t:'wire',pins:['@1:2','b3']},{t:'wire',pins:['@1:0','a10']},{t:'res',pins:['b10','b15'],ohms:2000},{t:'wire',pins:['c15','tn16']}]);R.a=[rd().x,rd().t];
  // 저항: 1k + (2k ‖ 2k) = 2k, 길 없으면 OL
  run([{t:'res',pins:['a3','a8'],ohms:1000},{t:'res',pins:['b8','b13'],ohms:2000},{t:'res',pins:['c8','c13'],ohms:2000},{t:'dmm',k:1,x:0,y:440,mode:'o'},{t:'wire',pins:['@1:1','e3']},{t:'wire',pins:['@1:0','e13']}]);R.o=[rd().x,rd().t,SIM.warns.some(w=>/전원이 이어진/.test(w[1]))];
  const dm=S.comps.find(c=>c.t==='dmm');S.comps.find(c=>c.t==='res').ohms=470;settle();R.o2=rd().x;
  S.comps=S.comps.filter(c=>!(c.t==='res'&&c.ohms===470));settle();R.ol=rd().t;
  // 전류 모드로 전원 양 끝에 바로 → 퓨즈
  run([{t:'dmm',k:1,x:0,y:440,mode:'a'},{t:'wire',pins:['@1:2','tp5']},{t:'wire',pins:['@1:0','tn5']}]);await wait(50);R.fuse=[rd().t,SIM.warns.some(w=>/퓨즈가 끊어졌어요/.test(w[1]))];
  // 잘못 꽂은 단자: 전압 모드인데 A 단자
  run([{t:'dmm',k:1,x:0,y:440,mode:'v'},{t:'wire',pins:['@1:2','a5']},{t:'wire',pins:['@1:0','tn5']}]);R.wrong=SIM.warns.some(w=>/VΩ 단자\(빨강\)와 COM 단자로 재요/.test(w[1]));
  // 속성 창: 모드 단추 · 설명이 맨 밑
  const c=S.comps.find(x=>x.t==='dmm');sel={type:'comp',id:c.id};SEL.clear();SEL.add(c.id);renderInfo();document.querySelector('#info [data-f="mode"] button[data-v="o"]').click();R.mode=c.mode;
  const kids=[...document.getElementById('info').children];R.last=kids[kids.length-1].classList.contains('pdesc');
  const rr=S.comps.find(x=>x.t==='res')||null;
  run([{t:'res',pins:['a3','a8'],ohms:330}]);const q=S.comps[0];sel={type:'comp',id:q.id};SEL.clear();SEL.add(q.id);renderInfo();const k2=[...document.getElementById('info').children];R.lastRes=k2[k2.length-1].classList.contains('pdesc')&&/330Ω 저항/.test(k2[k2.length-1].textContent);
  return R;});
T('도구 막대에 멀티미터',r.tb);T('전압 3.333V',Math.abs(r.v[0]-10/3)<.002,r.v.join(' '));T('전류 1.667mA (션트 0.1Ω)',Math.abs(r.a[0]-5/3000.1)<2e-6,r.a.join(' '));
T('저항 1k + 2k‖2k = 2kΩ (전원 경고 없음)',Math.abs(r.o[0]-2000)<.01&&!r.o[2],r.o.join(' '));T('값 바꾸면 다시 계산 (470+1000)',Math.abs(r.o2-1470)<.01,r.o2);T('길 없으면 OL',r.ol==='OL',r.ol);
T('전류 모드로 전원에 바로 대면 퓨즈',r.fuse[0]==='FUSE'&&r.fuse[1],JSON.stringify(r.fuse));T('잘못 꽂은 단자 경고',r.wrong);T('속성에서 모드 바꾸기',r.mode==='o');
T('부품 설명이 속성 창 맨 밑',r.last&&r.lastRes);
for(const x of out)console.log((x.ok?'ok  ':'BAD ')+x.k+'  '+x.msg);console.log('errors',errs);
const bad=out.filter(x=>!x.ok).length+errs.length;console.log(bad?'dmm FAIL':'dmm PASS');await b.close();})();
