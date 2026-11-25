// 전체 점검 3: 이상한 값이 든 회로 파일(손·AI가 만든 파일)을 불러와도 멈추거나 NaN이 생기지 않는지
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1300,height:850}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+require('path').join(__dirname,'../../index.html')+'');await p.waitForTimeout(900);
const cases={
 res_str:[{t:'res',pins:['e10','f10'],ohms:'abc'}], res_neg:[{t:'res',pins:['e10','f10'],ohms:-5}], res_none:[{t:'res',pins:['e10','f10']}], res_huge:[{t:'res',pins:['e10','f10'],ohms:1e12}], res_frac:[{t:'res',pins:['e10','f10'],ohms:2.2}],
 res_pw:[{t:'res',pins:['e10','f10'],ohms:330,pw:3,mat:'gold',tol:7}],
 res_1pin:[{t:'res',pins:['e10'],ohms:330}], res_3pin:[{t:'res',pins:['e10','f10','g11'],ohms:330}], res_nopins:[{t:'res',ohms:330}], res_badhole:[{t:'res',pins:['z10','f10']}],
 led_color:[{t:'led',pins:['e10','f10'],color:'purple'}], led_none:[{t:'led',pins:['e10','f10']}], led_pk:[{t:'led',pins:['e10','f10'],pk:'zzz',ln:'qq',lk:'x'}],
 cap_str:[{t:'cap',pins:['e10','f10'],farad:'47u'}], cap_none:[{t:'cap',pins:['e10','f10']}], cap_dk:[{t:'cap',pins:['e10','f10'],farad:1e-6,dk:'zz',vr:'x'}],
 clk_hz:[{t:'clk',pins:['j8'],hz:'fast'}], clk_0:[{t:'clk',pins:['j8'],hz:0}], clk_neg:[{t:'clk',pins:['j8'],hz:-3}],
 sw_on:[{t:'sw',pins:['e10','f10'],on:'yes'}],
 ic_col0:[{t:'ic',chip:'74LS08',col:0}], ic_colbig:[{t:'ic',chip:'74LS08',col:48}], ic_colstr:[{t:'ic',chip:'74LS08',col:'10'}], ic_nocol:[{t:'ic',chip:'74LS08'}], ic_b9:[{t:'ic',chip:'74LS08',col:10,b:9}],
 ic_lower:[{t:'ic',chip:'74ls08',col:10}],
 seg7_col:[{t:'seg7',col:'x'}],
 gate_pins:[{t:'gate',kind:'AND',pins:['e10']}], gate_lower:[{t:'gate',kind:'and',pins:['e10','e11','e14']}],
 px_bad:[{t:'px',kind:'nope',pins:['c10','c11','c12']}], px_s:[{t:'px',kind:'tog3',pins:['c10','c11','c12'],s:7}], px_sneg:[{t:'px',kind:'rbcd',pins:['f10','f11','f12','e12','e11','e10'],s:-4}],
 px_bits:[{t:'px',kind:'dip4',pins:['f20','f21','f22','f23','e23','e22','e21','e20'],bits:[1]}], px_bitsstr:[{t:'px',kind:'dip4',pins:['f20','f21','f22','f23','e23','e22','e21','e20'],bits:'1010'}],
 px_pos:[{t:'px',kind:'pot16',pins:['c20','c21','c22'],pos:5,taper:'Z',ohms:'big'}], px_wrongpins:[{t:'px',kind:'pot16',pins:['c20','c21']}],
 led3_pins:[{t:'led3',pins:['c2','c3']}],
 psu_v:[{t:'psu',k:1,x:20,y:440,v:'high'}], psu_nok:[{t:'psu',x:20,y:440}], psu_dupk:[{t:'psu',k:1,x:20,y:440},{t:'bat',k:1,x:220,y:440}],
 psu_noxy:[{t:'psu',k:1}], fg_bad:[{t:'fg',k:1,x:20,y:440,wave:'zz',hz:'x',vpp:-1,duty:500}], osc_bad:[{t:'osc',k:1,x:20,y:440,tdiv:0,vdiv:'x'}],
 wire_term:[{t:'psu',k:1,x:20,y:440,v:5},{t:'wire',pins:['@1:0','tp3']},{t:'wire',pins:['@9:0','tp4']}],
 wire_same:[{t:'wire',pins:['a3','a3']}], wire_color:[{t:'wire',pins:['a3','a9'],color:'javascript:x'}], wire_pts:[{t:'wire',pins:['a3','a9'],pts:[{x:'a',y:3}]}], wire_ptsnull:[{t:'wire',pins:['a3','a9'],pts:[null]}],
 unknown_t:[{t:'transistor',pins:['a3','a4','a5']}], null_item:[null,5,'x',{t:'res',pins:['e10','f10'],ohms:330}],
};
const boardCases={boards_bad:[{id:1,type:'giant',x:0,y:0}],boards_no1:[{id:2,type:'std',x:0,y:0}],boards_str:[{id:'1',type:'std',x:'0',y:0}],boards_empty:[]};
const res=[];
for(const [k,comps] of Object.entries(cases)){const e0=errs.length;const r=await p.evaluate(([k,comps])=>{let ex='';try{applyCircuit({comps:JSON.parse(JSON.stringify(comps))});for(let i=0;i<4;i++){simBase+=0.2;settle();render();}
   for(const c of S.comps){sel={type:'comp',id:c.id};renderInfo();}setVM('sch');renderSch&&renderSch();setVM('bb');}catch(e){ex=e.message;}
   const h=document.querySelector('#bw').innerHTML+$('info').innerHTML+($('sch')?$('sch').innerHTML:'');const m=h.match(/.{0,80}NaN.{0,30}/);
   return{n:S.comps.length,ex,nan:m?m[0]:''};},[k,comps]);
  await p.waitForTimeout(80);const pe=errs.slice(e0);if(r.ex||r.nan||pe.length)res.push(k+' '+JSON.stringify(r)+(pe.length?' PAGEERR '+pe[0]:''));}
for(const [k,boards] of Object.entries(boardCases)){const e0=errs.length;const r=await p.evaluate(([k,boards])=>{let ex='';try{applyCircuit({boards,comps:[{t:'res',pins:['e10','f10'],ohms:330}]});settle();render();}catch(e){ex=e.message;}return{n:S.comps.length,b:S.boards.length,ex};},[k,boards]);
  await p.waitForTimeout(80);const pe=errs.slice(e0);if(r.ex||pe.length)res.push(k+' '+JSON.stringify(r)+(pe.length?' PAGEERR '+pe[0]:''));}
console.log(res.length?res.join('\n'):'no problems');await b.close();})();
