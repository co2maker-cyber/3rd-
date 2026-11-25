// 전체 점검 5: 목록 가져오기(이상한 줄·큰 회로) + 회로도 데이터(sch) 이상값
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').join(__dirname,'../../index.html')+'');await p.waitForTimeout(900);
const big=['# 부품'];const nets=['# 연결'];for(let i=1;i<=40;i++){big.push(`D${i} LED red`,`R${i} 저항 330`);nets.push(`N${i}: U${1+((i-1)%8)>>0}.${[1,2,3,4,5,6,8,9,10,11,12,13][i%12]}, D${i}.A`,`K${i}: D${i}.K, R${i}.1`,`GND: R${i}.2`);}
for(let u=1;u<=8;u++)big.push(`U${u} 74LS04`);
const lists={
 big:big.concat(nets).join('\n'),
 weird:'# 부품\nU1 74LS999\nR1 저항 abc\nD1 LED\nC1 커패시터 0\nCLK1 클럭 -5\nX1 모르는것\nU1 74LS08\n# 연결\nN1: U1.99, R1.1\nN2: R1.2 D1.A\n: D1.K\nGND\nVCC: Z9.1\nN3 U1.1',
 dup:'U1 74LS08\nU2 74LS08\nN1: U1.3, U1.3, U2.1\nN1: U2.2, U1.3\nVCC: U1.1\nGND: U1.1',
 empty:'# nothing',
 unicode:'U1 74LS08\nR1 저항 4.7kΩ\nD1 LED 초록\nN1: U1.3 → R1.1\nN2: R1.2, D1.A\nGND: D1.K',
 crlf:'U1 74LS08\r\nD1 LED red\r\nN1: U1.3, D1.A\r\nGND: D1.K\r\n',
 power_only:'U1 74LS08\nVCC: U1.14\nGND: U1.7',
 seg:'U1 CD4511\nDS1 7세그 cathode\nN1: U1.13, DS1.a\nN2: U1.12, DS1.b\nGND: DS1.COM',
 gates:'G1 AND\nG2 NOT\nSW1 스위치\nSW2 스위치 on\nD1 LED\nR1 저항 330\nVCC: SW1.1, SW2.1\nA: SW1.2, G1.A\nB: SW2.2, G1.B\nY: G1.Y, G2.A\nZ: G2.Y, D1.A\nL: D1.K, R1.1\nGND: R1.2',
};
for(const [k,txt] of Object.entries(lists)){const e0=errs.length;const r=await p.evaluate(txt=>{let ex='';let out={};try{$('impText').value=txt;openImport();runImport();for(let i=0;i<4;i++){simBase+=.3;settle();render();}
  out={n:S.comps.length,boards:S.boards.length,warns:SIM.warns.length,info:$('info').textContent.slice(0,120)};setVM('sch');setVM('bb');}catch(e){ex=e.message;}
  const h=document.querySelector('#bw').innerHTML;return{...out,ex,nan:/NaN/.test(h)};},txt);
  console.log(k.padEnd(10),JSON.stringify(r),errs.slice(e0).join(' / ').slice(0,200));}
// 회로도 데이터 이상값
const schCases={bad1:{parts:[{id:1,t:'res'},{id:2,t:'zzz',x:'a'}],wires:[{id:1,a:{p:9,k:0},b:{p:1,k:5}}]},bad2:{parts:'x',wires:null},bad3:{parts:[null,{id:3,t:'ic',chip:'NOPE',x:0,y:0}],wires:[{}]},bad4:{parts:[{id:1,t:'led',x:1e9,y:-1e9}],wires:[]}};
for(const [k,sch] of Object.entries(schCases)){const e0=errs.length;const r=await p.evaluate(sch=>{let ex='';try{applyCircuit({comps:[{t:'res',pins:['e10','f10'],ohms:330}],sch});setVM('sch');renderSch();setVM('bb');render();}catch(e){ex=e.message;}return{ex,n:S.comps.length,sp:SCH.parts.length};},sch);
  console.log('sch '+k.padEnd(6),JSON.stringify(r),errs.slice(e0).join(' / ').slice(0,200));}
await b.close();})();
