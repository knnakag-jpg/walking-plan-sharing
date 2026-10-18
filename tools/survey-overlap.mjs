import fs from 'node:fs';
const P='C:/Users/NKG/orca/workspaces/walking-plan-sharing/knifefish/';
const G=JSON.parse(fs.readFileSync(P+'tools/route-geom.json','utf8'));
const E=JSON.parse(fs.readFileSync(P+'tools/elevation-out.json','utf8')).courses;
const R=6371000,rad=d=>d*Math.PI/180;
const hav=(a,b)=>{const dLat=rad(b[0]-a[0]),dLon=rad(b[1]-a[1]);const h=Math.sin(dLat/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
function decode(str,p=6){const f=10**p;let i=0,lat=0,lng=0;const out=[];while(i<str.length){let r=1,s=0,b;do{b=str.charCodeAt(i++)-63-1;r+=b<<s;s+=5;}while(b>=0x1f);lat+=(r&1)?~(r>>1):(r>>1);r=1;s=0;do{b=str.charCodeAt(i++)-63-1;r+=b<<s;s+=5;}while(b>=0x1f);lng+=(r&1)?~(r>>1):(r>>1);out.push([lat/f,lng/f]);}return out;}
function ov(pts){const n=pts.length,cut=Math.floor(n*0.6),end=Math.floor(n*0.95);let re=0,tot=0;for(let i=cut;i<end;i+=2){tot++;let best=1e9;for(let j=0;j<cut;j+=2){const d=hav(pts[i],pts[j]);if(d<best)best=d;}if(best<12)re++;}return tot?re/tot:0;}
const rows=[];
for(const k of Object.keys(G)){
  if(!G[k].shape)continue;
  const e=E[k]||{};
  const pts=decode(G[k].shape);
  rows.push({k,km:+G[k].km.toFixed(2),ov:+(ov(pts)*100).toFixed(0),climb:Math.round(e.climb_m||0),desc:Math.round(e.descent_m||0),upSteep:+(e.up_steep_km||0).toFixed(2),downSteep:+(e.down_steep_km||0).toFixed(2),maxG:(e.max_grade_pct||[0])[0],startZ:(e.profile||[{}])[0].z,endZ:(e.profile||[{}]).slice(-1)[0].z});
}
rows.sort((a,b)=>(b.downSteep+0.2*b.ov)-(a.downSteep+0.2*a.ov));
console.log('id km ov% climb desc upSteep downSteep maxG startZ endZ');
for(const r of rows.slice(0,28)) console.log([r.k,r.km,r.ov,r.climb,r.desc,r.upSteep,r.downSteep,r.maxG,r.startZ,r.endZ].join(' '));
