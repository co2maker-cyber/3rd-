// 스펙트럼 분석기(구형파 고조파·사인파·교정 신호·자동 맞춤), 보드 돌리기(구멍 위치·찾기·동작·저장·되돌리기), 예제 Ⓟ11
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+path.join(__dirname,'../../index.html'));await p.waitForTimeout(900);
const res=await p.evaluate(()=>{const out=[],T=(k,ok,msg)=>out.push({k,ok:!!ok,msg:msg==null?'':String(msg)});
  setPaused(true);const sweep=(c,n=40)=>{for(let i=0;i<n;i++){tHold+=.05;settle();spaTick(simNow());}};
  // ① 분석기: 함수 발생기 구형파 5Vpp 4Hz → 기본파 ≈ +20dBm, 3차 −9.5dB, 2차 없음
  {S.power=true;loadComps([{t:'fg',k:6,wave:'sq',hz:4,vpp:5,off:0,duty:50,x:0,y:460},{t:'spa',k:7,x:200,y:460,cf:15,span:30,swt:.2},{t:'wire',pins:['@6:0','a10']},{t:'wire',pins:['@6:1','tn10']},{t:'wire',pins:['@7:0','b10']}],true,[{id:1,type:'full',x:0,y:0}]);RT.clear();settle();
    const c=S.comps.find(x=>x.t==='spa');sweep(c);const mk=spaMarker(c),at=f=>{const tr=rt(c).done||rt(c).tr,{f0,f1}=spaRng(c);const i=Math.round((f-f0)/(f1-f0)*(SPA_N-1));return Math.max(...[-2,-1,0,1,2].map(d=>tr[i+d]));};
    T('분석기: 마커 ≈ 4Hz',mk&&Math.abs(mk.f-4)<.3,mk&&mk.f);T('분석기: 구형파 기본파 ≈ +20dBm',mk&&Math.abs(mk.db-20)<1.5,mk&&mk.db.toFixed(1));
    T('분석기: 3차 −9.5dB, 2차 없음',Math.abs(at(12)-at(4)+9.54)<1.5&&at(8)<at(4)-40,[at(4),at(8),at(12)].map(x=>x.toFixed(1)).join(' '));
    T('분석기: 신호원 직접 계산',/함수 발생기/.test(rt(c).how),rt(c).how);
    const fg=S.comps.find(x=>x.t==='fg');fg.wave='sin';sweep(c);const tr2=rt(c).done;T('분석기: 사인파면 고조파 없음',at(12)<at(4)-40,[at(4),at(12)].map(x=>x.toFixed(1)).join(' '));
    c.cal=1;c.cf=1000;c.span=500;sweep(c);const mc=spaMarker(c);T('분석기: 교정 신호 1kHz −10dBm',mc&&Math.abs(mc.f-1000)<3&&Math.abs(mc.db+10)<1,mc&&(mc.f+' '+mc.db.toFixed(2)));
    c.cal=0;fg.wave='sq';spaAuto(c);T('분석기: 신호 찾아 맞추기 → 0~50Hz',+c.span===50,c.span);}
  // ② 보드 돌리기
  {const ex=EXAMPLES.paana();S.power=true;loadComps(ex.comps,false,ex.boards);RT.clear();commit(true);settle();
    const before=JSON.stringify([...SIM.lvl.entries()].sort()),a1=HOLES.get('a1'),p0={x:a1.x,y:a1.y};rotateBoard(1,90);settle();const a1b=HOLES.get('a1');
    T('돌리면 구멍 위치가 바뀜',Math.abs(a1b.x-p0.x)>50&&Math.abs(a1b.y-p0.y)>50,JSON.stringify([p0,{x:a1b.x,y:a1b.y}]));
    let okG=0,n=0;for(const h of HL){if(h.b!==1||n>300)continue;n++;const g=gridAt({x:h.x,y:h.y});if(holeAt(g.ri,g.c,g.b)===h)okG++;}T('돌린 보드에서 화면 위치 → 구멍 찾기',okG===n,okG+'/'+n);
    T('돌려도 회로 동작 같음',JSON.stringify([...SIM.lvl.entries()].sort())===before);
    const bx=boardBox(boardById(1));T('돌린 보드 상자 세로가 더 김',bx.y1-bx.y0>bx.x1-bx.x0,JSON.stringify(bx));
    save();const sv=store.get('circuit');T('저장에 rot 들어감',sv.boards[0].rot===90);loadComps(sv.comps,true,sv.boards);T('불러와도 90°',boardById(1).rot===90);
    undo();undo();T('되돌리기로 0°',!boardById(1).rot,boardById(1).rot);
    let er='';try{render();renderBoards();}catch(e){er=e.message;}T('되돌린 뒤 그리기 오류 없음',!er&&document.querySelectorAll('#gB .hole').length>0,er);}
  // ③ 예제 Ⓟ11 · 목록
  {const ex=EXAMPLES.pspec();S.power=true;loadComps(ex.comps,false,ex.boards);RT.clear();commit(true);settle();const sa=S.comps.filter(x=>x.t==='spa');for(const c of sa)sweep(c,30);
    T('Ⓟ11 분석기 2대 신호원 직접',sa.length===2&&sa.every(c=>/함수 발생기/.test(rt(c).how)),sa.map(c=>rt(c).how).join(' | '));
    T('Ⓟ11 경고 없음',!SIM.warns.some(w=>w[0]!=='info'),JSON.stringify(SIM.warns.map(w=>w[1].slice(0,50))));
    T('계측기에 스펙트럼 분석기',PTREE.find(x=>x.k==='inst').items.some(i=>i.t[0]==='spa'));T('마이컴 보드는 없음',!Object.values(PX).some(d=>d.mcu)&&!PTREE.some(x=>x.k==='mcu')&&typeof MCUC==='undefined');}
  setPaused(false);return out;});
for(const r of res)console.log((r.ok?'ok  ':'BAD ')+r.k+'  '+r.msg);
console.log('errors',errs);
const bad=res.filter(r=>!r.ok).length+errs.length;console.log(bad?'spa-rot FAIL':'spa-rot PASS');await b.close();})();
