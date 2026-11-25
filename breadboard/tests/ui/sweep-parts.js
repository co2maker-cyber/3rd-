// 전체 점검 2: 모든 IC·표시기·드라이버·게이트·수동 소자를 하나씩 놓고, 입력을 바꿔 가며 돌린다 + 회로도 + 목록 가져오기
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push('console: '+m.text());});   // 글꼴(외부) 못 받는 것은 빼고
await p.goto('file://'+require('path').join(__dirname,'../../index.html')+'');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const out=[];const tryIt=(name,fn)=>{try{fn();const h=document.querySelector('#bw').innerHTML+($('info')?$('info').innerHTML:'');const m=h.match(/.{0,120}NaN.{0,40}/);if(m)out.push(name+': NaN in '+m[0]);}catch(e){out.push(name+': '+e.message);}};
  const run=()=>{for(let i=0;i<6;i++){simBase+=0.13;settle();render();}};
  for(const chip of Object.keys(CHIPS))tryIt('ic '+chip,()=>{S.boards=[{id:1,type:'full',x:0,y:0}];buildHoles();const n=CHIPS[chip].pins.length;
    const comps=[{t:'ic',chip,col:5,b:1}];
    // 핀마다 줄 반대쪽에서 클럭·스위치 넣기(입력 흔들기)
    for(let k=0;k<n/2;k++){comps.push(k%2?{t:'clk',pins:['j'+(5+k)],hz:k+1}:{t:'sw',pins:['bp'+(5+k),'i'+(5+k)],on:!!(k%4)});}
    S.comps=comps.filter(c=>c.pins?c.pins.every(h=>HOLES.has(h)):true).map((c,i)=>Object.assign(c,{id:i+1}));S.nextId=S.comps.length+1;S.power=true;RT.clear();commit(true);run();
    const ex=[{t:'wire',pins:['a5','tp5']},{t:'wire',pins:['a7','tn7']}];});
  for(const kind of Object.keys(GATES))tryIt('gate '+kind,()=>{loadComps([{t:'gate',kind,pins:gatePinCols(kind).map(k=>'e'+(10+k))}],true);run();});
  for(const kind of Object.keys(PX))tryIt('px '+kind,()=>{S.boards=[{id:1,type:'std',x:0,y:0}];buildHoles();const pins=pxHolesAt(kind,1,PX[kind].lay==='dip'?'e':'c',10);
    loadComps([Object.assign({t:'px',kind,pins},PX[kind].init())],true);const c=S.comps[0];if(!c)throw new Error('안 놓임');run();
    for(let s=0;s<4;s++){if(c.s!=null)c.s=s;if(c.bits)c.bits=c.bits.map((_,i)=>(i+s)%2);if(c.pos!=null)c.pos=s/3;commit(true);run();}renderInfo&&(sel={type:'comp',id:c.id},renderInfo());});
  for(const t of ['res','led','cap','sw','btn'])tryIt('two '+t,()=>{loadComps([{t,pins:['e10','f10'],ohms:330,color:'red',farad:1e-6}],true);sel={type:'comp',id:S.comps[0].id};renderInfo();run();});
  tryIt('led3',()=>{loadComps([{t:'led3',pins:['c2','c3','c4'],ca:true}],true);run();});
  tryIt('seg7',()=>{loadComps([{t:'seg7',col:10,ca:false}],true);run();});
  for(const t of ['psu','bat','fg','osc'])tryIt('inst '+t,()=>{loadComps([{t,k:1,x:20,y:440}],true);sel={type:'comp',id:S.comps[0].id};renderInfo();run();});
  return out;});
console.log('part errors',r.length);console.log(r.slice(0,40).join('\n'));
// 부품 고르기 창의 모든 칸: 눌러서 보드에 놓기
const n=await p.evaluate(async()=>{const errs=[];let placed=0,tried=0;loadComps([],true);
  return {placed,tried,errs};});
console.log('page errors',errs.length,errs.slice(0,10).join('\n'));await b.close();})();
