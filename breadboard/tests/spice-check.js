// SPICE 라이브러리(spice/bbcad-parts.lib)를 ngspice로 돌려 결과가 기대 범위인지 확인한다.
// 사용: node breadboard/tests/spice-check.js   (ngspice가 없으면 건너뜀)
const {execSync}=require('child_process'),fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','spice');
try{execSync('ngspice -v',{stdio:'ignore'});}catch(e){console.log('spice-check SKIP (ngspice 없음)');process.exit(0);}
const run=f=>{execSync(`ngspice -b ${f}.cir`,{cwd:dir,stdio:'ignore'});const o={};for(const l of fs.readFileSync(path.join(dir,f+'.out'),'utf8').split('\n')){const m=/^(\w+)\s*=\s*(\S+)/.exec(l);if(m)o[m[1]]=+m[2];}fs.unlinkSync(path.join(dir,f+'.out'));return o;};
const R=[],ck=(n,ok,msg)=>R.push([n,!!ok,msg]);
let o=run('tb-relay');
ck('릴레이 붙는 지연 0.5~3ms',o.t_on-5e-3>.5e-3&&o.t_on-5e-3<3e-3,((o.t_on-5e-3)*1e3).toFixed(2)+'ms');
ck('릴레이 떨어지는 지연 0.5~6ms',o.t_off-25e-3>.5e-3&&o.t_off-25e-3<6e-3,((o.t_off-25e-3)*1e3).toFixed(2)+'ms');
ck('역전압 다이오드가 코일 끝을 약 6V 아래로 잡음',o.vmax_diode<6.5,o.vmax_diode.toFixed(2)+'V');
ck('다이오드 없으면 큰 역전압(100V 넘음)',o.vmax_none>100,o.vmax_none.toFixed(0)+'V');
ck('NO·NC 동시에 이어지지 않음',o.overlap<1,o.overlap.toExponential(1));
o=run('tb-inductor');
ck('축형 100µH 자기 공진 6MHz',Math.abs(o.f_axial/6e6-1)<.03,(o.f_axial/1e6).toFixed(2)+'MHz');
ck('레이디얼 100µH 자기 공진 7MHz',Math.abs(o.f_radial/7e6-1)<.03,(o.f_radial/1e6).toFixed(2)+'MHz');
ck('축형 1kHz 임피던스 ≈ √(DCR²+(ωL)²)',Math.abs(o.z1k_axial-Math.hypot(.71,2*Math.PI*1e3*100e-6))<.02,o.z1k_axial.toFixed(3)+'Ω');
ck('레이디얼 100kHz 임피던스 ≈ ωL',Math.abs(o.z100k_radial/(2*Math.PI*1e5*100e-6)-1)<.02,o.z100k_radial.toFixed(1)+'Ω');
o=run('tb-bridge');
ck('브리지 출력 피크 ≈ 12.7 − 2×(약 0.9V)',o.vraw_max>10.6&&o.vraw_max<11.6,o.vraw_max.toFixed(2)+'V');
ck('제너 출력 5.0~5.2V',o.vout_avg>5&&o.vout_avg<5.2,o.vout_avg.toFixed(3)+'V');
for(const [n,ok,m] of R)console.log((ok?'ok  ':'BAD ')+n+'  '+m);
const bad=R.filter(r=>!r[1]).length;console.log(bad?'spice-check FAIL':'spice-check PASS');process.exit(bad?1:0);
