// 논리 IC 모음 예제(ⓘ1~ⓘ12): 스위치 조합·클럭마다 칩 출력이 그 기능의 진리표와 맞는지, LED가 출력대로 켜지는지
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
const res=await p.evaluate(()=>{const out=[];
  const load=k=>{const ex=EXAMPLES[k]();S.power=true;loadComps(ex.comps,false,ex.boards);orthoWires();RT.clear();commit(true);settle();};
  const chips=n=>S.comps.filter(c=>c.chip===n);
  const lvP=(c,pin)=>{const d=c.t==='gate'?GATES[c.kind]:CHIPS[c.chip];const h=pinHoles(c)[d.pins.indexOf(pin)];return SIM.lvl.get(SIM.netOf[HOLES.get(h).i]);};
  const bit=v=>v===Hh?1:v===L?0:v===Z?'Z':'X';
  const sws=()=>S.comps.filter(c=>c.t==='sw');
  const setSw=vals=>{sws().forEach((c,i)=>{if(i<vals.length)c.on=!!vals[i];});settle();};
  const half=hz=>{simBase+=0.5/hz;settle();};
  // LED가 이어진 줄의 값대로 켜지는가(LOW에서 켜지는 LED는 캐소드 쪽)
  const ledOK=()=>{let bad=0;for(const c of S.comps.filter(c=>c.t==='led')){const st=SIM.led.get(c.id)||{},a=SIM.lvl.get(SIM.netOf[HOLES.get(c.pins[0]).i]),k=SIM.lvl.get(SIM.netOf[HOLES.get(c.pins[1]).i]);
      const exp=(a===Hh||a==null||SIM.weak.has(SIM.netOf[HOLES.get(c.pins[0]).i]))&&k===L&&a!==L;if(!!st.lit!==(a===Hh&&k===L))bad++;}return bad;};
  const T=(k,ok,msg)=>out.push({k,ok:!!ok,msg});
  // ⓘ1
  {load('lg2');const F={'74LS00':(a,b)=>!(a&&b),'74LS02':(a,b)=>!(a||b),'74HC02':(a,b)=>!(a||b),'74LS32':(a,b)=>a||b,'74LS86':(a,b)=>a!==b,'74LS132':(a,b)=>!(a&&b),'74HC132':(a,b)=>!(a&&b),'74LS03':(a,b)=>!(a&&b),'74LS09':(a,b)=>a&&b};
    const G={NAND:(a,b)=>!(a&&b),NOR:(a,b)=>!(a||b),XNOR:(a,b)=>a===b};let bad=[],lb=0;
    for(const [a,b_] of [[0,0],[0,1],[1,0],[1,1]]){setSw([a,b_]);for(const [n,f] of Object.entries(F)){const y=bit(lvP(chips(n)[0],n.endsWith('02')?'1Y':'1Y'));if(y!==+!!f(a,b_))bad.push(`${n} ${a}${b_}→${y}`);}
      for(const [n,f] of Object.entries(G)){const g=S.comps.find(c=>c.t==='gate'&&c.kind===n);const y=bit(lvP(g,'Y'));if(y!==+!!f(a,b_))bad.push(`${n} ${a}${b_}→${y}`);}lb+=ledOK();}
    T('lg2',!bad.length&&!lb,bad.slice(0,4).join(', ')||'12종 × A·B 4가지 진리표 일치, LED 일치');}
  // ⓘ2
  {load('lg3');const F={'10':(a,b,c)=>!(a&&b&&c),'11':(a,b,c)=>a&&b&&c,'27':(a,b,c)=>!(a||b||c),'20':(a,b,c)=>!(a&&b&&c),'21':(a,b,c)=>a&&b&&c,'30':(a,b,c)=>!(a&&b&&c)};let bad=[],lb=0;
    for(let v=0;v<8;v++){const a=v&1,b_=(v>>1)&1,c=(v>>2)&1;setSw([a,b_,c]);for(const f of ['74LS','74HC'])for(const [n,fn] of Object.entries(F)){const ch=chips(f+n)[0];const y=bit(lvP(ch,n==='30'?'Y':'1Y'));if(y!==+!!fn(a,b_,c))bad.push(`${f+n} ${a}${b_}${c}→${y}`);}lb+=ledOK();}
    T('lg3',!bad.length&&!lb,bad.slice(0,4).join(', ')||'12종 × A·B·C 8가지 진리표 일치, LED 일치');}
  // ⓘ3
  {load('lbuf');let bad=[],lb=0;
    for(const [a,en] of [[0,0],[0,1],[1,0],[1,1]]){setSw([a,en]);const E={'74LS04':+!a,'74LS14':+!a,'74LS05':+!a,'74LS07':a,'74LS125':en?'Z':a,'74HC125':en?'Z':a,'74LS126':en?a:'Z','74HC126':en?a:'Z','74LS244':en?'Z':a,'74HC244':en?'Z':a,'74LS240':en?'Z':+!a,'74HC240':en?'Z':+!a};
      for(const [n,e] of Object.entries(E)){const pin=/24[04]/.test(n)?'1Y1':'1Y';let y=bit(lvP(chips(n)[0],pin));if(e==='Z'&&(y==='Z'||y==='X'||y===0))y='Z';if(y!==e)bad.push(`${n} A${a}EN${en}→${y}`);}lb+=ledOK();}
    T('lbuf',!bad.length&&!lb,bad.slice(0,4).join(', ')||'12종 × A·EN 4가지 일치(3상태는 끊김), LED 일치');}
  // ⓘ4
  {load('lff');const D=['74LS74','74LS75','74LS175','74HC175'],J=['74LS112','74HC112','74LS73','74HC73','74LS109','74HC109'];let bad=[];
    setSw([1]);for(let i=0;i<4;i++)half(1);for(const n of D)if(bit(lvP(chips(n)[0],'1Q'))!==1)bad.push(n+' D=1');
    setSw([0]);for(let i=0;i<4;i++)half(1);for(const n of D)if(bit(lvP(chips(n)[0],'1Q'))!==0)bad.push(n+' D=0');
    const seq={};for(const n of J)seq[n]=[];for(let i=0;i<8;i++){half(1);half(1);for(const n of J)seq[n].push(bit(lvP(chips(n)[0],'1Q')));}
    for(const n of J){const s_=seq[n].join('');if(!/^(10)+$|^(01)+$/.test(s_))bad.push(`${n} ${s_}`);}
    T('lff',!bad.length&&!ledOK(),bad.join(', ')||'D형 4종: D를 클럭에 받아 둠(1·0) · JK형 6종: 클럭마다 한 번씩 뒤집힘(J=K=1, 10101010)');}
  // ⓘ5·ⓘ6
  const cnt=(c,pre)=>['QA','QB','QC','QD'].reduce((v,q,i)=>v|((lvP(c,pre+q)===Hh?1:0)<<i),0);
  {load('lcnt');const N=[['74LS161',''],['74LS163',''],['74HC163',''],['74LS93',''],['74LS393','1'],['74HC393','1']];const hist={};for(const [n] of N)hist[n]=[];
    for(let i=0;i<20;i++){half(2);half(2);for(const [n,pre] of N)hist[n].push(cnt(chips(n)[0],pre));}
    const bad=N.filter(([n])=>!hist[n].slice(1).every((v,i)=>v===((hist[n][i]+1)&15))).map(([n])=>`${n} ${hist[n].join(',')}`);
    T('lcnt',!bad.length&&!ledOK(),bad.slice(0,2).join(' / ')||'6종 모두 클럭마다 +1 (0~15 되풀이): '+hist['74LS161'].slice(0,6).join(','));}
  {load('lud');const up=['74LS192','74LS193'],dn=['74HC192','74HC193'];const hist={};for(const n of [...up,...dn])hist[n]=[];
    for(let i=0;i<14;i++){half(1);half(1);for(const n of [...up,...dn])hist[n].push(cnt(chips(n)[0],''));}
    const ok=(n,d,m)=>hist[n].slice(1).every((v,i)=>v===((hist[n][i]+d+m)%m));
    const bad=[...up.map(n=>ok(n,1,n.endsWith('192')?10:16)?'':n+' '+hist[n].join(',')),...dn.map(n=>ok(n,-1,n.endsWith('192')?10:16)?'':n+' '+hist[n].join(','))].filter(Boolean);
    T('lud',!bad.length&&!ledOK(),bad.slice(0,2).join(' / ')||`192는 0~9, 193은 0~15 · 올림 ${hist['74LS192'].slice(0,5).join(',')} · 내림 ${hist['74HC193'].slice(0,5).join(',')}`);}
  // ⓘ7
  {load('lshift');const R4=['74HC595','74LS595','74LS164','74LS194','74HC194'];let bad=[];
    setSw([1,1]);for(let i=0;i<12;i++)half(1);for(const n of R4)if(cnt(chips(n)[0],'')!==15)bad.push(n+' D=1 → '+cnt(chips(n)[0],''));
    setSw([0,1]);for(let i=0;i<12;i++)half(1);for(const n of R4)if(cnt(chips(n)[0],'')!==0)bad.push(n+' D=0 → '+cnt(chips(n)[0],''));
    // 165: LD 끔(병렬로 받기) → 켬(밀어 내기): QH = H,G,F,E,D,C,B,A = 0,1,0,0,1,1,0,1
    const seqs={};for(const n of ['74LS165','74HC165']){seqs[n]=[];}setSw([0,0]);half(1);half(1);setSw([0,1]);
    for(const n of ['74LS165','74HC165'])seqs[n].push(bit(lvP(chips(n)[0],'QH')));for(let i=0;i<7;i++){half(1);half(1);for(const n of ['74LS165','74HC165'])seqs[n].push(bit(lvP(chips(n)[0],'QH')));}
    for(const n of ['74LS165','74HC165'])if(seqs[n].join('')!=='01001101')bad.push(`${n} ${seqs[n].join('')}`);
    T('lshift',!bad.length&&!ledOK(),bad.join(', ')||'595·164·194: D가 QA→QD로 차례로 (1111 → 0000) · 165: 병렬 10110010을 QH로 H→A 순서 01001101');}
  // ⓘ8
  {load('lmux');const pat=[1,0,1,1,0,0,1,0],c153=[1,0,1,1];let bad=[];
    for(let s_=0;s_<8;s_++){setSw([s_&1,(s_>>1)&1,(s_>>2)&1]);const E={'74LS151':['Y',pat[s_]],'74HC151':['Y',pat[s_]],'74LS153':['1Y',c153[s_&3]],'74HC153':['1Y',c153[s_&3]],'74LS157':['1Y',s_&1],'74HC157':['1Y',s_&1],'74LS158':['1Y',1-(s_&1)],'74HC158':['1Y',1-(s_&1)]};
      for(const [n,[pin,e]] of Object.entries(E)){const y=bit(lvP(chips(n)[0],pin));if(y!==e)bad.push(`${n} S${s_}→${y}`);}}
    T('lmux',!bad.length&&!ledOK(),bad.slice(0,4).join(', ')||'8종 × 선택 8가지 일치');}
  // ⓘ9
  {load('ldec');let bad=[];
    for(let a=0;a<8;a++){setSw([a&1,(a>>1)&1,(a>>2)&1]);
      for(let i=0;i<4;i++){const e=+(i!==a);if(bit(lvP(chips('74LS138')[0],'~Y'+i))!==e)bad.push(`138 ${a}:Y${i}`);for(const n of ['74LS42','74HC42'])if(bit(lvP(chips(n)[0],'~'+i))!==e)bad.push(`${n} ${a}:${i}`);
        for(const n of ['74LS139','74HC139'])if(bit(lvP(chips(n)[0],'~1Y'+i))!==+(i!==(a&3)))bad.push(`${n} ${a}:${i}`);}
      const act=[!(a&4)?7:null,!(a&2)?6:null,!(a&1)?5:null].filter(x=>x!=null),hi=act.length?act[0]:null;
      for(const n of ['74LS148','74HC148']){const code=['~A0','~A1','~A2'].map((pn,i)=>bit(lvP(chips(n)[0],pn)));const exp=hi==null?[1,1,1]:[0,1,2].map(i=>1-((hi>>i)&1));if(code.join('')!==exp.join(''))bad.push(`${n} ${a}→${code.join('')}(기대 ${exp.join('')})`);}}
    T('ldec',!bad.length&&!ledOK(),bad.slice(0,4).join(', ')||'138·139·42: 고른 번호만 LOW · 148: 가장 높은 입력 번호를 2진수(LOW=1)로');}
  // ⓘ10
  {load('larith');let bad=[];
    for(let a=0;a<4;a++){setSw([a&1,(a>>1)&1]);const sum=a+2;
      for(const n of ['74LS83','74LS283','74HC283'])for(let i=0;i<3;i++)if(bit(lvP(chips(n)[0],'S'+(i+1)))!==((sum>>i)&1))bad.push(`${n} ${a}+2`);
      for(const n of ['74LS85','74HC85']){const g=[bit(lvP(chips(n)[0],'A>B')),bit(lvP(chips(n)[0],'A=B')),bit(lvP(chips(n)[0],'A<B'))].join('');const e=a>2?'100':a===2?'010':'001';if(g!==e)bad.push(`${n} ${a}:${g}`);}
      for(const n of ['74LS688','74HC688'])if(bit(lvP(chips(n)[0],'~P=Q'))!==+(a!==2))bad.push(`${n} ${a}`);}
    T('larith',!bad.length&&!ledOK(),bad.slice(0,4).join(', ')||'덧셈 A+2 (0~3) · 비교 A>B·A=B·A<B · 688 같을 때 LOW 모두 일치');}
  // ⓘ11
  {load('lbus');const N=['74LS273','74HC273','74LS373','74HC373','74LS374','74HC374'];let bad=[];
    setSw([1]);half(1);half(1);for(const n of N)if(bit(lvP(chips(n)[0],'1Q'))!==1)bad.push(n+' D=1');setSw([0]);half(1);half(1);for(const n of N)if(bit(lvP(chips(n)[0],'1Q'))!==0)bad.push(n+' D=0');
    T('lbus',!bad.length&&!ledOK(),bad.join(', ')||'6종 모두 D를 클럭(LE)에 맞춰 받아 둠');}
  // ⓘ12
  {load('lbcd');const F7={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'cdefg',7:'abc',8:'abcdefg',9:'abcfg'};const segs=c=>{const o=SIM.seg.get(c.id)||{};return 'abcdefg'.split('').filter(k=>o[k]).join('');};
    const [s1,s2]=S.comps.filter(c=>c.t==='seg7'),cntr=chips('74LS90')[0];let bad=[],seen=[];
    for(let i=0;i<12;i++){half(1);half(1);const v=['QA','QB','QC','QD'].reduce((t,q,j)=>t|((lvP(cntr,q)===Hh?1:0)<<j),0);seen.push(v);if(segs(s1)!==F7[v]||segs(s2)!==F7[v])bad.push(`${v}: 애노드 ${segs(s1)} 캐소드 ${segs(s2)}`);}
    const bl=S.comps.filter(c=>c.t==='led').some(c=>(SIM.led.get(c.id)||{}).lit);
    T('lbcd',!bad.length&&bl&&!ledOK(),bad.slice(0,3).join(', ')||`0~9를 두 표시기가 똑같이(6·9는 꼬리 없는 7446/7448 글꼴) ${seen.join('')} · 건전지 표시등 켜짐 ${bl}`);}
  return out;});
let fail=0;for(const r of res){if(!r.ok)fail++;console.log((r.ok?'PASS ':'FAIL ')+r.k.padEnd(7)+r.msg);}
console.log(errs.length?'errs '+errs[0]:'');console.log(fail||errs.length?'icex FAIL':'icex PASS');await b.close();process.exit(fail?1:0);})();
