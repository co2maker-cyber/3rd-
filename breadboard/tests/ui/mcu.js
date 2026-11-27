// 23차: 마이컴 보드(코드 해석기·핀·전원·디버거·편집기·시리얼), 스펙트럼 분석기, 보드 돌리기, 예제 Ⓜ1·Ⓜ2·Ⓟ11
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
const res=await p.evaluate(async()=>{const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
  // 시간 흘리기: 일시 정지해 두고(자동 시계가 끼어들지 않게) 20ms씩 직접 돌린다
  setPaused(true);const run=sec=>{for(let t=0;t<sec;t+=.02){tHold+=.02;mcuTick(simNow());settle();}};
  const BOARD=[{id:1,type:'full',x:0,y:0}];
  const build=comps=>{S.power=true;loadComps(JSON.parse(JSON.stringify(comps)),true,BOARD);RT.clear();settle();return S.comps;};
  const lvAt=id=>{const h=HOLES.get(id);return SIM.lvl.get(SIM.netOf[h.i]);};
  const pinHole=(c,num)=>{const D=PX[c.kind].mcu,mp=mcuMap(D,PX[c.kind].pins);return c.pins[mp.io.get(num)];};
  // ① 해석기 단독
  {const R=(src,ib=16)=>{const r=MCUC.compile(src,{intBits:ib,consts:{LED_BUILTIN:13,A0:14}});if(!r.ok)return'ERR '+r.err.ln+' '+r.err.msg;let o='';
      const vm=MCUC.start(r.P,{valid:()=>true,isAnalog:()=>true,serIn:[]},{out:s=>o+=s});vm.serOn=true;for(let i=0;i<20000;i++){const y=MCUC.step(vm);if(y.k==='dl')vm.t+=y.s;if(y.k==='err')return o+'!! '+y.ln+' '+y.msg;if(vm.t>2)break;}return o;};
    T('int 16비트 넘침 (30000+30000)',R('void setup(){Serial.begin(9600);int x=30000;x+=30000;Serial.println(x);}void loop(){}').startsWith('-5536'));
    T('int 32비트 보드는 안 넘침',R('void setup(){Serial.begin(9600);int x=30000;x+=30000;Serial.println(x);}void loop(){}',32).startsWith('60000'));
    T('정수 나눗셈·소수 출력',R('void setup(){Serial.begin(9600);Serial.println(7/2);Serial.println(7.0/2);Serial.println(255,HEX);}void loop(){}')==='3\n3.50\nFF\n');
    T('함수·재귀·배열·sizeof',R('int f(int n){return n<2?1:n*f(n-1);}int a[]={1,2,3};void setup(){Serial.begin(9600);Serial.println(f(6)+sizeof(a)/sizeof(a[0]));}void loop(){}')==='723\n');
    T('switch·while·break·continue',R('void setup(){Serial.begin(9600);int k=0,s=0;while(1){k++;if(k>6)break;if(k%2)continue;s+=k;}switch(s){case 12:Serial.println("ok");break;default:Serial.println("no");}}void loop(){}')==='ok\n');
    T('#define 값·함수 모양',R('#define N 4\n#define SQ(x) ((x)*(x))\nvoid setup(){Serial.begin(9600);Serial.println(SQ(N+1));}void loop(){}')==='25\n');
    const e1=R('void setup(){int a[3];a[3]=1;}void loop(){}');T('실행 오류: 배열 칸 넘침',/배열 칸을 넘었어요/.test(e1),e1);
    const e2=R('void setup(){\nint x=5\nx++;}\nvoid loop(){}');T('번역 오류: 세미콜론 빠짐 줄 번호',/^ERR 2 .*세미콜론/.test(e2),e2);
    const e3=R('void setup(){}');T('번역 오류: loop 없음',/loop\( \) 함수가 없어요/.test(e3),e3);
    const e4=R('void setup(){y=1;}void loop(){}');T('번역 오류: 모르는 이름',/'y'이\(가\) 무엇인지 몰라요/.test(e4),e4);}
  // ② 소형 보드 깜박이기: D13이 0.5초마다 바뀐다
  {const cs=build([{t:'px',kind:'nano',pins:pxHolesAt('nano',1,null,5),code:MCU_BLINK}]);const c=cs[0];run(.1);const m=rt(c).m;
    const h13=pinHole(c,13),a=lvAt(h13);run(.5);const b_=lvAt(h13);run(.5);const c_=lvAt(h13);
    T('USB 전원으로 켜짐',rt(c).mpw&&m.st==='run',m.st);T('D13 깜박임 HIGH→LOW→HIGH',a===Hh&&b_===L&&c_===Hh,[a,b_,c_].join(','));
    T('시리얼 출력',/안녕하세요!/.test(m.ser)&&/깜박인 횟수: 1/.test(m.ser),JSON.stringify(m.ser));
    const pw5=PX.nano.pins.indexOf('5V');T('USB면 5V 핀에서 5V',lvAt(c.pins[pw5])===Hh&&Math.abs(SIM.vOf(SIM.netOf[HOLES.get(c.pins[pw5]).i])-5)<.01);}
  // ③ 예제 Ⓜ1: 버튼으로 초록 LED 토글, 가변저항 → PWM
  {const ex=EXAMPLES.mbasic();S.power=true;loadComps(ex.comps,false,ex.boards);RT.clear();commit(true);run(.3);
    const c=S.comps.find(x=>x.t==='px'&&x.kind==='nano'),m=rt(c).m,btn=S.comps.find(x=>x.t==='btn'),pot=S.comps.find(x=>x.t==='px'&&x.kind==='pot16');
    const g0=m.out[mcuMap(PX.nano.mcu,PX.nano.pins).io.get(8)]||0;rt(btn).pressed=true;settle();run(.1);rt(btn).pressed=false;settle();run(.1);const g1=m.out[mcuMap(PX.nano.mcu,PX.nano.pins).io.get(8)];
    T('Ⓜ1 버튼 한 번 → 초록 LED 켜짐',!g0&&g1===1,g0+'→'+g1);T('Ⓜ1 시리얼 "초록 켜짐"',/초록 켜짐/.test(m.ser),JSON.stringify(m.ser.slice(-60)));
    const k9=mcuMap(PX.nano.mcu,PX.nano.pins).io.get(9),p0=m.pwm[k9];pot.pos=.9;settle();run(.1);const p1=m.pwm[k9];T('Ⓜ1 가변저항 돌리면 PWM 바뀜 (A0 → D9)',p0>100&&p0<150&&p1>200,p0+'→'+p1);
    T('Ⓜ1 경고 없음',!SIM.warns.some(w=>w[0]!=='info'),JSON.stringify(SIM.warns.map(w=>w[1].slice(0,50))));}
  // ④ 프로 미니형: USB가 없어 전원 핀에 전원을 줘야 돈다
  {const pins=pxHolesAt('pro',1,null,5);const vcc=pins[PX.pro.pins.indexOf('VCC (5V)')],gnd=pins[PX.pro.pins.indexOf('GND')];
    build([{t:'px',kind:'pro',pins,code:MCU_BLINK}]);run(.1);const off=!rt(S.comps[0]).mpw;
    const c0=vcc.replace(/^[a-j]/,''),g0=gnd.replace(/^[a-j]/,'');
    build([{t:'px',kind:'pro',pins,code:MCU_BLINK},{t:'wire',pins:['a'+c0,'tp'+(c0%6?c0:+c0+1)]},{t:'wire',pins:['j'+g0,'bn'+(g0%6?g0:+g0+1)]}]);run(.1);
    T('프로 미니형: 전원 없으면 멈춤, VCC를 5V 레일에 이으면 돎',off&&rt(S.comps[0]).mpw&&rt(S.comps[0]).m.st==='run',off+' '+rt(S.comps[0]).mpw);}
  // ⑤ 와이파이형: 3.3V 논리, 12비트 ADC
  {const code='void setup(){Serial.begin(115200);pinMode(LED_BUILTIN,OUTPUT);digitalWrite(LED_BUILTIN,HIGH);Serial.println(analogRead(A6));long big=100000;int x=big*3;Serial.println(x);}void loop(){}';
    const pins=pxHolesAt('wifi',1,null,5),k34=PX.wifi.pins.findIndex(n=>/^GPIO34 /.test(n)),col=pins[k34].replace(/^[a-j]/,'');
    build([{t:'px',kind:'wifi',pins,code},{t:'wire',pins:[(pins[k34][0]==='f'?'j':'a')+col,(pins[k34][0]==='f'?'bp':'tp')+(col%6?col:+col+1)]}]);run(.1);
    const c=S.comps[0],m=rt(c).m;const h2=pinHole(c,2),v2=SIM.vOf(SIM.netOf[HOLES.get(h2).i]);
    T('와이파이형: 내장 LED(GPIO2) 3.3V',Math.abs(v2-3.3)<.01,v2);T('와이파이형: 12비트 ADC 꽉 참 4095, int 32비트',/^4095\n300000\n/.test(m.ser),JSON.stringify(m.ser));}
  // ⑥ 디버거: 중단점 · 한 줄씩 · 들어가기 · 나오기 · 변수
  {const code='int total=0;\nint add(int a,int b){\n  int s=a+b;\n  return s;\n}\nvoid setup(){}\nvoid loop(){\n  int x=add(2,3);\n  total+=x;\n  delay(100);\n}';
    build([{t:'px',kind:'nano',pins:pxHolesAt('nano',1,null,5),code,bp:[9]}]);const c=S.comps[0];const m=mcuM(c);m.bp=new Set([9]);run(.1);
    T('중단점 9줄에서 멈춤',m.st==='pause'&&m.vm.ln===9,m.st+' '+(m.vm&&m.vm.ln));
    const V=MCUC.vars(m.vm),top=V.fr[V.fr.length-1];T('변수 보기: loop 안 x = 5',top.nm==='loop'&&top.vars.some(v=>v.nm==='x'&&v.v==='5'),JSON.stringify(top));
    m.bp.clear();m.stp={mode:'over',d:m.vm.frames.length};m.st='run';run(.02);T('한 줄씩: 10줄로',m.st==='pause'&&m.vm.ln===10,m.vm.ln);
    m.stp=null;m.st='run';run(.15);m.st='pause';m.stp={mode:'into',d:m.vm.frames.length};m.st='run';run(.02);
    let guard=0;while(m.vm.ln!==8&&guard++<10){m.stp={mode:'into',d:m.vm.frames.length};m.st='run';run(.02);}
    m.stp={mode:'into',d:m.vm.frames.length};m.st='run';run(.02);T('들어가기: add( ) 안 3줄, 깊이 2',m.vm.ln===3&&m.vm.frames.length===2,m.vm.ln+' d'+m.vm.frames.length);
    m.stp={mode:'out',d:m.vm.frames.length};m.st='run';run(.02);T('나오기: 다시 loop( )',m.vm.frames.length===1&&m.vm.ln===9,m.vm.ln+' d'+m.vm.frames.length);
    const g=MCUC.vars(m.vm).g.find(v=>v.nm==='total');T('전역 변수 total 값',g&&+g.v>=5,g&&g.v);}
  // ⑦ 편집기 창: 번역 오류는 올리지 않고, 고치면 올라간다 · 시리얼 입력
  {build([{t:'px',kind:'nano',pins:pxHolesAt('nano',1,null,5),code:MCU_BLINK}]);const c=S.comps[0];run(.05);mcuOpen(c.id);
    const ta=document.getElementById('mwTa');ta.value='void setup(){\n  int x = ;\n}\nvoid loop(){}';ta.oninput();mcuUpload(false);
    T('편집기: 번역 오류면 업로드 안 함',c.code===MCU_BLINK&&/번역 오류 — 2줄/.test(document.getElementById('mwSt').textContent),document.getElementById('mwSt').textContent.slice(0,60));
    ta.value=MCUEX.find(e=>e[0]==='serial')[2]();ta.oninput();mcuUpload(false);run(.1);const m=rt(c).m;T('편집기: 업로드하면 새 코드로 다시 시작',c.code===ta.value&&/1 = 켜기/.test(m.ser),JSON.stringify(m.ser.slice(0,40)));
    for(const ch of '1\n')m.serIn.push(ch.charCodeAt(0));run(.1);T('시리얼 입력 "1" → LED 켰어요',/LED 켰어요/.test(m.ser)&&lvAt(pinHole(c,13))===Hh,JSON.stringify(m.ser.slice(-30)));
    for(const t of ['var','stk','pin','ser']){MCUED.tab=t;mcuPane(true);}T('편집기 탭 4개 그리기',document.getElementById('mwPane').textContent.length>0);
    document.getElementById('mwX').click();}
  // ⑧ 스펙트럼 분석기: tone 440Hz → 기본파와 3차 고조파(−9.5dB), 교정 신호 −10dBm
  {const pins=pxHolesAt('nano',1,null,5),k8=mcuMap(PX.nano.mcu,PX.nano.pins).io.get(8),h=pins[k8],col=h.replace(/^[a-j]/,'');
    build([{t:'px',kind:'nano',pins,code:'void setup(){tone(8,440);}void loop(){}'},{t:'spa',k:7,x:40,y:460,cf:1500,span:3000,swt:.2},{t:'wire',pins:['@7:0',(h[0]==='f'?'j':'a')+col]}]);
    const c=S.comps.find(x=>x.t==='spa');run(.6);for(let i=0;i<20;i++){tHold+=.02;spaTick(simNow());}
    const mk=spaMarker(c),tr=rt(c).done||rt(c).tr,at=f=>{const {f0,f1}=spaRng(c);const i=Math.round((f-f0)/(f1-f0)*(SPA_N-1));return Math.max(...[-2,-1,0,1,2].map(d=>tr[i+d]));};
    T('분석기: 마커 ≈ 440Hz',mk&&Math.abs(mk.f-440)<10,mk&&mk.f);T('분석기: 5Vpp 구형파 기본파 ≈ +20dBm',mk&&Math.abs(mk.db-20)<1.5,mk&&mk.db.toFixed(1));
    T('분석기: 3차 고조파 ≈ −9.5dB, 2차는 없음',Math.abs(at(1320)-at(440)+9.54)<1.5&&at(880)<at(440)-50,[at(440),at(880),at(1320)].map(x=>x.toFixed(1)).join(' '));
    c.cal=1;c.cf=1000;c.span=500;for(let i=0;i<40;i++){tHold+=.02;spaTick(simNow());}const mc=spaMarker(c);T('분석기: 교정 신호 1kHz −10dBm',mc&&Math.abs(mc.f-1000)<3&&Math.abs(mc.db+10)<1,mc&&(mc.f+' '+mc.db.toFixed(2)));
    c.cal=0;spaAuto(c);T('분석기: 신호 찾아 맞추기 → 0~5kHz',+c.span===5000,c.span);}
  // ⑨ 보드 돌리기: 구멍 위치가 돌고, 연결·동작은 그대로, 저장·불러오기·되돌리기
  {const ex=EXAMPLES.mbasic();S.power=true;loadComps(ex.comps,false,ex.boards);RT.clear();commit(true);run(.2);
    const before=JSON.stringify([...SIM.lvl.entries()].sort()),a1=HOLES.get('a1'),p0={x:a1.x,y:a1.y};rotateBoard(1,90);run(.05);const a1b=HOLES.get('a1');
    T('돌리면 구멍 위치가 바뀜',Math.abs(a1b.x-p0.x)>50&&Math.abs(a1b.y-p0.y)>50,JSON.stringify([p0,{x:a1b.x,y:a1b.y}]));
    let okG=0,n=0;for(const h of HL){if(h.b!==1||n>300)continue;n++;const g=gridAt({x:h.x,y:h.y});if(holeAt(g.ri,g.c,g.b)===h)okG++;}T('돌린 보드에서 화면 위치 → 구멍 찾기',okG===n,okG+'/'+n);
    T('돌려도 회로 동작 같음',JSON.stringify([...SIM.lvl.entries()].sort())===before);
    const bx=boardBox(boardById(1));T('돌린 보드 상자 세로가 더 김',bx.y1-bx.y0>bx.x1-bx.x0,JSON.stringify(bx));
    save();const sv=store.get('circuit');T('저장에 rot 들어감',sv.boards[0].rot===90);loadComps(sv.comps,true,sv.boards);T('불러와도 90°',boardById(1).rot===90);
    undo();undo();T('되돌리기(Ctrl+Z)로 0°',!boardById(1).rot,boardById(1).rot);
    let er='';try{render();renderBoards();}catch(e){er=e.message;}T('되돌린 뒤 그리기 오류 없음',!er&&document.querySelectorAll('#gB .hole').length>0,er);}
  // ⑩ 예제 셋 · 회로도·PCB 화면
  for(const k of ['mbasic','mlight','pspec']){const ex=EXAMPLES[k]();S.power=true;loadComps(ex.comps,false,ex.boards);RT.clear();commit(true);run(.3);
    const mc=S.comps.find(x=>x.t==='px'&&PX[x.kind].mcu),m=rt(mc).m;T(`예제 ${k}: 코드 실행 · 경고 없음`,m&&m.st==='run'&&!m.cerr&&!SIM.warns.some(w=>w[0]!=='info'),(m&&m.st)+' '+JSON.stringify(SIM.warns.map(w=>w[1].slice(0,40))));}
  {setVM('sch');setVM('pcb');setVM('bb');T('회로도·PCB 화면 오가기',true);}
  // ⑪ 부품 고르기에 마이컴 보드 5종
  {const t=PTREE.find(x=>x.k==='mcu');T('부품 고르기 [마이컴 보드] 5종',t&&t.items.length===5,t&&t.items.map(i=>i.t[0]).join(' '));
    T('계측기에 스펙트럼 분석기',PTREE.find(x=>x.k==='inst').items.some(i=>i.t[0]==='spa'));}
  setPaused(false);return out;});
for(const r of res)console.log((r.ok?'ok  ':'BAD ')+r.k+'  '+r.msg);
console.log('errors',errs);
const bad=res.filter(r=>!r.ok).length+errs.length;console.log(bad?'mcu FAIL':'mcu PASS');await b.close();})();
