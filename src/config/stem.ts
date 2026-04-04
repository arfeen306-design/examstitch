// ─── STEM Interactive Hub — Simulation Data ─────────────────────────────────

export interface Simulation {
  id: string;
  title: string;
  description: string;
  icon: string;       // Lucide icon name
  gradient: string;   // Tailwind gradient classes
  glowColor: string;  // rgba glow for hover
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  instructions: string;
  html_code: string | null;   // full HTML document rendered in sandbox iframe
}

export interface StemCategory {
  id: string;
  label: string;
  slug: string;
  description: string;
  icon: string;
  gradient: string;
  glowColor: string;
  heroGradient: string;
  simulations: Simulation[];
}

// ── Simulation HTML templates ────────────────────────────────────────────────

const GEOMETRY_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;user-select:none}
canvas{display:block;cursor:grab}
canvas.paused{cursor:pointer}
canvas.drawing{cursor:crosshair}
canvas.doodling{cursor:crosshair}
#top-bar{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;z-index:20;background:linear-gradient(180deg,rgba(10,10,26,0.9),transparent);pointer-events:none}
#top-bar>*{pointer-events:auto}
#shape-name{color:#fff;font-size:16px;font-weight:700;letter-spacing:0.5px}
#measurements{color:rgba(255,255,255,0.55);font-size:11px;line-height:1.6}
#controls{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:20;flex-wrap:wrap;justify-content:center;max-width:95vw}
.cat-group{display:flex;gap:4px;padding:5px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px}
.cat-label{position:absolute;top:-14px;left:8px;font-size:8px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;font-weight:700}
.cat-wrap{position:relative;padding-top:10px}
button{padding:7px 13px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;white-space:nowrap}
button:hover{background:rgba(255,255,255,0.14);color:#fff;transform:translateY(-1px)}
button.active{background:rgba(59,130,246,0.35);border-color:rgba(59,130,246,0.6);color:#93c5fd;box-shadow:0 0 12px rgba(59,130,246,0.2)}
button.tool-active{background:rgba(16,185,129,0.3);border-color:rgba(16,185,129,0.5);color:#6ee7b7;box-shadow:0 0 12px rgba(16,185,129,0.2)}
#pause-badge{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.12);font-size:16px;pointer-events:none;transition:opacity .3s;z-index:5;background:rgba(255,255,255,0.05);padding:8px 20px;border-radius:20px;border:1px solid rgba(255,255,255,0.08);opacity:0}
#draw-hint{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.15);font-size:14px;pointer-events:none;transition:opacity .3s;z-index:5}
</style></head><body>
<canvas id="c"></canvas>
<div id="top-bar">
  <div>
    <div id="shape-name">Cube</div>
    <div id="measurements"></div>
  </div>
  <div id="draw-status" style="font-size:11px;color:rgba(255,255,255,0.4)">Click to pause · Drag to rotate · Scroll to zoom</div>
</div>
<div id="draw-hint"></div>
<div id="pause-badge">PAUSED — click to resume</div>
<div id="controls">
  <div class="cat-wrap"><span class="cat-label">Basic</span><div class="cat-group">
    <button onclick="set('cube')" id="b-cube" class="active">Cube</button>
    <button onclick="set('cuboid')" id="b-cuboid">Cuboid</button>
    <button onclick="set('sphere')" id="b-sphere">Sphere</button>
    <button onclick="set('cone')" id="b-cone">Cone</button>
    <button onclick="set('cylinder')" id="b-cylinder">Cylinder</button>
    <button onclick="set('pyramid')" id="b-pyramid">Pyramid</button>
    <button onclick="set('torus')" id="b-torus">Torus</button>
    <button onclick="set('hemisphere')" id="b-hemisphere">Hemisphere</button>
  </div></div>
  <div class="cat-wrap"><span class="cat-label">Compound</span><div class="cat-group">
    <button onclick="set('pyr_cube')" id="b-pyr_cube">Pyramid+Cube</button>
    <button onclick="set('cone_cyl')" id="b-cone_cyl">Cone+Cylinder</button>
    <button onclick="set('cyl_hemi')" id="b-cyl_hemi">Cylinder+Hemi</button>
  </div></div>
  <div class="cat-wrap"><span class="cat-label">Nets</span><div class="cat-group">
    <button onclick="set('net_cube')" id="b-net_cube">Cube Net</button>
    <button onclick="set('net_cyl')" id="b-net_cyl">Cylinder Net</button>
    <button onclick="set('net_cone')" id="b-net_cone">Cone Net</button>
    <button onclick="set('net_pyr')" id="b-net_pyr">Pyramid Net</button>
  </div></div>
  <div class="cat-wrap"><span class="cat-label">Tools</span><div class="cat-group">
    <button onclick="toggleWire()" id="b-wire">Wireframe</button>
    <button onclick="toggleDraw()" id="b-draw">Draw Lines</button>
    <button onclick="toggleDoodle()" id="b-doodle">Doodle</button>
    <button onclick="clearAll()" id="b-clear">Clear All</button>
  </div></div>
</div>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H,shape='cube',wire=false,drawMode=false,doodleMode=false,paused=false;
let rotX=0.4,rotY=0.6,zoom=220,drag=false,lx,ly,didDrag=false;
let userLines=[],selectedDot=-1,hoverDot=-1;
let doodleStrokes=[],currentStroke=null,doodleColor='#10b981',doodleWidth=3;
const PI=Math.PI,cos=Math.cos,sin=Math.sin;
const isNet=()=>shape.startsWith('net_');

function resize(){W=c.width=innerWidth;H=c.height=innerHeight}
resize();addEventListener('resize',resize);

function proj(x,y,z){
  if(isNet()){
    const s=zoom;
    return{x:x*s+W/2,y:-y*s+H/2,z:0,s};
  }
  const cx=cos(rotX),sx=sin(rotX),cy=cos(rotY),sy=sin(rotY);
  const y1=y*cx-z*sx,z1=y*sx+z*cx,x1=x*cy+z1*sy,z2=-x*sy+z1*cy;
  const s=zoom/(z2+5);
  return{x:x1*s+W/2,y:y1*s+H/2,z:z2,s};
}

/* ── Lighting for faces ── */
function faceNormal(verts,face){
  if(face.length<3)return[0,0,1];
  const a=verts[face[0]],b=verts[face[1]],cc=verts[face[2]];
  const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[cc[0]-a[0],cc[1]-a[1],cc[2]-a[2]];
  const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
  const l=Math.sqrt(n[0]*n[0]+n[1]*n[1]+n[2]*n[2])||1;
  return[n[0]/l,n[1]/l,n[2]/l];
}
function faceBrightness(n){
  const light=[0.3,0.6,0.7];const ll=Math.sqrt(light[0]*light[0]+light[1]*light[1]+light[2]*light[2]);
  const d=Math.abs(n[0]*light[0]+n[1]*light[1]+n[2]*light[2])/ll;
  return 0.25+0.75*d;
}

/* ── Shape generators ── */
function mkCube(sx,sy,sz){
  sx=sx||1;sy=sy||1;sz=sz||1;
  const v=[[-sx,-sy,-sz],[-sx,-sy,sz],[-sx,sy,-sz],[-sx,sy,sz],[sx,-sy,-sz],[sx,-sy,sz],[sx,sy,-sz],[sx,sy,sz]];
  const e=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
  const f=[[0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]];
  return{v,e,f};
}
function mkSphere(r,n,m){r=r||1;n=n||24;m=m||16;const v=[];for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const t=PI*i/m,p=2*PI*j/n;v.push([r*sin(t)*cos(p),r*cos(t),r*sin(t)*sin(p)]);}const e=[];const w=n+1;for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const idx=i*w+j;if(j<n)e.push([idx,idx+1]);if(i<m)e.push([idx,idx+w]);}return{v,e,f:[]};}
function mkCone(r,h,n){r=r||1;h=h||2;n=n||24;const v=[[0,h/2,0]];for(let i=0;i<n;i++){const a=2*PI*i/n;v.push([r*cos(a),-h/2,r*sin(a)]);}const e=[];for(let i=1;i<=n;i++){e.push([0,i]);e.push([i,i%n+1]);}const f=[];for(let i=1;i<=n;i++)f.push([0,i,i%n+1]);const base=[];for(let i=n;i>=1;i--)base.push(i);f.push(base);return{v,e,f};}
function mkCylinder(r,h,n){r=r||0.8;h=h||2;n=n||24;const v=[];for(let i=0;i<n;i++){const a=2*PI*i/n;v.push([r*cos(a),h/2,r*sin(a)]);v.push([r*cos(a),-h/2,r*sin(a)]);}const e=[];for(let i=0;i<n;i++){const t=i*2,tn=((i+1)%n)*2;e.push([t,t+1]);e.push([t,tn]);e.push([t+1,tn+1]);}const f=[];for(let i=0;i<n;i++){const t=i*2,tn=((i+1)%n)*2;f.push([t,tn,tn+1,t+1]);}return{v,e,f};}
function mkPyramid(){return{v:[[0,1.2,0],[-1,-0.8,-1],[1,-0.8,-1],[1,-0.8,1],[-1,-0.8,1]],e:[[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[4,1]],f:[[0,1,2],[0,2,3],[0,3,4],[0,4,1],[1,2,3,4]]};}
function mkTorus(R,r,n,m){R=R||1;r=r||0.35;n=n||28;m=m||14;const v=[];for(let i=0;i<n;i++)for(let j=0;j<m;j++){const t=2*PI*i/n,p=2*PI*j/m;v.push([(R+r*cos(p))*cos(t),(R+r*cos(p))*sin(t),r*sin(p)]);}const e=[];for(let i=0;i<n;i++)for(let j=0;j<m;j++){const idx=i*m+j;e.push([idx,i*m+(j+1)%m]);e.push([idx,((i+1)%n)*m+j]);}return{v,e,f:[]};}
function mkHemisphere(r,n,m){r=r||1;n=n||20;m=m||10;const v=[];for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const t=PI*0.5*i/m,p=2*PI*j/n;v.push([r*sin(t)*cos(p),r*cos(t),r*sin(t)*sin(p)]);}const e=[];const w=n+1;for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const idx=i*w+j;if(j<n)e.push([idx,idx+1]);if(i<m)e.push([idx,idx+w]);}for(let j=0;j<n;j++){const bi=m*w+j;e.push([bi,m*w+j+1]);}return{v,e,f:[]};}

/* Compound shapes */
function mkPyrCube(){const cb=mkCube(1,0.8,1);const py=[[0,1.8,0],[-1,0.8,-1],[1,0.8,-1],[1,0.8,1],[-1,0.8,1]];const off=cb.v.length;const v=[...cb.v,...py];const e=[...cb.e,[off,off+1],[off,off+2],[off,off+3],[off,off+4],[off+1,off+2],[off+2,off+3],[off+3,off+4],[off+4,off+1]];const f=[...cb.f,[off,off+1,off+2],[off,off+2,off+3],[off,off+3,off+4],[off,off+4,off+1]];return{v,e,f};}
function mkConeCyl(){const cy=mkCylinder(0.8,1.4,24);const off=cy.v.length;const cv=[[0,1.4,0]];for(let i=0;i<24;i++){const a=2*PI*i/24;cv.push([0.8*cos(a),0.7,0.8*sin(a)]);}const v=[...cy.v,...cv];const e=[...cy.e];const f=[...cy.f];for(let i=1;i<=24;i++){e.push([off,off+i]);e.push([off+i,off+(i%24)+1]);f.push([off,off+i,off+(i%24)+1]);}return{v,e,f};}
function mkCylHemi(){const cy=mkCylinder(0.8,1.4,24);const off=cy.v.length;const hv=[];const n=20,m=8;for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const t=PI*0.5*i/m,p=2*PI*j/n;hv.push([0.8*sin(t)*cos(p),0.7+0.8*cos(t),0.8*sin(t)*sin(p)]);}const v=[...cy.v,...hv];const e=[...cy.e];const f=[...cy.f];const w=n+1;for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const idx=off+i*w+j;if(j<n)e.push([idx,idx+1]);if(i<m)e.push([idx,idx+w]);}return{v,e,f};}

/* Nets (2D flat — filled faces with colour) */
function mkNetCube(){const s=1;const v=[],e=[],f=[];
const faces=[[0,0],[1,0],[2,0],[3,0],[1,-1],[1,1]];
faces.forEach(([fx,fy])=>{const bx=fx*2*s,by=fy*2*s,bi=v.length;
v.push([bx-s,by-s,0],[bx+s,by-s,0],[bx+s,by+s,0],[bx-s,by+s,0]);
e.push([bi,bi+1],[bi+1,bi+2],[bi+2,bi+3],[bi+3,bi]);
f.push([bi,bi+1,bi+2,bi+3]);});return{v,e,f};}

function mkNetCyl(){const v=[],e=[],f=[];
const w=3,h=2;v.push([-w,-h,0],[w,-h,0],[w,h,0],[-w,h,0]);
e.push([0,1],[1,2],[2,3],[3,0]);f.push([0,1,2,3]);
const n=32;for(let ci=0;ci<2;ci++){const cy=ci===0?-h-1.3:h+1.3,off=v.length;
for(let i=0;i<=n;i++){const a=2*PI*i/n;v.push([0.9*cos(a),cy+0.9*sin(a),0]);}
for(let i=0;i<n;i++)e.push([off+i,off+i+1]);
const cf=[];for(let i=0;i<=n;i++)cf.push(off+i);f.push(cf);}return{v,e,f};}

function mkNetCone(){const v=[],e=[],f=[];
const n=40,R=2.5;v.push([0,0.5,0]);
for(let i=0;i<=n;i++){const a=-PI*0.6+PI*1.2*i/n;v.push([R*cos(a),0.5+R*sin(a),0]);}
for(let i=0;i<n;i++){e.push([0,1+i]);e.push([1+i,2+i]);}
const sf=[];for(let i=0;i<=n;i++)sf.push(i);f.push(sf);
const boff=v.length,cy=-1.5;
for(let i=0;i<=32;i++){const a=2*PI*i/32;v.push([0.8*cos(a),cy+0.8*sin(a),0]);}
for(let i=0;i<32;i++)e.push([boff+i,boff+i+1]);
const bf=[];for(let i=0;i<=32;i++)bf.push(boff+i);f.push(bf);return{v,e,f};}

function mkNetPyr(){const v=[],e=[],f=[];
const s=1.1;v.push([-s,-s,0],[s,-s,0],[s,s,0],[-s,s,0]);
e.push([0,1],[1,2],[2,3],[3,0]);f.push([0,1,2,3]);
const tris=[[0,1,0,-2.2],[1,2,2.2,0],[2,3,0,2.2],[3,0,-2.2,0]];
tris.forEach(([a,b,dx,dy])=>{const mx=(v[a][0]+v[b][0])/2+dx*0.75,my=(v[a][1]+v[b][1])/2+dy*0.75;
const ti=v.length;v.push([mx,my,0]);e.push([a,ti],[b,ti]);f.push([a,b,ti]);});return{v,e,f};}

const SHAPES={cube:()=>mkCube(),cuboid:()=>mkCube(1.5,0.8,0.6),sphere:()=>mkSphere(),cone:()=>mkCone(),cylinder:()=>mkCylinder(),pyramid:()=>mkPyramid(),torus:()=>mkTorus(),hemisphere:()=>mkHemisphere(),pyr_cube:mkPyrCube,cone_cyl:mkConeCyl,cyl_hemi:mkCylHemi,net_cube:mkNetCube,net_cyl:mkNetCyl,net_cone:mkNetCone,net_pyr:mkNetPyr};

const NAMES={cube:'Cube',cuboid:'Cuboid',sphere:'Sphere',cone:'Cone',cylinder:'Cylinder',pyramid:'Pyramid',torus:'Torus',hemisphere:'Hemisphere',pyr_cube:'Pyramid + Cube',cone_cyl:'Cone + Cylinder',cyl_hemi:'Cylinder + Hemisphere',net_cube:'Cube Net',net_cyl:'Cylinder Net',net_cone:'Cone Net',net_pyr:'Pyramid Net'};

const MEASURES={cube:'Side = 2 | V = 8 | SA = 24',cuboid:'3 x 1.6 x 1.2 | V = 5.76 | SA = 15.84',sphere:'r = 1 | V = 4.19 | SA = 12.57',cone:'r = 1, h = 2 | V = 2.09 | SA = 10.17',cylinder:'r = 0.8, h = 2 | V = 4.02 | SA = 14.07',pyramid:'Base 2x2, h = 2 | V = 2.67 | SA = 12.94',torus:'R = 1, r = 0.35 | V = 2.41 | SA = 13.79',hemisphere:'r = 1 | V = 2.09 | SA = 9.42',pyr_cube:'Compound shape',cone_cyl:'Compound shape',cyl_hemi:'Compound shape',net_cube:'2D Unfolded cube',net_cyl:'2D Unfolded cylinder',net_cone:'2D Unfolded cone',net_pyr:'2D Unfolded pyramid'};

/* face colours per shape type */
const FACE_COLS={
  _3d:{base:'59,130,246',edge:'100,160,255'},
  net_cube:{base:'99,102,241',edge:'139,142,255'},
  net_cyl:{base:'14,165,233',edge:'56,189,248'},
  net_cone:{base:'168,85,247',edge:'192,132,252'},
  net_pyr:{base:'245,158,11',edge:'251,191,36'}
};
function getCol(){return FACE_COLS[shape]||FACE_COLS._3d;}

let geo=SHAPES.cube();
function set(s){shape=s;geo=SHAPES[s]();userLines=[];selectedDot=-1;doodleStrokes=[];currentStroke=null;
if(isNet()){rotX=0;rotY=0;paused=true;}else if(paused&&!s.startsWith('net_')){paused=false;}
document.querySelectorAll('#controls button').forEach(b=>{b.classList.remove('active');b.classList.remove('tool-active');});
const el=document.getElementById('b-'+s);if(el)el.classList.add('active');
if(wire)document.getElementById('b-wire').classList.add('tool-active');
if(drawMode)document.getElementById('b-draw').classList.add('tool-active');
if(doodleMode)document.getElementById('b-doodle').classList.add('tool-active');
document.getElementById('shape-name').textContent=NAMES[s]||s;
document.getElementById('measurements').textContent=MEASURES[s]||'';
updateStatus();}

function updateStatus(){
  const parts=[];
  if(isNet())parts.push('2D Net view');
  else if(paused)parts.push('Paused — click to resume');
  else parts.push('Click to pause');
  if(!drawMode&&!doodleMode)parts.push('Drag to rotate','Scroll to zoom');
  if(drawMode)parts.push('Click dots to connect');
  if(doodleMode)parts.push('Draw freely with mouse/pen');
  document.getElementById('draw-status').textContent=parts.join(' \\u00b7 ');
  document.getElementById('pause-badge').style.opacity=paused&&!isNet()?'1':'0';
  c.classList.toggle('paused',paused&&!drawMode&&!doodleMode);
  c.classList.toggle('drawing',drawMode);
  c.classList.toggle('doodling',doodleMode);
}

function toggleWire(){wire=!wire;document.getElementById('b-wire').classList.toggle('tool-active',wire);}
function toggleDraw(){drawMode=!drawMode;if(drawMode)doodleMode=false;
document.getElementById('b-draw').classList.toggle('tool-active',drawMode);
document.getElementById('b-doodle').classList.remove('tool-active');
document.getElementById('draw-hint').textContent=drawMode?'Click any vertex dot to connect':'';
document.getElementById('draw-hint').style.opacity=drawMode?'1':'0';
selectedDot=-1;updateStatus();}
function toggleDoodle(){doodleMode=!doodleMode;if(doodleMode)drawMode=false;
document.getElementById('b-doodle').classList.toggle('tool-active',doodleMode);
document.getElementById('b-draw').classList.remove('tool-active');
document.getElementById('draw-hint').textContent=doodleMode?'Draw freely — hold mouse/pen and drag':'';
document.getElementById('draw-hint').style.opacity=doodleMode?'1':'0';
selectedDot=-1;updateStatus();}
function clearAll(){userLines=[];selectedDot=-1;doodleStrokes=[];currentStroke=null;}

let projVerts=[];
function findClosestDot(mx,my,threshold){
  let best=-1,bestD=threshold*threshold;
  for(let i=0;i<projVerts.length;i++){
    const dx=projVerts[i].x-mx,dy=projVerts[i].y-my,d2=dx*dx+dy*dy;
    if(d2<bestD){bestD=d2;best=i;}
  }
  return best;
}

function draw(){
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);

  /* Subtle grid for nets */
  if(isNet()){
    ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=1;
    const gs=zoom*0.5;
    for(let x=(W/2)%gs;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=(H/2)%gs;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  }

  const g=geo;
  projVerts=g.v.map(v=>proj(v[0],v[1],v[2]));
  const pv=projVerts;
  const col=getCol();

  /* Faces (filled, painter's algo with lighting) */
  if(!wire&&g.f&&g.f.length>0){
    const sorted=g.f.map((f,fi)=>{const cz=f.reduce((s,i)=>s+(pv[i]?pv[i].z:0),0)/f.length;return{f,z:cz,fi};}).sort((a,b)=>a.z-b.z);
    sorted.forEach(({f})=>{
      if(f.some(i=>!pv[i]))return;
      ctx.beginPath();ctx.moveTo(pv[f[0]].x,pv[f[0]].y);
      for(let i=1;i<f.length;i++)ctx.lineTo(pv[f[i]].x,pv[f[i]].y);
      ctx.closePath();
      if(isNet()){
        ctx.fillStyle='rgba('+col.base+',0.25)';ctx.fill();
        ctx.strokeStyle='rgba('+col.edge+',0.9)';ctx.lineWidth=2.5;ctx.stroke();
      }else{
        const n=faceNormal(g.v,f);const b=faceBrightness(n);
        ctx.fillStyle='rgba('+col.base+','+(.08+.18*b)+')';ctx.fill();
        ctx.strokeStyle='rgba('+col.edge+','+(0.3+0.5*b)+')';ctx.lineWidth=1.8;ctx.stroke();
      }
    });
  }

  /* Edges */
  if(isNet()){
    ctx.strokeStyle='rgba('+col.edge+',0.85)';ctx.lineWidth=2.5;
  }else{
    ctx.strokeStyle=wire?'rgba('+col.edge+',0.7)':'rgba('+col.edge+',0.45)';
    ctx.lineWidth=wire?2:1.5;
  }
  if(wire||!g.f||g.f.length===0){
    ctx.shadowColor='rgba('+col.base+',0.3)';ctx.shadowBlur=isNet()?8:4;
    g.e.forEach(([a,b])=>{if(pv[a]&&pv[b]){ctx.beginPath();ctx.moveTo(pv[a].x,pv[a].y);ctx.lineTo(pv[b].x,pv[b].y);ctx.stroke();}});
    ctx.shadowBlur=0;
  }

  /* User-drawn vertex lines */
  if(userLines.length>0){
    ctx.strokeStyle='rgba(16,185,129,0.9)';ctx.lineWidth=3;
    ctx.shadowColor='rgba(16,185,129,0.4)';ctx.shadowBlur=6;
    userLines.forEach(([a,b])=>{
      if(pv[a]&&pv[b]){ctx.beginPath();ctx.moveTo(pv[a].x,pv[a].y);ctx.lineTo(pv[b].x,pv[b].y);ctx.stroke();}
    });
    ctx.shadowBlur=0;
  }

  /* In-progress vertex line */
  if(drawMode&&selectedDot>=0&&pv[selectedDot]){
    ctx.setLineDash([6,4]);ctx.strokeStyle='rgba(16,185,129,0.6)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(pv[selectedDot].x,pv[selectedDot].y);ctx.lineTo(mousePos.x,mousePos.y);ctx.stroke();
    ctx.setLineDash([]);
  }

  /* Dots (larger, glowing) */
  const showDots=drawMode||(g.v.length<=80);
  if(showDots){
    for(let i=0;i<pv.length;i++){
      if(!pv[i])continue;
      const isSel=drawMode&&i===selectedDot;
      const isHov=drawMode&&i===hoverDot;
      const r=isSel?7:isHov?6:isNet()?4:3;
      const dcol=isSel?'16,185,129':isHov?'16,185,129':'147,197,253';
      const alpha=isSel?1:isHov?0.85:0.75;
      ctx.beginPath();ctx.arc(pv[i].x,pv[i].y,r,0,PI*2);
      ctx.fillStyle='rgba('+dcol+','+alpha+')';ctx.fill();
      if(isSel||isHov){
        ctx.strokeStyle='rgba('+dcol+',0.4)';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(pv[i].x,pv[i].y,r+4,0,PI*2);ctx.stroke();
      }
    }
  }

  /* Doodle strokes (screen-space) */
  if(doodleStrokes.length>0||currentStroke){
    const allStrokes=[...doodleStrokes];
    if(currentStroke)allStrokes.push(currentStroke);
    allStrokes.forEach(st=>{
      if(st.pts.length<2)return;
      ctx.strokeStyle=st.color;ctx.lineWidth=st.width;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.shadowColor=st.color;ctx.shadowBlur=4;
      ctx.beginPath();ctx.moveTo(st.pts[0][0],st.pts[0][1]);
      for(let i=1;i<st.pts.length;i++)ctx.lineTo(st.pts[i][0],st.pts[i][1]);
      ctx.stroke();
    });
    ctx.shadowBlur=0;
  }

  if(!paused&&!drag&&!drawMode&&!isNet()){rotY+=0.004;rotX+=0.0015;}
  requestAnimationFrame(draw);
}

const mousePos={x:-999,y:-999};

c.addEventListener('mousedown',e=>{
  if(e.target!==c)return;
  didDrag=false;
  /* Doodle mode */
  if(doodleMode){
    currentStroke={pts:[[e.clientX,e.clientY]],color:doodleColor,width:doodleWidth};
    return;
  }
  /* Draw-lines mode */
  if(drawMode){
    const dot=findClosestDot(e.clientX,e.clientY,25);
    if(dot>=0){
      if(selectedDot>=0&&selectedDot!==dot){
        userLines.push([selectedDot,dot]);selectedDot=-1;
        document.getElementById('draw-hint').style.opacity='0';
      }else{selectedDot=dot;document.getElementById('draw-hint').textContent='Now click another dot';}
    }else{selectedDot=-1;document.getElementById('draw-hint').textContent='Click any vertex dot to connect';}
    return;
  }
  drag=true;lx=e.clientX;ly=e.clientY;
});
addEventListener('mouseup',e=>{
  if(doodleMode&&currentStroke){
    if(currentStroke.pts.length>1)doodleStrokes.push(currentStroke);
    currentStroke=null;return;
  }
  if(!didDrag&&!drawMode&&!doodleMode&&e.target===c){
    if(!isNet()){paused=!paused;updateStatus();}
  }
  drag=false;
});
addEventListener('mousemove',e=>{
  mousePos.x=e.clientX;mousePos.y=e.clientY;
  if(doodleMode&&currentStroke){currentStroke.pts.push([e.clientX,e.clientY]);return;}
  if(drawMode){hoverDot=findClosestDot(e.clientX,e.clientY,25);return;}
  if(!drag)return;
  const dx=e.clientX-lx,dy=e.clientY-ly;
  if(Math.abs(dx)>2||Math.abs(dy)>2)didDrag=true;
  if(!isNet()){rotY+=dx*0.008;rotX+=dy*0.008;}
  lx=e.clientX;ly=e.clientY;
});
c.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(60,Math.min(800,zoom-e.deltaY*2));},{passive:false});

/* Touch */
let touchStartTime=0;
c.addEventListener('touchstart',e=>{
  touchStartTime=Date.now();didDrag=false;
  if(doodleMode&&e.touches.length===1){
    const t=e.touches[0];currentStroke={pts:[[t.clientX,t.clientY]],color:doodleColor,width:doodleWidth};return;
  }
  if(drawMode&&e.touches.length===1){
    const t=e.touches[0];const dot=findClosestDot(t.clientX,t.clientY,30);
    if(dot>=0){if(selectedDot>=0&&selectedDot!==dot){userLines.push([selectedDot,dot]);selectedDot=-1;}else{selectedDot=dot;}}
    return;
  }
  if(e.touches.length===1){drag=true;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}
},{passive:true});
addEventListener('touchend',()=>{
  if(doodleMode&&currentStroke){if(currentStroke.pts.length>1)doodleStrokes.push(currentStroke);currentStroke=null;return;}
  if(!didDrag&&!drawMode&&!doodleMode&&(Date.now()-touchStartTime)<300){
    if(!isNet()){paused=!paused;updateStatus();}
  }
  drag=false;
});
addEventListener('touchmove',e=>{
  if(doodleMode&&currentStroke&&e.touches.length===1){const t=e.touches[0];currentStroke.pts.push([t.clientX,t.clientY]);return;}
  if(!drag||e.touches.length!==1)return;
  const t=e.touches[0],dx=t.clientX-lx,dy=t.clientY-ly;
  if(Math.abs(dx)>2||Math.abs(dy)>2)didDrag=true;
  if(!isNet()){rotY+=dx*0.008;rotX+=dy*0.008;}
  lx=t.clientX;ly=t.clientY;
},{passive:true});

/* Pinch zoom (touch) */
let lastPinchDist=0;
c.addEventListener('touchstart',e=>{if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;lastPinchDist=Math.sqrt(dx*dx+dy*dy);}},{passive:true});
addEventListener('touchmove',e=>{if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;const d=Math.sqrt(dx*dx+dy*dy);zoom=Math.max(60,Math.min(800,zoom+(d-lastPinchDist)*1.5));lastPinchDist=d;}},{passive:true});

document.getElementById('measurements').textContent=MEASURES.cube;
updateStatus();
draw();
<\/script></body></html>`;

const VECTOR_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif}
canvas{display:block}
#panel{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:8px;flex-wrap:wrap;justify-content:center;z-index:10}
.vec-input{display:flex;align-items:center;gap:4px;padding:6px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:8px;backdrop-filter:blur(8px)}
.vec-input label{color:rgba(255,255,255,0.5);font-size:11px;min-width:14px}
.vec-input input{width:42px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;border-radius:4px;padding:3px 6px;font-size:12px;text-align:center}
button{padding:7px 16px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;border-radius:8px;cursor:pointer;font-size:12px;backdrop-filter:blur(8px);transition:all .2s}
button:hover{background:rgba(255,255,255,0.15)}
#result{position:fixed;top:16px;left:16px;color:rgba(255,255,255,0.7);font-size:13px;line-height:1.8;background:rgba(0,0,0,0.4);padding:12px 16px;border-radius:10px;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.08)}
.c-a{color:#818cf8}.c-b{color:#34d399}.c-r{color:#fbbf24}
</style></head><body>
<canvas id="c"></canvas>
<div id="result"></div>
<div id="panel">
  <div class="vec-input"><label class="c-a">A</label><input id="ax" type="number" value="2"><input id="ay" type="number" value="3"><input id="az" type="number" value="1"></div>
  <div class="vec-input"><label class="c-b">B</label><input id="bx" type="number" value="1"><input id="by" type="number" value="-1"><input id="bz" type="number" value="2"></div>
  <button onclick="op='add';calc()">A + B</button>
  <button onclick="op='sub';calc()">A - B</button>
  <button onclick="op='cross';calc()">A &times; B</button>
  <button onclick="op='dot';calc()">A &middot; B</button>
</div>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H,rotX=-0.4,rotY=0.6,zoom=120,dragging=false,lastMX,lastMY,op='add';
function resize(){W=c.width=innerWidth;H=c.height=innerHeight}
resize();addEventListener('resize',resize);

function val(id){return parseFloat(document.getElementById(id).value)||0;}
function vec(p,s){return{x:val(p+'x')*s,y:val(p+'y')*s,z:val(p+'z')*s};}

function project(x,y,z){
  const cx=Math.cos(rotX),sx=Math.sin(rotX),cy=Math.cos(rotY),sy=Math.sin(rotY);
  const y1=y*cx-z*sx,z1=y*sx+z*cx,x1=x*cy+z1*sy,z2=-x*sy+z1*cy;
  const s=zoom/(z2+300);
  return{x:x1*s+W/2,y:-y1*s+H/2};
}

function drawArrow(ox,oy,oz,dx,dy,dz,color,label){
  const p0=project(ox,oy,oz),p1=project(ox+dx,oy+dy,oz+dz);
  ctx.beginPath();ctx.moveTo(p0.x,p0.y);ctx.lineTo(p1.x,p1.y);
  ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.stroke();
  const ang=Math.atan2(p1.y-p0.y,p1.x-p0.x);const hl=10;
  ctx.beginPath();ctx.moveTo(p1.x,p1.y);
  ctx.lineTo(p1.x-hl*Math.cos(ang-0.4),p1.y-hl*Math.sin(ang-0.4));
  ctx.moveTo(p1.x,p1.y);
  ctx.lineTo(p1.x-hl*Math.cos(ang+0.4),p1.y-hl*Math.sin(ang+0.4));
  ctx.stroke();
  if(label){ctx.fillStyle=color;ctx.font='bold 13px system-ui';ctx.fillText(label,p1.x+8,p1.y-8);}
}

function drawGrid(){
  ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=0.5;
  for(let i=-5;i<=5;i++){
    const a=project(i,0,-5),b=project(i,0,5);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    const c2=project(-5,0,i),d=project(5,0,i);ctx.beginPath();ctx.moveTo(c2.x,c2.y);ctx.lineTo(d.x,d.y);ctx.stroke();
  }
  drawArrow(0,0,0,5,0,0,'rgba(255,255,255,0.25)','x');
  drawArrow(0,0,0,0,5,0,'rgba(255,255,255,0.25)','y');
  drawArrow(0,0,0,0,0,5,'rgba(255,255,255,0.25)','z');
}

function calc(){
  const a={x:val('ax'),y:val('ay'),z:val('az')},b={x:val('bx'),y:val('by'),z:val('bz')};
  let r,txt;
  if(op==='add'){r={x:a.x+b.x,y:a.y+b.y,z:a.z+b.z};txt='A+B = ('+r.x+', '+r.y+', '+r.z+')';}
  else if(op==='sub'){r={x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};txt='A-B = ('+r.x+', '+r.y+', '+r.z+')';}
  else if(op==='cross'){r={x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x};txt='A×B = ('+r.x+', '+r.y+', '+r.z+')';}
  else{const d=a.x*b.x+a.y*b.y+a.z*b.z;r=null;txt='A·B = '+d;}
  const mag_a=Math.sqrt(a.x*a.x+a.y*a.y+a.z*a.z).toFixed(2);
  const mag_b=Math.sqrt(b.x*b.x+b.y*b.y+b.z*b.z).toFixed(2);
  document.getElementById('result').innerHTML='<span class="c-a">|A| = '+mag_a+'</span><br><span class="c-b">|B| = '+mag_b+'</span><br><span class="c-r">'+txt+'</span>';
  return{a,b,r};
}

function draw(){
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  drawGrid();
  const{a,b,r}=calc();
  drawArrow(0,0,0,a.x,a.y,a.z,'#818cf8','A');
  drawArrow(0,0,0,b.x,b.y,b.z,'#34d399','B');
  if(r)drawArrow(0,0,0,r.x,r.y,r.z,'#fbbf24','R');
  if(!dragging){rotY+=0.002;}
  requestAnimationFrame(draw);
}

c.addEventListener('mousedown',e=>{dragging=true;lastMX=e.clientX;lastMY=e.clientY});
addEventListener('mouseup',()=>dragging=false);
addEventListener('mousemove',e=>{if(!dragging)return;rotY+=(e.clientX-lastMX)*0.006;rotX+=(e.clientY-lastMY)*0.006;lastMX=e.clientX;lastMY=e.clientY;});
c.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(40,Math.min(400,zoom-e.deltaY*0.3))},{passive:false});
c.addEventListener('touchstart',e=>{if(e.touches.length===1){dragging=true;lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;}},{passive:true});
addEventListener('touchend',()=>dragging=false);
addEventListener('touchmove',e=>{if(!dragging||e.touches.length!==1)return;const t=e.touches[0];rotY+=(t.clientX-lastMX)*0.006;rotX+=(t.clientY-lastMY)*0.006;lastMX=t.clientX;lastMY=t.clientY;},{passive:true});

draw();
<\/script></body></html>`;

const CALCULUS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;user-select:none;color:#fff}
canvas{display:block;cursor:grab}
canvas.doodling{cursor:crosshair}
canvas:active{cursor:grabbing}
#top-bar{position:fixed;top:0;left:0;right:0;padding:8px 14px;z-index:20;background:linear-gradient(180deg,rgba(10,10,26,0.93),transparent);display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none}
#top-bar>*{pointer-events:auto}
#fn-label{font-size:15px;font-weight:700;letter-spacing:.3px}
#fn-eq{font-size:11px;color:rgba(255,255,255,0.45);margin-top:2px;font-family:'Courier New',monospace}
#coord-badge{position:fixed;padding:6px 14px;border-radius:8px;background:rgba(0,0,0,0.8);border:1px solid rgba(255,255,255,0.15);font-size:12px;font-family:'Courier New',monospace;pointer-events:none;z-index:30;display:none;backdrop-filter:blur(6px);white-space:nowrap}
#right-panel{position:fixed;top:50px;right:10px;z-index:20;display:flex;flex-direction:column;gap:6px;max-height:calc(100vh - 140px);overflow-y:auto;scrollbar-width:none}
#right-panel::-webkit-scrollbar{display:none}
.panel{background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 12px;font-size:10px;line-height:1.7;backdrop-filter:blur(8px);min-width:175px;max-width:200px}
.panel .lbl{color:rgba(255,255,255,0.4);font-size:8px;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:2px}
.panel .val{color:#a78bfa;font-weight:700;font-family:'Courier New',monospace;font-size:11px}
.panel input[type=range]{width:100%;height:4px;-webkit-appearance:none;background:rgba(255,255,255,0.1);border-radius:2px;outline:none;margin:2px 0}
.panel input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#6366f1;cursor:pointer;border:2px solid rgba(255,255,255,0.3)}
.panel input[type=number]{width:46px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:4px;padding:2px 4px;font-size:10px}
.panel select{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:4px;padding:2px 4px;font-size:10px}
#hint{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.08);font-size:14px;pointer-events:none;z-index:5}
#controls{position:fixed;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:4px;z-index:20;flex-wrap:wrap;justify-content:center;max-width:98vw;padding:0 6px}
.cg{display:flex;gap:2px;padding:3px 4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;flex-wrap:wrap;justify-content:center}
.cw{position:relative;padding-top:10px}
.cl{position:absolute;top:-13px;left:6px;font-size:7px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:1px;font-weight:700}
button{padding:4px 8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.65);border-radius:6px;cursor:pointer;font-size:9px;font-weight:600;transition:all .2s;white-space:nowrap}
button:hover{background:rgba(255,255,255,0.12);color:#fff}
button.on{background:rgba(59,130,246,0.3);border-color:rgba(59,130,246,0.5);color:#93c5fd;box-shadow:0 0 8px rgba(59,130,246,0.15)}
button.tool{background:rgba(16,185,129,0.25);border-color:rgba(16,185,129,0.4);color:#6ee7b7;box-shadow:0 0 8px rgba(16,185,129,0.15)}
button.rst{background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.4);color:#fca5a5}
.tang-dot{position:fixed;width:12px;height:12px;border-radius:50%;background:#ef4444;border:2px solid rgba(255,255,255,0.5);transform:translate(-50%,-50%);pointer-events:none;z-index:25;display:none;box-shadow:0 0 8px rgba(239,68,68,0.5)}
#vol3d{position:fixed;top:50px;left:10px;z-index:20;display:none}
#vol3d canvas{border-radius:12px;border:1px solid rgba(167,139,250,0.3);background:rgba(5,5,20,0.92);box-shadow:0 0 20px rgba(167,139,250,0.15)}
</style></head><body>
<canvas id="c"></canvas>
<div id="top-bar">
  <div><div id="fn-label">Quadratic</div><div id="fn-eq">y = x\\u00b2</div></div>
  <div style="font-size:9px;color:rgba(255,255,255,0.3);text-align:right;line-height:1.5">Drag to pan \\u00b7 Scroll to zoom<br>Click graph for tangent line</div>
</div>
<div id="coord-badge"></div>
<div class="tang-dot" id="tang-dot"></div>
<div id="vol3d"><canvas id="c3d" width="280" height="280"></canvas></div>
<div id="right-panel">
  <div class="panel" id="p-transform">
    <div class="lbl" style="color:#f472b6">\\u2b12 Reflection</div>
    <div style="display:flex;gap:4px;margin:4px 0 6px">
      <button onclick="togRefX()" id="b-refx" style="flex:1;font-size:9px">x-axis</button>
      <button onclick="togRefY()" id="b-refy" style="flex:1;font-size:9px">y-axis</button>
      <button onclick="togRefO()" id="b-refo" style="flex:1;font-size:9px">y=x</button>
    </div>
    <div class="lbl" style="color:#60a5fa">\\u2b13 Translation</div>
    <div style="display:grid;grid-template-columns:50px 1fr 30px;align-items:center;gap:2px;margin:4px 0 6px">
      <span style="font-size:9px">\\u2194 Horiz</span><input type="range" id="sl-tx" min="-10" max="10" step="0.1" value="0"><span id="v-tx" style="font-size:9px">0</span>
      <span style="font-size:9px">\\u2195 Vert</span><input type="range" id="sl-ty" min="-10" max="10" step="0.1" value="0"><span id="v-ty" style="font-size:9px">0</span>
    </div>
    <div class="lbl" style="color:#a78bfa">\\u2922 Stretch</div>
    <div style="display:grid;grid-template-columns:50px 1fr 30px;align-items:center;gap:2px;margin:4px 0 2px">
      <span style="font-size:9px">\\u2194 x-str</span><input type="range" id="sl-sx" min="0.1" max="5" step="0.1" value="1"><span id="v-sx" style="font-size:9px">1</span>
      <span style="font-size:9px">\\u2195 y-str</span><input type="range" id="sl-sy" min="0.1" max="5" step="0.1" value="1"><span id="v-sy" style="font-size:9px">1</span>
    </div>
    <div id="trans-summary" style="margin-top:4px;font-size:9px;color:rgba(255,255,255,0.35);font-family:'Courier New',monospace;line-height:1.4"></div>
  </div>
  <div class="panel" id="p-unit" style="display:none">
    <div class="lbl">Angle Unit</div>
    <div style="display:flex;gap:4px;margin-top:4px">
      <button onclick="setUnit('rad')" id="b-rad" class="on" style="flex:1">Radians</button>
      <button onclick="setUnit('deg')" id="b-deg" style="flex:1">Degrees</button>
    </div>
    <div id="domain-info" style="color:rgba(255,255,255,0.35);margin-top:4px;font-size:9px"></div>
  </div>
  <div class="panel" id="p-vol" style="display:none">
    <div class="lbl">Volume of Revolution</div>
    <div style="font-size:9px">V = \\u03c0 \\u222b y\\u00b2 dx</div>
    <div class="val" id="vol-val" style="margin:4px 0">V = 0</div>
    <div class="lbl" style="margin-top:4px">Bounds</div>
    <div style="display:flex;gap:6px;margin-top:2px">
      <label>a: <input id="inp-a" type="number" value="-2" step="0.5"></label>
      <label>b: <input id="inp-b" type="number" value="2" step="0.5"></label>
    </div>
  </div>
  <div class="panel" id="p-tang" style="display:none">
    <div class="lbl">Tangent Line</div>
    <div id="tang-info" style="font-family:'Courier New',monospace;font-size:10px;color:rgba(255,255,255,0.6)">Click on graph</div>
  </div>
</div>
<div id="hint"></div>
<div id="controls">
  <div class="cw"><span class="cl">O-Level</span><div class="cg">
    <button onclick="pick('linear')" id="b-linear">y=mx+c</button>
    <button onclick="pick('quadratic')" id="b-quadratic" class="on">x\\u00b2</button>
    <button onclick="pick('cubic')" id="b-cubic">x\\u00b3</button>
    <button onclick="pick('reciprocal')" id="b-reciprocal">1/x</button>
    <button onclick="pick('sqrt')" id="b-sqrt">\\u221ax</button>
    <button onclick="pick('abs')" id="b-abs">|x|</button>
  </div></div>
  <div class="cw"><span class="cl">Trig</span><div class="cg">
    <button onclick="pick('sin')" id="b-sin">sin</button>
    <button onclick="pick('cos')" id="b-cos">cos</button>
    <button onclick="pick('tan')" id="b-tan">tan</button>
    <button onclick="pick('csc')" id="b-csc">csc</button>
    <button onclick="pick('sec')" id="b-sec">sec</button>
    <button onclick="pick('cot')" id="b-cot">cot</button>
    <button onclick="pick('asin')" id="b-asin">sin\\u207b\\u00b9</button>
    <button onclick="pick('acos')" id="b-acos">cos\\u207b\\u00b9</button>
    <button onclick="pick('atan')" id="b-atan">tan\\u207b\\u00b9</button>
  </div></div>
  <div class="cw"><span class="cl">A-Level</span><div class="cg">
    <button onclick="pick('exp')" id="b-exp">e\\u02e3</button>
    <button onclick="pick('ln')" id="b-ln">ln</button>
    <button onclick="pick('x4')" id="b-x4">x\\u2074</button>
    <button onclick="pick('sinc')" id="b-sinc">sin/x</button>
    <button onclick="pick('gauss')" id="b-gauss">e\\u207b\\u02e3\\u00b2</button>
  </div></div>
  <div class="cw"><span class="cl">Curves</span><div class="cg">
    <button onclick="pick('circle')" id="b-circle">Circle</button>
    <button onclick="pick('parabola')" id="b-parabola">x=y\\u00b2</button>
    <button onclick="pick('hyperbola')" id="b-hyperbola">Hyperbola</button>
    <button onclick="pick('ellipse')" id="b-ellipse">Ellipse</button>
  </div></div>
  <div class="cw"><span class="cl">Tools</span><div class="cg">
    <button onclick="togDeriv()" id="b-deriv">f'(x)</button>
    <button onclick="togInteg()" id="b-integ">\\u222b</button>
    <button onclick="togVol()" id="b-vol">Volume</button>
    <button onclick="togTangent()" id="b-tang">Tangent</button>
    <button onclick="togDoodle()" id="b-doodle">Doodle</button>
    <button onclick="togPoints()" id="b-pts">Points</button>
    <button onclick="resetView()" class="rst">Reset</button>
    <button onclick="clearAll()">Clear</button>
  </div></div>
</div>
<script>
const cv=document.getElementById('c'),cx=cv.getContext('2d');
const c3d=document.getElementById('c3d'),cx3=c3d.getContext('2d');
let W,H,oX,oY,sc=60,dragging=false,lx,ly,didDrag=false;
let curFn='quadratic',showDeriv=false,showInteg=false,showVol=false,showTangent=false;
let doodleMode=false,pointMode=false;
let doodleStrokes=[],curStroke=null;
let userPts=[],selectedPt=-1;
let tangentX=null;
let unit='rad';
/* Transform state */
let refX=false,refY=false,refO=false;
let trX=0,trY=0,stX=1,stY=1;
const PI=Math.PI;
const DEG=PI/180;

function resize(){W=cv.width=innerWidth;H=cv.height=innerHeight;if(oX===undefined){oX=W/2;oY=H/2;}}
resize();addEventListener('resize',()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;});

/* ── Angle conversion ── */
function toRad(x){return unit==='deg'?x*DEG:x;}
function fromRad(x){return unit==='deg'?x/DEG:x;}

/* ── Graph definitions ── */
const TRIG_SET=new Set(['sin','cos','tan','csc','sec','cot','asin','acos','atan']);
const G={
  linear:{fn:x=>x,deriv:x=>1,label:'Linear',eq:'y = x',color:'#3b82f6'},
  quadratic:{fn:x=>x*x,deriv:x=>2*x,label:'Quadratic',eq:'y = x\\u00b2',color:'#10b981'},
  cubic:{fn:x=>x*x*x,deriv:x=>3*x*x,label:'Cubic',eq:'y = x\\u00b3',color:'#8b5cf6'},
  reciprocal:{fn:x=>Math.abs(x)<0.02?NaN:1/x,deriv:x=>-1/(x*x),label:'Reciprocal',eq:'y = 1/x',color:'#f59e0b'},
  sqrt:{fn:x=>x>=0?Math.sqrt(x):NaN,deriv:x=>x>0.001?0.5/Math.sqrt(x):NaN,label:'Square Root',eq:'y = \\u221ax',color:'#ec4899'},
  abs:{fn:x=>Math.abs(x),deriv:x=>x>0?1:x<0?-1:0,label:'Modulus',eq:'y = |x|',color:'#06b6d4'},
  sin:{fn:x=>Math.sin(toRad(x)),deriv:x=>(unit==='deg'?DEG:1)*Math.cos(toRad(x)),label:'Sine',eq:'y = sin(x)',color:'#10b981',trig:true,domain:'All reals',range:'[-1, 1]'},
  cos:{fn:x=>Math.cos(toRad(x)),deriv:x=>-(unit==='deg'?DEG:1)*Math.sin(toRad(x)),label:'Cosine',eq:'y = cos(x)',color:'#6366f1',trig:true,domain:'All reals',range:'[-1, 1]'},
  tan:{fn:x=>{const v=Math.tan(toRad(x));return Math.abs(v)>80?NaN:v;},deriv:x=>{const c=Math.cos(toRad(x));return Math.abs(c)<0.01?NaN:(unit==='deg'?DEG:1)/(c*c);},label:'Tangent',eq:'y = tan(x)',color:'#f97316',trig:true,domain:unit==='deg'?'x \\u2260 90n':'x \\u2260 \\u03c0/2 + n\\u03c0',range:'(-\\u221e, \\u221e)'},
  csc:{fn:x=>{const s=Math.sin(toRad(x));return Math.abs(s)<0.02?NaN:1/s;},deriv:x=>{const s=Math.sin(toRad(x)),c=Math.cos(toRad(x));return Math.abs(s)<0.02?NaN:-(unit==='deg'?DEG:1)*c/(s*s);},label:'Cosecant',eq:'y = csc(x)',color:'#f472b6',trig:true,domain:unit==='deg'?'x \\u2260 180n':'x \\u2260 n\\u03c0',range:'(-\\u221e,-1] \\u222a [1,\\u221e)'},
  sec:{fn:x=>{const c=Math.cos(toRad(x));return Math.abs(c)<0.02?NaN:1/c;},deriv:x=>{const s=Math.sin(toRad(x)),c=Math.cos(toRad(x));return Math.abs(c)<0.02?NaN:(unit==='deg'?DEG:1)*s/(c*c);},label:'Secant',eq:'y = sec(x)',color:'#a78bfa',trig:true,domain:unit==='deg'?'x \\u2260 90+180n':'x \\u2260 \\u03c0/2 + n\\u03c0',range:'(-\\u221e,-1] \\u222a [1,\\u221e)'},
  cot:{fn:x=>{const s=Math.sin(toRad(x));return Math.abs(s)<0.02?NaN:Math.cos(toRad(x))/s;},deriv:x=>{const s=Math.sin(toRad(x));return Math.abs(s)<0.02?NaN:-(unit==='deg'?DEG:1)/(s*s);},label:'Cotangent',eq:'y = cot(x)',color:'#22d3ee',trig:true,domain:unit==='deg'?'x \\u2260 180n':'x \\u2260 n\\u03c0',range:'(-\\u221e, \\u221e)'},
  asin:{fn:x=>Math.abs(x)>1?NaN:fromRad(Math.asin(x)),deriv:x=>Math.abs(x)>=1?NaN:fromRad(1/Math.sqrt(1-x*x)),label:'Arcsin',eq:'y = sin\\u207b\\u00b9(x)',color:'#34d399',trig:true,domain:'[-1, 1]',range:unit==='deg'?'[-90\\u00b0, 90\\u00b0]':'[-\\u03c0/2, \\u03c0/2]'},
  acos:{fn:x=>Math.abs(x)>1?NaN:fromRad(Math.acos(x)),deriv:x=>Math.abs(x)>=1?NaN:fromRad(-1/Math.sqrt(1-x*x)),label:'Arccos',eq:'y = cos\\u207b\\u00b9(x)',color:'#fb923c',trig:true,domain:'[-1, 1]',range:unit==='deg'?'[0\\u00b0, 180\\u00b0]':'[0, \\u03c0]'},
  atan:{fn:x=>fromRad(Math.atan(x)),deriv:x=>fromRad(1/(1+x*x)),label:'Arctan',eq:'y = tan\\u207b\\u00b9(x)',color:'#c084fc',trig:true,domain:'All reals',range:unit==='deg'?'(-90\\u00b0, 90\\u00b0)':'(-\\u03c0/2, \\u03c0/2)'},
  exp:{fn:x=>{const v=Math.exp(x);return v>1e6?NaN:v;},deriv:x=>{const v=Math.exp(x);return v>1e6?NaN:v;},label:'Exponential',eq:'y = e\\u02e3',color:'#ef4444'},
  ln:{fn:x=>x>0?Math.log(x):NaN,deriv:x=>x>0?1/x:NaN,label:'Natural Log',eq:'y = ln(x)',color:'#14b8a6'},
  x4:{fn:x=>x*x*x*x,deriv:x=>4*x*x*x,label:'Quartic',eq:'y = x\\u2074',color:'#a855f7'},
  sinc:{fn:x=>Math.abs(x)<0.001?1:Math.sin(x)/x,deriv:x=>Math.abs(x)<0.001?0:(Math.cos(x)*x-Math.sin(x))/(x*x),label:'Sinc',eq:'y = sin(x)/x',color:'#22d3ee'},
  gauss:{fn:x=>Math.exp(-x*x),deriv:x=>-2*x*Math.exp(-x*x),label:'Gaussian',eq:'y = e^(-x\\u00b2)',color:'#f472b6'},
  circle:{param:true,label:'Unit Circle',eq:'x\\u00b2 + y\\u00b2 = 4',color:'#fbbf24'},
  parabola:{param:true,label:'Sideways Parabola',eq:'x = y\\u00b2',color:'#34d399'},
  hyperbola:{param:true,label:'Hyperbola',eq:'x\\u00b2/4 - y\\u00b2 = 1',color:'#fb923c'},
  ellipse:{param:true,label:'Ellipse',eq:'x\\u00b2/9 + y\\u00b2/4 = 1',color:'#c084fc'},
};

/* ── Transformed function wrapper ── */
function getTransFn(){
  const g=G[curFn];if(!g||g.param)return null;
  return x=>{
    let xi=x-trX;
    if(refY)xi=-xi;
    xi=xi/stX;
    let y=g.fn(xi);
    if(!isFinite(y))return NaN;
    y=y*stY;
    if(refX)y=-y;
    y=y+trY;
    return y;
  };
}
function getTransDeriv(){
  const g=G[curFn];if(!g||g.param)return null;
  return x=>{
    let xi=x-trX;
    if(refY)xi=-xi;
    xi=xi/stX;
    let dy=g.deriv(xi);
    if(!isFinite(dy))return NaN;
    dy=dy*(stY/stX);
    if(refX)dy=-dy;
    if(refY)dy=-dy;
    return dy;
  };
}
/* For y=x reflection we swap x and y — special parametric plot */
function getRefOFn(){
  const g=G[curFn];if(!g||g.param)return null;
  return g.fn;
}
function isTransformed(){return refX||refY||refO||trX!==0||trY!==0||stX!==1||stY!==1;}
function getTransEq(){
  const g=G[curFn];if(!g)return'';
  if(!isTransformed())return g.eq;
  const parts=[];
  if(refX)parts.push('Reflect x-axis');
  if(refY)parts.push('Reflect y-axis');
  if(refO)parts.push('Reflect y=x');
  if(stX!==1)parts.push('x-stretch \\u00d7'+stX.toFixed(1));
  if(stY!==1)parts.push('y-stretch \\u00d7'+stY.toFixed(1));
  if(trX!==0)parts.push('translate '+(trX>0?'+':'')+trX.toFixed(1)+' horiz');
  if(trY!==0)parts.push('translate '+(trY>0?'+':'')+trY.toFixed(1)+' vert');
  return g.eq+' ['+parts.join(', ')+']';
}
function updateTransSummary(){
  const lines=[];
  if(refX)lines.push('<span style="color:#f472b6">\\u2714 Reflected in x-axis (y \\u2192 -y)</span>');
  if(refY)lines.push('<span style="color:#f472b6">\\u2714 Reflected in y-axis (x \\u2192 -x)</span>');
  if(refO)lines.push('<span style="color:#f472b6">\\u2714 Reflected in y = x</span>');
  if(trX!==0)lines.push('<span style="color:#60a5fa">Translated '+(trX>0?'right':'left')+' '+Math.abs(trX).toFixed(1)+'</span>');
  if(trY!==0)lines.push('<span style="color:#60a5fa">Translated '+(trY>0?'up':'down')+' '+Math.abs(trY).toFixed(1)+'</span>');
  if(stX!==1)lines.push('<span style="color:#a78bfa">x-stretch \\u00d7'+stX.toFixed(1)+'</span>');
  if(stY!==1)lines.push('<span style="color:#a78bfa">y-stretch \\u00d7'+stY.toFixed(1)+'</span>');
  document.getElementById('trans-summary').innerHTML=lines.length?lines.join('<br>'):'<span style="opacity:0.3">No transforms</span>';
}

/* ── Reflection toggles ── */
function togRefX(){refX=!refX;document.getElementById('b-refx').classList.toggle('tool',refX);updateTransSummary();calcVol();}
function togRefY(){refY=!refY;document.getElementById('b-refy').classList.toggle('tool',refY);updateTransSummary();calcVol();}
function togRefO(){refO=!refO;document.getElementById('b-refo').classList.toggle('tool',refO);updateTransSummary();}

/* ── Slider setup ── */
function setupSliders(){
  const sliders={tx:{get:()=>trX,set:v=>{trX=v;}},ty:{get:()=>trY,set:v=>{trY=v;}},sx:{get:()=>stX,set:v=>{stX=v;}},sy:{get:()=>stY,set:v=>{stY=v;}}};
  Object.keys(sliders).forEach(k=>{
    const sl=document.getElementById('sl-'+k);
    const vl=document.getElementById('v-'+k);
    sl.addEventListener('input',()=>{
      const v=parseFloat(sl.value);
      sliders[k].set(v);
      vl.textContent=v.toFixed(1);
      updateTransSummary();calcVol();
    });
  });
}
setupSliders();

function resetSliders(){
  refX=false;refY=false;refO=false;trX=0;trY=0;stX=1;stY=1;
  document.getElementById('sl-tx').value=0;document.getElementById('v-tx').textContent='0.0';
  document.getElementById('sl-ty').value=0;document.getElementById('v-ty').textContent='0.0';
  document.getElementById('sl-sx').value=1;document.getElementById('v-sx').textContent='1.0';
  document.getElementById('sl-sy').value=1;document.getElementById('v-sy').textContent='1.0';
  document.getElementById('b-refx').classList.remove('tool');
  document.getElementById('b-refy').classList.remove('tool');
  document.getElementById('b-refo').classList.remove('tool');
  updateTransSummary();
}

/* ── Unit toggle ── */
function setUnit(u){unit=u;
  document.getElementById('b-rad').classList.toggle('on',u==='rad');
  document.getElementById('b-deg').classList.toggle('on',u==='deg');
  updateDomainInfo();
}
function updateDomainInfo(){
  const g=G[curFn];if(!g||!g.trig){document.getElementById('domain-info').textContent='';return;}
  document.getElementById('domain-info').innerHTML='Domain: '+(g.domain||'')+'<br>Range: '+(g.range||'');
}

function pick(k){curFn=k;tangentX=null;
  document.querySelectorAll('#controls button').forEach(b=>{if(!b.classList.contains('rst'))b.classList.remove('on');});
  const el=document.getElementById('b-'+k);if(el)el.classList.add('on');
  reapplyToolClasses();
  const g=G[k];
  document.getElementById('fn-label').textContent=g.label;
  document.getElementById('fn-eq').textContent=g.param?g.eq:getTransEq();
  document.getElementById('p-unit').style.display=g.trig?'block':'none';
  document.getElementById('p-transform').style.display=g.param?'none':'block';
  if(g.param){showDeriv=false;}
  updateDomainInfo();updateTransSummary();calcVol();
}

function reapplyToolClasses(){
  if(showDeriv)document.getElementById('b-deriv').classList.add('tool');
  if(showInteg)document.getElementById('b-integ').classList.add('tool');
  if(showVol)document.getElementById('b-vol').classList.add('tool');
  if(showTangent)document.getElementById('b-tang').classList.add('tool');
  if(doodleMode)document.getElementById('b-doodle').classList.add('tool');
  if(pointMode)document.getElementById('b-pts').classList.add('tool');
}

function togDeriv(){const g=G[curFn];if(!g||g.param)return;showDeriv=!showDeriv;document.getElementById('b-deriv').classList.toggle('tool',showDeriv);}
function togInteg(){showInteg=!showInteg;document.getElementById('b-integ').classList.toggle('tool',showInteg);}
function togVol(){showVol=!showVol;document.getElementById('b-vol').classList.toggle('tool',showVol);document.getElementById('p-vol').style.display=showVol?'block':'none';document.getElementById('vol3d').style.display=showVol?'block':'none';if(showVol)calcVol();}
function togTangent(){showTangent=!showTangent;document.getElementById('b-tang').classList.toggle('tool',showTangent);document.getElementById('p-tang').style.display=showTangent?'block':'none';if(!showTangent){tangentX=null;document.getElementById('tang-dot').style.display='none';}}
function togDoodle(){doodleMode=!doodleMode;if(doodleMode)pointMode=false;
  document.getElementById('b-doodle').classList.toggle('tool',doodleMode);
  document.getElementById('b-pts').classList.remove('tool');
  cv.classList.toggle('doodling',doodleMode);
  document.getElementById('hint').textContent=doodleMode?'Draw freely with mouse/pen':'';
}
function togPoints(){pointMode=!pointMode;if(pointMode)doodleMode=false;
  document.getElementById('b-pts').classList.toggle('tool',pointMode);
  document.getElementById('b-doodle').classList.remove('tool');
  cv.classList.remove('doodling');
  document.getElementById('hint').textContent=pointMode?'Click to place points':'';
}
function clearAll(){doodleStrokes=[];curStroke=null;userPts=[];selectedPt=-1;tangentX=null;document.getElementById('tang-dot').style.display='none';}

function resetView(){
  oX=W/2;oY=H/2;sc=60;
  resetSliders();tangentX=null;
  document.getElementById('tang-dot').style.display='none';
  const g=G[curFn];
  document.getElementById('fn-eq').textContent=g.param?g.eq:g.eq;
  calcVol();
}

/* ── Volume of revolution ── */
function calcVol(){
  if(!showVol)return;
  const fn=getTransFn();if(!fn)return;
  const a=parseFloat(document.getElementById('inp-a').value)||-2;
  const b=parseFloat(document.getElementById('inp-b').value)||2;
  const n=500;const dx=(b-a)/n;let sum=0;
  for(let i=0;i<n;i++){const x=a+(i+0.5)*dx;const y=fn(x);if(isFinite(y))sum+=y*y*dx;}
  const vol=PI*Math.abs(sum);
  document.getElementById('vol-val').textContent='V = '+vol.toFixed(4)+' units\\u00b3';
  draw3DVol(fn,a,b);
}
document.getElementById('inp-a').addEventListener('input',calcVol);
document.getElementById('inp-b').addEventListener('input',calcVol);

/* ── 3D volume mini-canvas ── */
let rot3d=0;
function draw3DVol(fn,a,b){
  const w=280,h=280;cx3.fillStyle='rgba(5,5,20,0.95)';cx3.fillRect(0,0,w,h);
  const cx0=w/2,cy0=h/2,s3=30,tilt=0.4;
  const cosT=Math.cos(tilt),sinT=Math.sin(tilt);
  rot3d+=0.015;const cosR=Math.cos(rot3d),sinR=Math.sin(rot3d);
  function p3(x,y,z){
    const x1=x*cosR-z*sinR,z1=x*sinR+z*cosR;
    const y1=y*cosT-z1*sinT,z2=z1*cosT+y*sinT;
    return{x:cx0+x1*s3,y:cy0-y1*s3,z:z2};
  }
  /* Draw axes */
  cx3.strokeStyle='rgba(255,255,255,0.2)';cx3.lineWidth=1;
  let p=p3(-4.5,0,0),q=p3(4.5,0,0);cx3.beginPath();cx3.moveTo(p.x,p.y);cx3.lineTo(q.x,q.y);cx3.stroke();
  p=p3(0,-3.5,0);q=p3(0,3.5,0);cx3.beginPath();cx3.moveTo(p.x,p.y);cx3.lineTo(q.x,q.y);cx3.stroke();
  p=p3(0,0,-3);q=p3(0,0,3);cx3.beginPath();cx3.moveTo(p.x,p.y);cx3.lineTo(q.x,q.y);cx3.stroke();
  /* Axis labels */
  cx3.fillStyle='rgba(255,255,255,0.3)';cx3.font='10px system-ui';
  let lp=p3(4.8,0,0);cx3.fillText('x',lp.x,lp.y);lp=p3(0,3.8,0);cx3.fillText('y',lp.x,lp.y);

  /* Build surface quads for painter's algorithm */
  const rings=40,segs=28;
  const quads=[];
  for(let i=0;i<rings;i++){
    const x0=a+(b-a)*i/rings,x1=a+(b-a)*(i+1)/rings;
    const r0=fn(x0),r1=fn(x1);
    if(!isFinite(r0)||!isFinite(r1))continue;
    const ar0=Math.abs(r0),ar1=Math.abs(r1);
    for(let j=0;j<segs;j++){
      const a0=2*PI*j/segs,a1=2*PI*(j+1)/segs;
      const p00=p3(x0,ar0*Math.cos(a0),ar0*Math.sin(a0));
      const p01=p3(x0,ar0*Math.cos(a1),ar0*Math.sin(a1));
      const p10=p3(x1,ar1*Math.cos(a0),ar1*Math.sin(a0));
      const p11=p3(x1,ar1*Math.cos(a1),ar1*Math.sin(a1));
      const avgZ=(p00.z+p01.z+p10.z+p11.z)/4;
      /* Normal for lighting */
      const nx=Math.cos((a0+a1)/2)*Math.cos(rot3d),ny=Math.cos((a0+a1)/2),nz=Math.sin((a0+a1)/2);
      const light=0.3+0.7*Math.abs(0.3*nx+0.6*ny+0.5*nz)/Math.sqrt(0.7);
      quads.push({pts:[p00,p01,p11,p10],z:avgZ,light:Math.min(1,light)});
    }
  }
  /* Sort back to front */
  quads.sort((a,b)=>a.z-b.z);
  /* Draw filled quads */
  quads.forEach(q=>{
    const br=Math.floor(q.light*255);
    const r=Math.floor(90+q.light*77),g=Math.floor(50+q.light*89),bl=Math.floor(140+q.light*110);
    cx3.beginPath();
    cx3.moveTo(q.pts[0].x,q.pts[0].y);
    cx3.lineTo(q.pts[1].x,q.pts[1].y);
    cx3.lineTo(q.pts[2].x,q.pts[2].y);
    cx3.lineTo(q.pts[3].x,q.pts[3].y);
    cx3.closePath();
    cx3.fillStyle='rgba('+r+','+g+','+bl+',0.55)';cx3.fill();
    cx3.strokeStyle='rgba('+Math.min(r+40,255)+','+Math.min(g+40,255)+','+Math.min(bl+30,255)+',0.3)';cx3.lineWidth=0.5;cx3.stroke();
  });

  /* Ring outlines for extra definition — every 4th ring */
  for(let i=0;i<=rings;i+=4){
    const x=a+(b-a)*i/rings;const r=fn(x);if(!isFinite(r))continue;
    const absR=Math.abs(r);
    cx3.beginPath();cx3.strokeStyle='rgba(200,180,255,0.5)';cx3.lineWidth=1.2;
    for(let j=0;j<=segs;j++){
      const ang=2*PI*j/segs;
      const pt=p3(x,absR*Math.cos(ang),absR*Math.sin(ang));
      j===0?cx3.moveTo(pt.x,pt.y):cx3.lineTo(pt.x,pt.y);
    }
    cx3.stroke();
  }

  /* Profile curve on top */
  cx3.beginPath();cx3.strokeStyle='#c4b5fd';cx3.lineWidth=2.5;cx3.shadowColor='#a78bfa';cx3.shadowBlur=6;
  let first=true;
  for(let i=0;i<=rings;i++){
    const x=a+(b-a)*i/rings;const r=fn(x);if(!isFinite(r)){first=true;continue;}
    const pt=p3(x,r,0);first?(cx3.moveTo(pt.x,pt.y),first=false):cx3.lineTo(pt.x,pt.y);
  }
  cx3.stroke();
  /* Mirror profile */
  cx3.beginPath();cx3.strokeStyle='rgba(196,181,253,0.4)';cx3.lineWidth=1.5;
  first=true;
  for(let i=0;i<=rings;i++){
    const x=a+(b-a)*i/rings;const r=fn(x);if(!isFinite(r)){first=true;continue;}
    const pt=p3(x,-Math.abs(r),0);first?(cx3.moveTo(pt.x,pt.y),first=false):cx3.lineTo(pt.x,pt.y);
  }
  cx3.stroke();cx3.shadowBlur=0;

  /* End caps — filled circles at a and b */
  [a,b].forEach(xv=>{
    const r=fn(xv);if(!isFinite(r))return;
    const absR=Math.abs(r);
    cx3.beginPath();cx3.fillStyle='rgba(167,139,250,0.2)';cx3.strokeStyle='rgba(200,180,255,0.6)';cx3.lineWidth=1.5;
    for(let j=0;j<=segs;j++){
      const ang=2*PI*j/segs;
      const pt=p3(xv,absR*Math.cos(ang),absR*Math.sin(ang));
      j===0?cx3.moveTo(pt.x,pt.y):cx3.lineTo(pt.x,pt.y);
    }
    cx3.closePath();cx3.fill();cx3.stroke();
  });

  if(showVol)requestAnimationFrame(()=>draw3DVol(fn,a,b));
}

/* ── Coordinate conversion ── */
function toScreen(x,y){return[oX+x*sc,oY-y*sc];}
function toMath(px,py){return[(px-oX)/sc,(oY-py)/sc];}

/* ── Drawing ── */
function getGridStep(){if(sc>100)return 0.5;if(sc>40)return 1;if(sc>15)return 2;if(sc>6)return 5;return 10;}

function drawGrid(){
  const step=getGridStep();
  cx.strokeStyle='rgba(255,255,255,0.04)';cx.lineWidth=1;
  const xMin=Math.floor((0-oX)/sc/step)*step,xMax=Math.ceil((W-oX)/sc/step)*step;
  const yMin=Math.floor((oY-H)/sc/step)*step,yMax=Math.ceil(oY/sc/step)*step;
  for(let x=xMin;x<=xMax;x+=step){const px=oX+x*sc;cx.beginPath();cx.moveTo(px,0);cx.lineTo(px,H);cx.stroke();}
  for(let y=yMin;y<=yMax;y+=step){const py=oY-y*sc;cx.beginPath();cx.moveTo(0,py);cx.lineTo(W,py);cx.stroke();}
}

function drawAxes(){
  cx.strokeStyle='rgba(255,255,255,0.25)';cx.lineWidth=2;
  cx.beginPath();cx.moveTo(0,oY);cx.lineTo(W,oY);cx.stroke();
  cx.beginPath();cx.moveTo(oX,0);cx.lineTo(oX,H);cx.stroke();
  /* Arrow heads */
  cx.fillStyle='rgba(255,255,255,0.25)';
  cx.beginPath();cx.moveTo(W-2,oY);cx.lineTo(W-10,oY-5);cx.lineTo(W-10,oY+5);cx.fill();
  cx.beginPath();cx.moveTo(oX,2);cx.lineTo(oX-5,10);cx.lineTo(oX+5,10);cx.fill();
  /* Tick labels */
  cx.fillStyle='rgba(255,255,255,0.3)';cx.font='10px system-ui';cx.textAlign='center';
  const step=getGridStep();
  const xMin=Math.floor((0-oX)/sc/step)*step,xMax=Math.ceil((W-oX)/sc/step)*step;
  for(let x=xMin;x<=xMax;x+=step){if(Math.abs(x)<0.001)continue;const px=oX+x*sc;
    cx.beginPath();cx.moveTo(px,oY-4);cx.lineTo(px,oY+4);cx.strokeStyle='rgba(255,255,255,0.2)';cx.lineWidth=1;cx.stroke();
    const lbl=TRIG_SET.has(curFn)&&unit==='rad'&&Math.abs(x-Math.round(x/PI*2)*PI/2)<0.01?piLabel(x):Number(x.toFixed(2));
    cx.fillText(lbl,px,oY+16);}
  cx.textAlign='right';
  const yMin=Math.floor((oY-H)/sc/step)*step,yMax=Math.ceil(oY/sc/step)*step;
  for(let y=yMin;y<=yMax;y+=step){if(Math.abs(y)<0.001)continue;const py=oY-y*sc;
    cx.beginPath();cx.moveTo(oX-4,py);cx.lineTo(oX+4,py);cx.strokeStyle='rgba(255,255,255,0.2)';cx.lineWidth=1;cx.stroke();
    cx.fillText(Number(y.toFixed(2)),oX-8,py+4);}
  cx.fillStyle='rgba(255,255,255,0.2)';cx.textAlign='center';
  cx.fillText('x',W-8,oY+16);cx.fillText('y',oX+12,14);
  cx.fillStyle='rgba(255,255,255,0.15)';cx.textAlign='left';cx.fillText('O',oX+4,oY+14);
}
function piLabel(x){const n=Math.round(x/PI*2);if(n===0)return'0';if(n===2)return'\\u03c0';if(n===-2)return'-\\u03c0';if(n===1)return'\\u03c0/2';if(n===-1)return'-\\u03c0/2';return(n/2)+'\\u03c0';}

function plotFunction(fn,color,width,glow){
  cx.beginPath();cx.strokeStyle=color;cx.lineWidth=width;
  if(glow){cx.shadowColor=color;cx.shadowBlur=10;}
  let prevOk=false;
  for(let px=0;px<=W;px+=1){
    const x=(px-oX)/sc;const y=fn(x);
    if(!isFinite(y)||Math.abs(y)>1e4){prevOk=false;continue;}
    const py=oY-y*sc;
    if(!prevOk){cx.moveTo(px,py);prevOk=true;}
    else cx.lineTo(px,py);
  }
  cx.stroke();cx.shadowBlur=0;
}

function plotParametric(type,color){
  cx.strokeStyle=color;cx.lineWidth=3;cx.shadowColor=color;cx.shadowBlur=10;
  if(type==='circle'){cx.beginPath();for(let t=0;t<=2*PI+.05;t+=.05){const[px,py]=toScreen(2*Math.cos(t),2*Math.sin(t));t===0?cx.moveTo(px,py):cx.lineTo(px,py);}cx.closePath();cx.stroke();}
  else if(type==='parabola'){cx.beginPath();let f=true;for(let t=-4;t<=4;t+=.05){const[px,py]=toScreen(t*t,t);f?(cx.moveTo(px,py),f=false):cx.lineTo(px,py);}cx.stroke();}
  else if(type==='hyperbola'){for(let br=0;br<2;br++){cx.beginPath();let f=true;for(let t=-3;t<=3;t+=.05){const[px,py]=toScreen((br?-1:1)*2*Math.cosh(t),Math.sinh(t));f?(cx.moveTo(px,py),f=false):cx.lineTo(px,py);}cx.stroke();}}
  else if(type==='ellipse'){cx.beginPath();for(let t=0;t<=2*PI+.05;t+=.05){const[px,py]=toScreen(3*Math.cos(t),2*Math.sin(t));t===0?cx.moveTo(px,py):cx.lineTo(px,py);}cx.closePath();cx.stroke();}
  cx.shadowBlur=0;
}

/* Domain restriction lines for trig */
function drawDomainLines(){
  const g=G[curFn];if(!g||!g.trig)return;
  if(curFn==='asin'||curFn==='acos'){
    cx.setLineDash([4,4]);cx.strokeStyle='rgba(255,255,255,0.1)';cx.lineWidth=1;
    [-1,1].forEach(xv=>{const px=oX+xv*sc;cx.beginPath();cx.moveTo(px,0);cx.lineTo(px,H);cx.stroke();});
    cx.setLineDash([]);
  }
  if(curFn==='tan'||curFn==='sec'){
    cx.setLineDash([3,5]);cx.strokeStyle='rgba(255,100,100,0.12)';cx.lineWidth=1;
    const step=unit==='deg'?180:PI;const half=unit==='deg'?90:PI/2;
    const xMin=(0-oX)/sc,xMax=(W-oX)/sc;
    for(let n=Math.floor((xMin-half)/step);n<=Math.ceil((xMax-half)/step);n++){
      const xv=half+n*step;const px=oX+xv*sc;
      if(px>0&&px<W){cx.beginPath();cx.moveTo(px,0);cx.lineTo(px,H);cx.stroke();}
    }
    cx.setLineDash([]);
  }
  if(curFn==='csc'||curFn==='cot'){
    cx.setLineDash([3,5]);cx.strokeStyle='rgba(255,100,100,0.12)';cx.lineWidth=1;
    const step=unit==='deg'?180:PI;
    const xMin=(0-oX)/sc,xMax=(W-oX)/sc;
    for(let n=Math.floor(xMin/step);n<=Math.ceil(xMax/step);n++){
      const xv=n*step;const px=oX+xv*sc;
      if(px>0&&px<W){cx.beginPath();cx.moveTo(px,0);cx.lineTo(px,H);cx.stroke();}
    }
    cx.setLineDash([]);
  }
}

function drawIntegral(){
  const fn=getTransFn();if(!fn)return;
  const a=parseFloat(document.getElementById('inp-a').value)||-2;
  const b=parseFloat(document.getElementById('inp-b').value)||2;
  const pxA=oX+a*sc,pxB=oX+b*sc;
  cx.beginPath();cx.moveTo(pxA,oY);
  for(let px=Math.min(pxA,pxB);px<=Math.max(pxA,pxB);px++){
    const x=(px-oX)/sc;const y=fn(x);if(!isFinite(y))continue;cx.lineTo(px,oY-y*sc);
  }
  cx.lineTo(pxB,oY);cx.closePath();
  cx.fillStyle='rgba(16,185,129,0.12)';cx.fill();
  cx.strokeStyle='rgba(16,185,129,0.3)';cx.lineWidth=1;cx.stroke();
  cx.setLineDash([4,4]);cx.strokeStyle='rgba(16,185,129,0.4)';cx.lineWidth=1.5;
  cx.beginPath();cx.moveTo(pxA,0);cx.lineTo(pxA,H);cx.stroke();
  cx.beginPath();cx.moveTo(pxB,0);cx.lineTo(pxB,H);cx.stroke();
  cx.setLineDash([]);
}

function drawVolRotation(){
  const fn=getTransFn();if(!fn)return;
  const a=parseFloat(document.getElementById('inp-a').value)||-2;
  const b=parseFloat(document.getElementById('inp-b').value)||2;
  const pxA=oX+a*sc,pxB=oX+b*sc;
  const lo=Math.min(pxA,pxB),hi=Math.max(pxA,pxB);

  /* Gradient filled region between curve and reflected curve */
  cx.save();
  cx.beginPath();
  let first=true;
  for(let px=lo;px<=hi;px++){
    const x=(px-oX)/sc;const y=fn(x);if(!isFinite(y))continue;
    const py=oY-Math.abs(y)*sc;
    first?(cx.moveTo(px,py),first=false):cx.lineTo(px,py);
  }
  for(let px=hi;px>=lo;px--){
    const x=(px-oX)/sc;const y=fn(x);if(!isFinite(y))continue;
    cx.lineTo(px,oY+Math.abs(y)*sc);
  }
  cx.closePath();
  const grd=cx.createLinearGradient(0,oY-120*sc/60,0,oY+120*sc/60);
  grd.addColorStop(0,'rgba(167,139,250,0.03)');
  grd.addColorStop(0.3,'rgba(139,92,246,0.15)');
  grd.addColorStop(0.5,'rgba(167,139,250,0.22)');
  grd.addColorStop(0.7,'rgba(139,92,246,0.15)');
  grd.addColorStop(1,'rgba(167,139,250,0.03)');
  cx.fillStyle=grd;cx.fill();
  cx.restore();

  /* Cross-section ellipses — thicker, more opaque, with gradient fill */
  const step=Math.max(4,Math.floor((hi-lo)/50));
  for(let px=lo;px<=hi;px+=step){
    const x=(px-oX)/sc;const y=fn(x);if(!isFinite(y))continue;
    const r=Math.abs(y)*sc;if(r<2)continue;
    /* Filled ellipse with radial gradient */
    const eg=cx.createRadialGradient(px,oY,0,px,oY,r);
    eg.addColorStop(0,'rgba(167,139,250,0.12)');
    eg.addColorStop(0.7,'rgba(139,92,246,0.06)');
    eg.addColorStop(1,'rgba(167,139,250,0.02)');
    cx.beginPath();cx.ellipse(px,oY,4,r,0,0,PI*2);
    cx.fillStyle=eg;cx.fill();
    cx.strokeStyle='rgba(167,139,250,0.45)';cx.lineWidth=1.5;cx.stroke();
  }

  /* Reflected curve — solid, visible */
  cx.beginPath();cx.strokeStyle='rgba(167,139,250,0.55)';cx.lineWidth=2.5;
  cx.shadowColor='rgba(139,92,246,0.3)';cx.shadowBlur=6;
  first=true;
  for(let px=lo;px<=hi;px++){
    const x=(px-oX)/sc;const y=fn(x);if(!isFinite(y)){first=true;continue;}
    const py=oY+Math.abs(y)*sc;
    first?(cx.moveTo(px,py),first=false):cx.lineTo(px,py);
  }
  cx.stroke();cx.shadowBlur=0;

  /* Bound lines */
  cx.setLineDash([5,5]);cx.strokeStyle='rgba(167,139,250,0.5)';cx.lineWidth=1.5;
  cx.beginPath();cx.moveTo(pxA,0);cx.lineTo(pxA,H);cx.stroke();
  cx.beginPath();cx.moveTo(pxB,0);cx.lineTo(pxB,H);cx.stroke();
  cx.setLineDash([]);
}

/* ── Tangent line drawing ── */
function drawTangent(){
  if(tangentX===null)return;
  const fn=getTransFn();const dfn=getTransDeriv();
  if(!fn||!dfn)return;
  const y=fn(tangentX);const m=dfn(tangentX);
  if(!isFinite(y)||!isFinite(m))return;
  const[sx,sy]=toScreen(tangentX,y);
  /* Draw tangent line across screen */
  const ext=W;
  const x1=tangentX-ext/sc,x2=tangentX+ext/sc;
  const y1=y+m*(x1-tangentX),y2=y+m*(x2-tangentX);
  const[px1,py1]=toScreen(x1,y1);const[px2,py2]=toScreen(x2,y2);
  cx.beginPath();cx.strokeStyle='rgba(239,68,68,0.7)';cx.lineWidth=2.5;
  cx.shadowColor='#ef4444';cx.shadowBlur=6;
  cx.moveTo(px1,py1);cx.lineTo(px2,py2);cx.stroke();cx.shadowBlur=0;
  /* Tangent point dot */
  cx.beginPath();cx.arc(sx,sy,7,0,PI*2);cx.fillStyle='#ef4444';cx.fill();
  cx.strokeStyle='rgba(255,255,255,0.5)';cx.lineWidth=2;cx.beginPath();cx.arc(sx,sy,11,0,PI*2);cx.stroke();
  /* Update dot position */
  const td=document.getElementById('tang-dot');td.style.display='block';td.style.left=sx+'px';td.style.top=sy+'px';
  /* Info */
  const deg=Math.atan(m)*180/PI;
  document.getElementById('tang-info').innerHTML=
    'Point: ('+tangentX.toFixed(3)+', '+y.toFixed(3)+')<br>'+
    'Slope: '+m.toFixed(4)+'<br>'+
    'Angle: '+deg.toFixed(1)+'\\u00b0<br>'+
    '<span style="color:rgba(255,255,255,0.35)">y = '+m.toFixed(3)+'(x - '+tangentX.toFixed(3)+') + '+y.toFixed(3)+'</span>';
}

function drawDoodle(){
  const all=[...doodleStrokes];if(curStroke)all.push(curStroke);
  all.forEach(st=>{if(st.pts.length<2)return;
    cx.strokeStyle='#f59e0b';cx.lineWidth=3;cx.lineCap='round';cx.lineJoin='round';
    cx.shadowColor='#f59e0b';cx.shadowBlur=4;
    cx.beginPath();cx.moveTo(st.pts[0][0],st.pts[0][1]);
    for(let i=1;i<st.pts.length;i++)cx.lineTo(st.pts[i][0],st.pts[i][1]);
    cx.stroke();
  });cx.shadowBlur=0;
}

function drawUserPts(){
  userPts.forEach((p,i)=>{
    const[px,py]=toScreen(p[0],p[1]);const sel=i===selectedPt;
    cx.beginPath();cx.arc(px,py,sel?8:6,0,PI*2);
    cx.fillStyle=sel?'rgba(251,191,36,1)':'rgba(251,191,36,0.85)';cx.fill();
    cx.strokeStyle='rgba(0,0,0,0.3)';cx.lineWidth=2;cx.stroke();
    if(sel){cx.strokeStyle='rgba(251,191,36,0.3)';cx.lineWidth=2;cx.beginPath();cx.arc(px,py,14,0,PI*2);cx.stroke();}
  });
  if(userPts.length>1){
    cx.strokeStyle='rgba(251,191,36,0.4)';cx.lineWidth=2;cx.setLineDash([6,4]);
    cx.beginPath();const[fx,fy]=toScreen(userPts[0][0],userPts[0][1]);cx.moveTo(fx,fy);
    for(let i=1;i<userPts.length;i++){const[px,py]=toScreen(userPts[i][0],userPts[i][1]);cx.lineTo(px,py);}
    cx.stroke();cx.setLineDash([]);
  }
}

/* Hover coordinate */
const coordBadge=document.getElementById('coord-badge');
let mouseX=-999,mouseY=-999;

function drawCursor(){
  const g=G[curFn];if(!g||g.param||doodleMode||pointMode)return;
  const fn=getTransFn();if(!fn)return;
  const[mx]=toMath(mouseX,mouseY);
  const y=fn(mx);if(!isFinite(y))return;
  const[sx,sy]=toScreen(mx,y);
  if(Math.abs(mouseY-sy)<35){
    cx.beginPath();cx.arc(sx,sy,6,0,PI*2);cx.fillStyle=g.color;cx.fill();
    cx.strokeStyle='rgba(255,255,255,0.4)';cx.lineWidth=2;cx.beginPath();cx.arc(sx,sy,10,0,PI*2);cx.stroke();
    cx.setLineDash([3,3]);cx.strokeStyle='rgba(255,255,255,0.08)';cx.lineWidth=1;
    cx.beginPath();cx.moveTo(sx,0);cx.lineTo(sx,H);cx.stroke();
    cx.beginPath();cx.moveTo(0,sy);cx.lineTo(W,sy);cx.stroke();
    cx.setLineDash([]);
    coordBadge.style.display='block';coordBadge.style.left=(sx+16)+'px';coordBadge.style.top=(sy-30)+'px';
    coordBadge.innerHTML='<span style="color:'+g.color+'">\\u25cf</span> ('+mx.toFixed(3)+', '+y.toFixed(3)+')';
  }else{coordBadge.style.display='none';}
}

function drawRefOCurve(g){
  /* y=x reflection: plot as parametric (y, f(y)) */
  cx.beginPath();cx.strokeStyle=g.color;cx.lineWidth=3.5;
  cx.shadowColor=g.color;cx.shadowBlur=10;
  let prevOk=false;
  for(let py=0;py<=H;py+=1){
    const y=(oY-py)/sc;
    let xi=y-trX;if(refY)xi=-xi;xi=xi/stX;
    let fv=g.fn(xi);if(!isFinite(fv)||Math.abs(fv)>1e4){prevOk=false;continue;}
    fv=fv*stY;if(refX)fv=-fv;fv=fv+trY;
    /* For y=x line, swap: screen x = fv mapped, screen y = y mapped */
    const sx=oX+fv*sc,sy=oY-y*sc;
    /* But we want reflection: plot (f(t), t) instead of (t, f(t)) */
    /* So screen_x = oX + f(y)*sc -> we need to compute differently */
    prevOk=false;
  }
  /* Simpler approach: evaluate original fn at many t values, plot (y, x) */
  cx.beginPath();cx.strokeStyle=g.color;cx.lineWidth=3.5;
  cx.shadowColor=g.color;cx.shadowBlur=10;
  prevOk=false;
  const baseFn=getTransFn();if(!baseFn)return;
  for(let px=0;px<=W;px+=1){
    const t=(px-oX)/sc;
    const fv=baseFn(t);
    if(!isFinite(fv)||Math.abs(fv)>1e4){prevOk=false;continue;}
    /* Reflect in y=x: swap coordinates => plot (fv, t) */
    const sx=oX+fv*sc,sy=oY-t*sc;
    if(!prevOk){cx.moveTo(sx,sy);prevOk=true;}
    else cx.lineTo(sx,sy);
  }
  cx.stroke();cx.shadowBlur=0;
}

function drawYEqualsX(){
  cx.setLineDash([6,6]);cx.strokeStyle='rgba(255,255,255,0.12)';cx.lineWidth=1;
  const ext=Math.max(W,H);
  cx.beginPath();cx.moveTo(oX-ext,oY+ext);cx.lineTo(oX+ext,oY-ext);cx.stroke();
  cx.setLineDash([]);
  /* Label */
  cx.fillStyle='rgba(255,255,255,0.15)';cx.font='10px system-ui';
  const lx=oX+60*sc/sc*3,ly=oY-60*sc/sc*3;
  cx.fillText('y = x',Math.min(W-30,oX+80),Math.max(20,oY-80));
}

function render(){
  cx.fillStyle='#0a0a1a';cx.fillRect(0,0,W,H);
  drawGrid();drawAxes();drawDomainLines();

  /* y=x reference line when that reflection is on */
  if(refO)drawYEqualsX();

  if(showInteg)drawIntegral();
  if(showVol)drawVolRotation();
  const g=G[curFn];

  if(g.param){plotParametric(curFn,g.color);}
  else{
    /* Ghost original curve when transforms are active */
    if(isTransformed()&&!refO){
      plotFunction(g.fn,g.color.replace(')',',0.15)').replace('rgb','rgba').replace('#',''),1.5,false);
      /* Use hex-to-faded approach */
      cx.globalAlpha=0.18;plotFunction(g.fn,g.color,1.5,false);cx.globalAlpha=1;
    }

    if(refO){
      /* For y=x reflection, draw original as ghost, then reflected curve */
      cx.globalAlpha=0.18;plotFunction(g.fn,g.color,1.5,false);cx.globalAlpha=1;
      drawRefOCurve(g);
    }else{
      const fn=getTransFn();if(fn)plotFunction(fn,g.color,3.5,true);
    }
    if(showDeriv){const dfn=getTransDeriv();if(dfn)plotFunction(dfn,'#f59e0b',2,false);}
  }
  if(showTangent)drawTangent();
  drawDoodle();drawUserPts();drawCursor();
  if(!g.param)document.getElementById('fn-eq').textContent=getTransEq();
  requestAnimationFrame(render);
}

/* ── Input handling ── */
cv.addEventListener('mousedown',e=>{
  if(e.target!==cv)return;didDrag=false;
  if(doodleMode){curStroke={pts:[[e.clientX,e.clientY]]};return;}
  if(pointMode){
    for(let i=0;i<userPts.length;i++){const[px,py]=toScreen(userPts[i][0],userPts[i][1]);if(Math.hypot(e.clientX-px,e.clientY-py)<15){selectedPt=i;showPtCoord(i);return;}}
    const[mx,my]=toMath(e.clientX,e.clientY);userPts.push([mx,my]);selectedPt=userPts.length-1;showPtCoord(selectedPt);return;
  }
  dragging=true;lx=e.clientX;ly=e.clientY;
});
addEventListener('mouseup',e=>{
  if(doodleMode&&curStroke){if(curStroke.pts.length>1)doodleStrokes.push(curStroke);curStroke=null;return;}
  dragging=false;
  if(!didDrag&&!doodleMode&&!pointMode&&e.target===cv){
    const g=G[curFn];
    if(g&&!g.param){
      const fn=getTransFn();if(!fn)return;
      const[mx]=toMath(e.clientX,e.clientY);const y=fn(mx);
      if(isFinite(y)){const[,sy]=toScreen(mx,y);
        if(Math.abs(e.clientY-sy)<35){
          if(showTangent){tangentX=mx;}
          showClickCoord(mx,y,g.color);
        }
      }
    }
  }
});
addEventListener('mousemove',e=>{
  mouseX=e.clientX;mouseY=e.clientY;
  if(doodleMode&&curStroke){curStroke.pts.push([e.clientX,e.clientY]);return;}
  if(!dragging)return;
  const dx=e.clientX-lx,dy=e.clientY-ly;
  if(Math.abs(dx)>2||Math.abs(dy)>2)didDrag=true;
  oX+=dx;oY+=dy;lx=e.clientX;ly=e.clientY;
});
cv.addEventListener('wheel',e=>{e.preventDefault();
  const mx=e.clientX,my=e.clientY;const[bx,by]=toMath(mx,my);
  const f=e.deltaY>0?0.92:1.08;sc=Math.max(5,Math.min(500,sc*f));
  oX=mx-bx*sc;oY=my+by*sc;calcVol();
},{passive:false});

/* Touch */
let touchT=0;
cv.addEventListener('touchstart',e=>{touchT=Date.now();didDrag=false;
  if(doodleMode&&e.touches.length===1){const t=e.touches[0];curStroke={pts:[[t.clientX,t.clientY]]};return;}
  if(pointMode&&e.touches.length===1){const t=e.touches[0];const[mx,my]=toMath(t.clientX,t.clientY);userPts.push([mx,my]);selectedPt=userPts.length-1;showPtCoord(selectedPt);return;}
  if(e.touches.length===1){dragging=true;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}
},{passive:true});
addEventListener('touchend',()=>{if(doodleMode&&curStroke){if(curStroke.pts.length>1)doodleStrokes.push(curStroke);curStroke=null;}dragging=false;});
addEventListener('touchmove',e=>{
  if(doodleMode&&curStroke&&e.touches.length===1){const t=e.touches[0];curStroke.pts.push([t.clientX,t.clientY]);return;}
  if(!dragging||e.touches.length!==1)return;
  const t=e.touches[0],dx=t.clientX-lx,dy=t.clientY-ly;
  if(Math.abs(dx)>2||Math.abs(dy)>2)didDrag=true;
  oX+=dx;oY+=dy;lx=t.clientX;ly=t.clientY;
},{passive:true});
let pinchDist=0;
cv.addEventListener('touchstart',e=>{if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;pinchDist=Math.sqrt(dx*dx+dy*dy);}},{passive:true});
addEventListener('touchmove',e=>{if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;const d=Math.sqrt(dx*dx+dy*dy);sc=Math.max(5,Math.min(500,sc*(d/pinchDist)));pinchDist=d;}},{passive:true});

function showClickCoord(x,y,color){
  coordBadge.style.display='block';const[sx,sy]=toScreen(x,y);
  coordBadge.style.left=(sx+16)+'px';coordBadge.style.top=(sy-30)+'px';
  coordBadge.innerHTML='<span style="color:'+color+'">\\u25cf</span> ('+x.toFixed(3)+', '+y.toFixed(3)+')';
  setTimeout(()=>coordBadge.style.display='none',4000);
}
function showPtCoord(i){
  if(i<0||i>=userPts.length)return;const p=userPts[i];const[sx,sy]=toScreen(p[0],p[1]);
  coordBadge.style.display='block';coordBadge.style.left=(sx+16)+'px';coordBadge.style.top=(sy-30)+'px';
  coordBadge.innerHTML='<span style="color:#fbbf24">\\u25cf</span> P'+(i+1)+' ('+p[0].toFixed(3)+', '+p[1].toFixed(3)+')';
}

pick('quadratic');
render();
<\/script></body></html>`;

const ATOMIC_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif}
canvas{display:block}
#controls{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10}
button{padding:7px 16px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;border-radius:8px;cursor:pointer;font-size:12px;backdrop-filter:blur(8px);transition:all .2s}
button:hover{background:rgba(255,255,255,0.15)}
button.active{background:rgba(245,158,11,0.3);border-color:rgba(245,158,11,0.6)}
#label{position:fixed;top:16px;left:50%;transform:translateX(-50%);color:#fff;font-size:18px;font-weight:700;letter-spacing:1px;text-align:center}
#sub{color:rgba(255,255,255,0.4);font-size:12px;font-weight:400}
</style></head><body>
<canvas id="c"></canvas>
<div id="label">Hydrogen<br><span id="sub">1 proton &middot; 1 electron</span></div>
<div id="controls">
  <button onclick="setAtom(0)" class="active" id="b0">H</button>
  <button onclick="setAtom(1)" id="b1">He</button>
  <button onclick="setAtom(2)" id="b2">Li</button>
  <button onclick="setAtom(3)" id="b3">C</button>
  <button onclick="setAtom(4)" id="b4">Ne</button>
  <button onclick="setAtom(5)" id="b5">Na</button>
</div>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H;function resize(){W=c.width=innerWidth;H=c.height=innerHeight}resize();addEventListener('resize',resize);

const atoms=[
  {name:'Hydrogen',sym:'H',z:1,shells:[1]},
  {name:'Helium',sym:'He',z:2,shells:[2]},
  {name:'Lithium',sym:'Li',z:3,shells:[2,1]},
  {name:'Carbon',sym:'C',z:6,shells:[2,4]},
  {name:'Neon',sym:'Ne',z:10,shells:[2,8]},
  {name:'Sodium',sym:'Na',z:11,shells:[2,8,1]},
];
let current=0,time=0;

function setAtom(i){
  current=i;
  document.querySelectorAll('#controls button').forEach((b,j)=>b.classList.toggle('active',j===i));
  const a=atoms[i];
  document.getElementById('label').innerHTML=a.name+'<br><span id="sub">'+a.z+' proton'+(a.z>1?'s':'')+' &middot; '+a.z+' electron'+(a.z>1?'s':'')+'</span>';
}

function draw(){
  time+=0.015;
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  const cx=W/2,cy=H/2;const a=atoms[current];

  // Nucleus glow
  const ng=ctx.createRadialGradient(cx,cy,0,cx,cy,30);
  ng.addColorStop(0,'rgba(245,158,11,0.6)');ng.addColorStop(0.5,'rgba(245,158,11,0.15)');ng.addColorStop(1,'transparent');
  ctx.fillStyle=ng;ctx.beginPath();ctx.arc(cx,cy,30,0,Math.PI*2);ctx.fill();

  // Nucleus
  const nr=8+a.z*0.8;
  ctx.beginPath();ctx.arc(cx,cy,nr,0,Math.PI*2);
  ctx.fillStyle='#f59e0b';ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold '+(nr*0.8)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(a.sym,cx,cy);

  // Shells
  a.shells.forEach((count,si)=>{
    const r=50+si*40;
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;ctx.stroke();
    for(let e=0;e<count;e++){
      const angle=time*(1.2-si*0.3)+e*(Math.PI*2/count);
      const ex=cx+Math.cos(angle)*r,ey=cy+Math.sin(angle)*r;
      // Electron glow
      const eg=ctx.createRadialGradient(ex,ey,0,ex,ey,8);
      eg.addColorStop(0,'rgba(96,165,250,0.8)');eg.addColorStop(1,'transparent');
      ctx.fillStyle=eg;ctx.beginPath();ctx.arc(ex,ey,8,0,Math.PI*2);ctx.fill();
      // Electron dot
      ctx.beginPath();ctx.arc(ex,ey,3,0,Math.PI*2);ctx.fillStyle='#60a5fa';ctx.fill();
    }
  });

  requestAnimationFrame(draw);
}
draw();
<\/script></body></html>`;

const PENDULUM_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif}
canvas{display:block}
#panel{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:10px;align-items:end;z-index:10;flex-wrap:wrap;justify-content:center}
.slider-group{display:flex;flex-direction:column;gap:2px;align-items:center}
.slider-group label{color:rgba(255,255,255,0.5);font-size:10px}
.slider-group input[type=range]{width:100px;accent-color:#f43f5e}
.slider-group .val{color:#fff;font-size:11px;font-weight:600}
button{padding:7px 16px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;border-radius:8px;cursor:pointer;font-size:12px;backdrop-filter:blur(8px)}
button:hover{background:rgba(255,255,255,0.15)}
#stats{position:fixed;top:16px;right:16px;color:rgba(255,255,255,0.6);font-size:12px;line-height:1.8;text-align:right}
</style></head><body>
<canvas id="c"></canvas>
<div id="stats"></div>
<div id="panel">
  <div class="slider-group"><label>Length</label><input type="range" id="len" min="80" max="300" value="180"><div class="val" id="len-v">180</div></div>
  <div class="slider-group"><label>Gravity</label><input type="range" id="grav" min="1" max="30" value="10"><div class="val" id="grav-v">9.8</div></div>
  <div class="slider-group"><label>Damping</label><input type="range" id="damp" min="0" max="50" value="2"><div class="val" id="damp-v">0.02</div></div>
  <button onclick="resetPend()">Reset</button>
</div>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H;function resize(){W=c.width=innerWidth;H=c.height=innerHeight}resize();addEventListener('resize',resize);

let angle=Math.PI/4,vel=0,trail=[];

function getParams(){
  const L=+document.getElementById('len').value;
  const g=+document.getElementById('grav').value;
  const d=+document.getElementById('damp').value/1000;
  document.getElementById('len-v').textContent=L;
  document.getElementById('grav-v').textContent=(g*0.98).toFixed(1);
  document.getElementById('damp-v').textContent=(d).toFixed(3);
  return{L,g:g*0.98,d};
}

function resetPend(){angle=Math.PI/4;vel=0;trail=[];}

function draw(){
  const{L,g,d}=getParams();
  const dt=0.16;
  const acc=-g/L*Math.sin(angle)-d*vel;
  vel+=acc*dt;
  angle+=vel*dt;

  const px=W/2,py=80;
  const bx=px+Math.sin(angle)*L,by=py+Math.cos(angle)*L;
  trail.push({x:bx,y:by});if(trail.length>200)trail.shift();

  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);

  // Trail
  if(trail.length>1){
    ctx.beginPath();ctx.moveTo(trail[0].x,trail[0].y);
    trail.forEach((p,i)=>{ctx.lineTo(p.x,p.y);});
    ctx.strokeStyle='rgba(244,63,94,0.15)';ctx.lineWidth=1.5;ctx.stroke();
  }

  // String
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(bx,by);
  ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=2;ctx.stroke();

  // Pivot
  ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.5)';ctx.fill();

  // Bob glow
  const bg=ctx.createRadialGradient(bx,by,0,bx,by,28);
  bg.addColorStop(0,'rgba(244,63,94,0.4)');bg.addColorStop(1,'transparent');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(bx,by,28,0,Math.PI*2);ctx.fill();

  // Bob
  ctx.beginPath();ctx.arc(bx,by,14,0,Math.PI*2);ctx.fillStyle='#f43f5e';ctx.fill();

  // Energy
  const KE=0.5*L*vel*vel;
  const PE=g*L*(1-Math.cos(angle));
  const TE=KE+PE;
  document.getElementById('stats').innerHTML='KE: <span style="color:#60a5fa">'+KE.toFixed(1)+'</span><br>PE: <span style="color:#f59e0b">'+PE.toFixed(1)+'</span><br>Total: <span style="color:#f43f5e">'+TE.toFixed(1)+'</span><br>Angle: '+(angle*180/Math.PI).toFixed(1)+'°';

  requestAnimationFrame(draw);
}
draw();
<\/script></body></html>`;

const BONDING_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif}
canvas{display:block}
#controls{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10}
button{padding:7px 16px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;border-radius:8px;cursor:pointer;font-size:12px;backdrop-filter:blur(8px);transition:all .2s}
button:hover{background:rgba(255,255,255,0.15)}
button.active{background:rgba(20,184,166,0.3);border-color:rgba(20,184,166,0.6)}
#label{position:fixed;top:16px;left:50%;transform:translateX(-50%);text-align:center;color:#fff;font-size:16px;font-weight:700}
#sublabel{color:rgba(255,255,255,0.4);font-size:11px;font-weight:400}
</style></head><body>
<canvas id="c"></canvas>
<div id="label">Water (H₂O)<br><span id="sublabel">Covalent bond &middot; Bent geometry</span></div>
<div id="controls">
  <button onclick="setMol(0)" id="m0" class="active">H₂O</button>
  <button onclick="setMol(1)" id="m1">CO₂</button>
  <button onclick="setMol(2)" id="m2">CH₄</button>
  <button onclick="setMol(3)" id="m3">NaCl</button>
  <button onclick="setMol(4)" id="m4">NH₃</button>
</div>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H,rotX=0.3,rotY=0,dragging=false,lastMX,lastMY;
function resize(){W=c.width=innerWidth;H=c.height=innerHeight}resize();addEventListener('resize',resize);

const molecules=[
  {name:'Water (H\\u2082O)',sub:'Covalent bond \\u00b7 Bent geometry',atoms:[
    {el:'O',x:0,y:0,z:0,r:20,color:'#ef4444'},
    {el:'H',x:-0.8,y:0.6,z:0,r:14,color:'#60a5fa'},
    {el:'H',x:0.8,y:0.6,z:0,r:14,color:'#60a5fa'}
  ],bonds:[[0,1],[0,2]]},
  {name:'Carbon Dioxide (CO\\u2082)',sub:'Covalent bond \\u00b7 Linear geometry',atoms:[
    {el:'C',x:0,y:0,z:0,r:18,color:'#a3a3a3'},
    {el:'O',x:-1.2,y:0,z:0,r:20,color:'#ef4444'},
    {el:'O',x:1.2,y:0,z:0,r:20,color:'#ef4444'}
  ],bonds:[[0,1],[0,2]]},
  {name:'Methane (CH\\u2084)',sub:'Covalent bond \\u00b7 Tetrahedral geometry',atoms:[
    {el:'C',x:0,y:0,z:0,r:18,color:'#a3a3a3'},
    {el:'H',x:0.8,y:0.8,z:0.8,r:14,color:'#60a5fa'},
    {el:'H',x:-0.8,y:-0.8,z:0.8,r:14,color:'#60a5fa'},
    {el:'H',x:-0.8,y:0.8,z:-0.8,r:14,color:'#60a5fa'},
    {el:'H',x:0.8,y:-0.8,z:-0.8,r:14,color:'#60a5fa'}
  ],bonds:[[0,1],[0,2],[0,3],[0,4]]},
  {name:'Sodium Chloride (NaCl)',sub:'Ionic bond \\u00b7 Crystal lattice',atoms:[
    {el:'Na\\u207a',x:-0.7,y:0,z:0,r:22,color:'#a78bfa'},
    {el:'Cl\\u207b',x:0.7,y:0,z:0,r:26,color:'#34d399'}
  ],bonds:[[0,1]]},
  {name:'Ammonia (NH\\u2083)',sub:'Covalent bond \\u00b7 Trigonal pyramidal',atoms:[
    {el:'N',x:0,y:-0.2,z:0,r:18,color:'#818cf8'},
    {el:'H',x:0.9,y:0.5,z:0,r:14,color:'#60a5fa'},
    {el:'H',x:-0.45,y:0.5,z:0.78,r:14,color:'#60a5fa'},
    {el:'H',x:-0.45,y:0.5,z:-0.78,r:14,color:'#60a5fa'}
  ],bonds:[[0,1],[0,2],[0,3]]}
];
let current=0;

function setMol(i){
  current=i;document.querySelectorAll('#controls button').forEach((b,j)=>b.classList.toggle('active',j===i));
  const m=molecules[i];document.getElementById('label').innerHTML=m.name+'<br><span id="sublabel">'+m.sub+'</span>';
}

function project(x,y,z){
  const cx=Math.cos(rotX),sx=Math.sin(rotX),cy=Math.cos(rotY),sy=Math.sin(rotY);
  const y1=y*cx-z*sx,z1=y*sx+z*cx,x1=x*cy+z1*sy,z2=-x*sy+z1*cy;
  const s=200/(z2+5);
  return{x:x1*s+W/2,y:y1*s+H/2,z:z2,s};
}

function draw(){
  rotY+=0.008;
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  const m=molecules[current];
  const sc=80;
  const projected=m.atoms.map(a=>({...a,...project(a.x*sc,a.y*sc,a.z*sc)}));

  // Sort by z for painter's algorithm
  const sorted=[...projected].sort((a,b)=>a.z-b.z);

  // Bonds
  m.bonds.forEach(([a,b])=>{
    const pa=projected[a],pb=projected[b];
    ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);
    ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=3;ctx.stroke();
  });

  // Atoms
  sorted.forEach(a=>{
    const glow=ctx.createRadialGradient(a.x,a.y,0,a.x,a.y,a.r*1.8);
    glow.addColorStop(0,a.color+'66');glow.addColorStop(1,'transparent');
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(a.x,a.y,a.r*1.8,0,Math.PI*2);ctx.fill();

    ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fillStyle=a.color;ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold '+(a.r*0.7)+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(a.el,a.x,a.y);
  });

  requestAnimationFrame(draw);
}

c.addEventListener('mousedown',e=>{dragging=true;lastMX=e.clientX;lastMY=e.clientY});
addEventListener('mouseup',()=>dragging=false);
addEventListener('mousemove',e=>{if(!dragging)return;rotY+=(e.clientX-lastMX)*0.008;rotX+=(e.clientY-lastMY)*0.008;lastMX=e.clientX;lastMY=e.clientY;});
c.addEventListener('touchstart',e=>{if(e.touches.length===1){dragging=true;lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;}},{passive:true});
addEventListener('touchend',()=>dragging=false);
addEventListener('touchmove',e=>{if(!dragging||e.touches.length!==1)return;const t=e.touches[0];rotY+=(t.clientX-lastMX)*0.008;rotX+=(t.clientY-lastMY)*0.008;lastMX=t.clientX;lastMY=t.clientY;},{passive:true});

draw();
<\/script></body></html>`;

const OPTICS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#080c10;color:#e6edf3;font-family:system-ui,-apple-system,sans-serif;overflow:hidden;display:flex;flex-direction:column;height:100vh}
header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #2a3441;background:#0d1117;flex-shrink:0}
header h1{font-size:15px;font-weight:600;letter-spacing:-0.3px}
.hdr-left{display:flex;align-items:center;gap:8px}
.hdr-right{display:flex;gap:6px}
main{display:flex;flex:1;overflow:hidden}
aside{width:280px;min-width:240px;background:linear-gradient(180deg,#0d1117,rgba(13,17,23,0.95));border-right:1px solid #2a3441;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:12px;flex-shrink:0}
.card{background:#151b23;border-radius:10px;padding:12px;border:1px solid #2a3441;box-shadow:0 0 15px rgba(0,212,255,0.06)}
.card h2{font-size:9px;font-weight:600;color:#7d8590;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px}
.lens-btns{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.lens-btn{padding:8px;border-radius:7px;font-size:12px;font-weight:500;border:1px solid #2a3441;background:#151b23;color:#7d8590;cursor:pointer;transition:all .2s}
.lens-btn:hover{border-color:#00d4ff;background:rgba(0,212,255,0.08)}
.lens-btn.active{background:#00d4ff;color:#080c10;border-color:#00d4ff}
.slider-row{margin-bottom:10px}
.slider-row .top{display:flex;justify-content:space-between;margin-bottom:4px}
.slider-row label{font-size:12px;color:#e6edf3}
.slider-row .val{font-size:12px;color:#00d4ff;font-family:monospace;text-shadow:0 0 8px rgba(0,212,255,0.3)}
input[type=range]{-webkit-appearance:none;width:100%;height:5px;background:#080c10;border-radius:3px;outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:#00d4ff;border-radius:50%;cursor:pointer;box-shadow:0 0 8px #00d4ff}
.data-row{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #2a3441}
.data-row .lbl{font-size:11px;color:#7d8590}
.data-row .val{font-size:15px;color:#00d4ff;font-weight:600;font-family:monospace;text-shadow:0 0 8px rgba(0,212,255,0.15)}
.props{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.tag{padding:3px 10px;border-radius:99px;font-size:10px;font-weight:600}
.canvas-wrap{flex:1;position:relative;background:#080c10}
canvas{display:block;cursor:grab;width:100%;height:100%}
canvas:active{cursor:grabbing}
.coord{position:absolute;bottom:8px;right:8px;font-size:10px;color:#7d8590;font-family:monospace;background:#0d1117;padding:4px 8px;border-radius:6px;border:1px solid #2a3441}
button.act{padding:6px 14px;border-radius:7px;font-size:11px;font-weight:500;border:1px solid #2a3441;background:#151b23;color:#7d8590;cursor:pointer;transition:all .2s}
button.act:hover{border-color:#00d4ff;background:rgba(0,212,255,0.1);color:#e6edf3}
.demo-btn{width:100%;padding:9px;border-radius:9px;font-size:12px;font-weight:600;border:none;background:linear-gradient(135deg,#00d4ff,#0099cc);color:#080c10;cursor:pointer;transition:all .2s;display:flex;align-items:center;justify-content:center;gap:6px}
.demo-btn:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,212,255,0.35)}
.hint{font-size:10px;color:#7d8590;padding:8px;background:#080c10;border-radius:7px;line-height:1.5}
</style></head><body>
<header>
  <div class="hdr-left">
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" stroke="#00d4ff" stroke-width="2"><ellipse cx="16" cy="16" rx="4" ry="12"/><line x1="4" y1="16" x2="10" y2="16"/><line x1="22" y1="16" x2="28" y2="16"/></svg>
    <h1>Geometric Optics Lab</h1>
  </div>
  <div class="hdr-right">
    <button class="act" onclick="resetAll()">Reset</button>
  </div>
</header>
<main>
  <aside>
    <div class="card">
      <h2>Lens Type</h2>
      <div class="lens-btns">
        <button id="cvxBtn" class="lens-btn active" onclick="setLens('convex')">Convex</button>
        <button id="ccvBtn" class="lens-btn" onclick="setLens('concave')">Concave</button>
      </div>
    </div>
    <div class="card">
      <h2>Parameters</h2>
      <div class="slider-row"><div class="top"><label>Focal Length (f)</label><span class="val" id="fV">100 px</span></div><input type="range" id="fS" min="40" max="200" value="100"></div>
      <div class="slider-row"><div class="top"><label>Object Distance (u)</label><span class="val" id="uV">300 px</span></div><input type="range" id="uS" min="30" max="500" value="300"></div>
      <div class="slider-row"><div class="top"><label>Object Height (h)</label><span class="val" id="hV">50 px</span></div><input type="range" id="hS" min="20" max="100" value="50"></div>
    </div>
    <div class="card">
      <h2>Imaging Data</h2>
      <div class="data-row"><span class="lbl">Image Distance (v)</span><span class="val" id="vD">150 px</span></div>
      <div class="data-row"><span class="lbl">Magnification (M)</span><span class="val" id="mD">0.50x</span></div>
      <div class="data-row"><span class="lbl">Image Height</span><span class="val" id="ihD">25 px</span></div>
      <div style="padding-top:6px"><span style="font-size:11px;color:#7d8590">Image Properties</span><div class="props" id="propsC"></div></div>
    </div>
    <button class="demo-btn" id="demoBtn" onclick="toggleDemo()">&#9654; One-Click Demo</button>
    <div class="hint">Drag the candle to move the object. Drag focal markers to adjust f. Watch rays update live.</div>
  </aside>
  <div class="canvas-wrap"><canvas id="cv"></canvas><div class="coord" id="coordD">x: 0, y: 0</div></div>
</main>
<script>
const cv=document.getElementById('cv'),cx=cv.getContext('2d');
let lt='convex',fl=100,od=300,oh=50,isDrag=false,dragT=null,isDemo=false,demoId=null,cX=0,cY=0,sc=1;
const C={axis:'#2a3642',grid:'#1a2028',lens:'#00d4ff',obj:'#ff6b35',imgR:'#00d4ff',rayI:'#ffd700',rayR:'#00ff88',rayV:'#5a6270',focal:'#ff6b35'};

function clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v))}
function tCX(x){return cX+x*sc}
function tCY(y){return cY-y*sc}
function tPX(cx2){return(cx2-cX)/sc}
function tPY(cy2){return(cY-cy2)/sc}

function calcImg(){
  const f=lt==='convex'?fl:-fl,u=od,den=u-f;
  if(Math.abs(den)<0.001)return{v:Infinity,M:Infinity,isReal:false,ih:0};
  const v=(f*u)/den,M=-v/u,ih=Math.abs(M)*oh;
  let isR,isU,isM;
  if(lt==='convex'){isR=v>0;isU=v<0;isM=Math.abs(M)>1;}else{isR=false;isU=true;isM=false;}
  return{v,M,ih,isR,isU,isM};
}

function drawGrid(){cx.strokeStyle=C.grid;cx.lineWidth=0.5;const gs=50*sc;for(let x=cX%gs;x<cv.width;x+=gs){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,cv.height);cx.stroke();}for(let y=cY%gs;y<cv.height;y+=gs){cx.beginPath();cx.moveTo(0,y);cx.lineTo(cv.width,y);cx.stroke();}}

function drawAxis(){cx.strokeStyle=C.axis;cx.lineWidth=2;cx.beginPath();cx.moveTo(0,cY);cx.lineTo(cv.width,cY);cx.stroke();cx.fillStyle='#5a6270';cx.font='10px monospace';cx.textAlign='center';for(let i=-600;i<=600;i+=50){const x=tCX(i);if(x>0&&x<cv.width){cx.beginPath();cx.moveTo(x,cY-4);cx.lineTo(x,cY+4);cx.stroke();if(i!==0&&i%100===0)cx.fillText(i,x,cY+16);}}}

function drawLens(){const x=tCX(0),hh=180;cx.strokeStyle=C.lens;cx.lineWidth=3;if(lt==='convex'){cx.beginPath();cx.moveTo(x,cY-hh);cx.quadraticCurveTo(x+20,cY,x,cY+hh);cx.stroke();cx.beginPath();cx.moveTo(x,cY-hh);cx.quadraticCurveTo(x-20,cY,x,cY+hh);cx.stroke();}else{cx.beginPath();cx.moveTo(x-8,cY-hh);cx.quadraticCurveTo(x+12,cY,x-8,cY+hh);cx.stroke();cx.beginPath();cx.moveTo(x+8,cY-hh);cx.quadraticCurveTo(x-12,cY,x+8,cY+hh);cx.stroke();}cx.fillStyle=C.lens;[-(hh+10),hh+10].forEach(dy=>{const ty=cY+dy,dir=dy<0?1:-1;cx.beginPath();cx.moveTo(x,ty);cx.lineTo(x-5,ty+dir*10);cx.lineTo(x+5,ty+dir*10);cx.closePath();cx.fill();});}

function drawFocal(){const f=lt==='convex'?fl:-fl;const f1=tCX(-Math.abs(f)),f2=tCX(Math.abs(f)),sz=7;cx.strokeStyle=C.focal;cx.lineWidth=2;[f1,f2].forEach(fx=>{cx.beginPath();cx.moveTo(fx-sz,cY-sz);cx.lineTo(fx+sz,cY+sz);cx.moveTo(fx+sz,cY-sz);cx.lineTo(fx-sz,cY+sz);cx.stroke();});cx.fillStyle=C.focal;cx.font='bold 11px system-ui';cx.textAlign='center';cx.fillText('F',f1,cY+22);cx.fillText("F'",f2,cY+22);const f21=tCX(-2*Math.abs(f)),f22=tCX(2*Math.abs(f));cx.fillStyle='#5a6270';if(f21>40)cx.fillText('2F',f21,cY+22);if(f22<cv.width-40)cx.fillText("2F'",f22,cY+22);}

function drawArrow(x,y,h,col,dash,dir){dir=dir||1;const ax=tCX(x),ay=tCY(y),ty=tCY(y+h*dir);cx.strokeStyle=col;cx.fillStyle=col;cx.lineWidth=3;cx.setLineDash(dash?[8,4]:[]);cx.beginPath();cx.moveTo(ax,ay);cx.lineTo(ax,ty);cx.stroke();const hs=9;cx.beginPath();cx.moveTo(ax,ty);cx.lineTo(ax-hs/2,ty+(dir>0?hs:-hs));cx.lineTo(ax+hs/2,ty+(dir>0?hs:-hs));cx.closePath();cx.fill();cx.setLineDash([]);}

function drawObj(){drawArrow(-od,0,oh,C.obj,false,1);const ax=tCX(-od);cx.fillStyle=C.obj;cx.beginPath();cx.ellipse(ax,tCY(0)+3,7,3,0,0,Math.PI*2);cx.fill();}

function drawImg(d){const{v,M,ih,isR,isU}=d;if(!isFinite(v)||Math.abs(v)>1000)return;drawArrow(v,0,ih,isR?C.imgR:C.imgR,!isR,isU?1:-1);}

function drawConvexRays(d){const f=fl,objX=-od,objY=oh,{v,ih,isR,isU}=d,imgY=isU?ih:-ih;cx.lineWidth=2;cx.setLineDash([]);
cx.strokeStyle=C.rayI;cx.beginPath();cx.moveTo(tCX(objX),tCY(objY));cx.lineTo(tCX(0),tCY(objY));cx.stroke();
if(isR&&isFinite(v)){cx.strokeStyle=C.rayR;cx.beginPath();cx.moveTo(tCX(0),tCY(objY));cx.lineTo(tCX(v),tCY(imgY));cx.stroke();}else if(!isR&&isFinite(v)){cx.strokeStyle=C.rayR;cx.beginPath();cx.moveTo(tCX(0),tCY(objY));cx.lineTo(tCX(400),tCY(objY-(objY/f)*400));cx.stroke();cx.strokeStyle=C.rayV;cx.setLineDash([6,4]);cx.beginPath();cx.moveTo(tCX(0),tCY(objY));cx.lineTo(tCX(v),tCY(imgY));cx.stroke();cx.setLineDash([]);}
cx.strokeStyle=C.rayI;cx.beginPath();cx.moveTo(tCX(objX),tCY(objY));cx.lineTo(tCX(0),tCY(0));cx.stroke();
if(isR&&isFinite(v)){cx.strokeStyle=C.rayR;cx.beginPath();cx.moveTo(tCX(0),tCY(0));cx.lineTo(tCX(v),tCY(imgY));cx.stroke();}else if(!isR&&isFinite(v)){cx.strokeStyle=C.rayR;cx.beginPath();cx.moveTo(tCX(0),tCY(0));cx.lineTo(tCX(400),tCY(-(objY/od)*400));cx.stroke();cx.strokeStyle=C.rayV;cx.setLineDash([6,4]);cx.beginPath();cx.moveTo(tCX(0),tCY(0));cx.lineTo(tCX(v),tCY(imgY));cx.stroke();cx.setLineDash([]);}
if(od>fl&&isFinite(v)){const sl=objY/(objX+f),yL=sl*f;cx.strokeStyle=C.rayI;cx.beginPath();cx.moveTo(tCX(objX),tCY(objY));cx.lineTo(tCX(0),tCY(yL));cx.stroke();cx.strokeStyle=C.rayR;cx.beginPath();cx.moveTo(tCX(0),tCY(yL));cx.lineTo(tCX(v),tCY(yL));cx.stroke();}}

function drawConcaveRays(d){const f=fl,objX=-od,objY=oh,{v,ih}=d,imgY=ih;if(!isFinite(v))return;cx.lineWidth=2;cx.setLineDash([]);
cx.strokeStyle=C.rayI;cx.beginPath();cx.moveTo(tCX(objX),tCY(objY));cx.lineTo(tCX(0),tCY(objY));cx.stroke();
const sl1=objY/f;cx.strokeStyle=C.rayR;cx.beginPath();cx.moveTo(tCX(0),tCY(objY));cx.lineTo(tCX(300),tCY(objY-sl1*300));cx.stroke();
cx.strokeStyle=C.rayV;cx.setLineDash([6,4]);cx.beginPath();cx.moveTo(tCX(0),tCY(objY));cx.lineTo(tCX(-f),tCY(0));cx.stroke();cx.setLineDash([]);
cx.strokeStyle=C.rayI;cx.beginPath();cx.moveTo(tCX(objX),tCY(objY));cx.lineTo(tCX(0),tCY(0));cx.stroke();
cx.strokeStyle=C.rayR;cx.beginPath();cx.moveTo(tCX(0),tCY(0));cx.lineTo(tCX(300),tCY(-(objY/od)*300));cx.stroke();
cx.strokeStyle=C.rayV;cx.setLineDash([6,4]);cx.beginPath();cx.moveTo(tCX(0),tCY(0));cx.lineTo(tCX(v),tCY(imgY));cx.stroke();cx.setLineDash([]);}

function updateUI(d){const{v,M,ih,isR,isU,isM}=d;
document.getElementById('vD').textContent=isFinite(v)?Math.abs(v).toFixed(1)+' px':'\\u221e';
document.getElementById('mD').textContent=isFinite(M)?Math.abs(M).toFixed(2)+'x':'\\u221e';
document.getElementById('ihD').textContent=isFinite(ih)?ih.toFixed(1)+' px':'\\u221e';
const pc=document.getElementById('propsC');pc.innerHTML='';
const tags=[[isR?'Real':'Virtual',isR?'#00d4ff':'#5a6270',isR?'#080c10':'#e6edf3'],[isU?'Upright':'Inverted','#ff6b35','#fff'],[Math.abs(M)<0.99?'Reduced':Math.abs(M)>1.01?'Magnified':'Same Size','#00ff88','#080c10']];
tags.forEach(([t,bg,fg])=>{const s=document.createElement('span');s.className='tag';s.style.background=bg;s.style.color=fg;s.textContent=t;pc.appendChild(s);});}

function render(){cx.fillStyle='#080c10';cx.fillRect(0,0,cv.width,cv.height);drawGrid();drawAxis();drawLens();drawFocal();const d=calcImg();if(lt==='convex')drawConvexRays(d);else drawConcaveRays(d);drawObj();drawImg(d);updateUI(d);}

function resize(){const p=cv.parentElement;cv.width=p.clientWidth;cv.height=p.clientHeight;cX=cv.width*0.45;cY=cv.height/2;sc=1;render();}

function setLens(t){lt=t;document.getElementById('cvxBtn').classList.toggle('active',t==='convex');document.getElementById('ccvBtn').classList.toggle('active',t==='concave');render();}

function checkTarget(mx,my){const px=tPX(mx),py=tPY(my);if(Math.abs(px-(-od))<30&&Math.abs(py-oh/2)<oh)return'obj';if((Math.abs(px-(-fl))<20||Math.abs(px-fl)<20)&&Math.abs(py)<30)return'focal';return null;}

cv.addEventListener('mousedown',e=>{const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;dragT=checkTarget(mx,my);if(dragT){isDrag=true;cv.style.cursor='grabbing';}});
cv.addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;const px=tPX(mx),py=tPY(my);document.getElementById('coordD').textContent='x: '+px.toFixed(0)+', y: '+py.toFixed(0);if(isDrag&&dragT){if(dragT==='obj'){od=clamp(-px,30,500);document.getElementById('uS').value=od;document.getElementById('uV').textContent=Math.round(od)+' px';}else{fl=clamp(Math.abs(px),40,200);document.getElementById('fS').value=fl;document.getElementById('fV').textContent=Math.round(fl)+' px';}render();}else{cv.style.cursor=checkTarget(mx,my)?'grab':'default';}});
cv.addEventListener('mouseup',()=>{isDrag=false;dragT=null;cv.style.cursor='default';});
cv.addEventListener('mouseleave',()=>{isDrag=false;dragT=null;});

cv.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0],r=cv.getBoundingClientRect();dragT=checkTarget(t.clientX-r.left,t.clientY-r.top);if(dragT)isDrag=true;},{passive:false});
cv.addEventListener('touchmove',e=>{e.preventDefault();if(!isDrag||!dragT)return;const t=e.touches[0],r=cv.getBoundingClientRect(),px=tPX(t.clientX-r.left);if(dragT==='obj'){od=clamp(-px,30,500);document.getElementById('uS').value=od;document.getElementById('uV').textContent=Math.round(od)+' px';}else{fl=clamp(Math.abs(px),40,200);document.getElementById('fS').value=fl;document.getElementById('fV').textContent=Math.round(fl)+' px';}render();},{passive:false});
cv.addEventListener('touchend',()=>{isDrag=false;dragT=null;});

document.getElementById('fS').addEventListener('input',e=>{fl=+e.target.value;document.getElementById('fV').textContent=fl+' px';render();});
document.getElementById('uS').addEventListener('input',e=>{od=+e.target.value;document.getElementById('uV').textContent=od+' px';render();});
document.getElementById('hS').addEventListener('input',e=>{oh=+e.target.value;document.getElementById('hV').textContent=oh+' px';render();});

function resetAll(){stopDemo();fl=100;od=300;oh=50;lt='convex';document.getElementById('fS').value=100;document.getElementById('fV').textContent='100 px';document.getElementById('uS').value=300;document.getElementById('uV').textContent='300 px';document.getElementById('hS').value=50;document.getElementById('hV').textContent='50 px';document.getElementById('cvxBtn').classList.add('active');document.getElementById('ccvBtn').classList.remove('active');render();}

function stopDemo(){isDemo=false;if(demoId){cancelAnimationFrame(demoId);demoId=null;}document.getElementById('demoBtn').innerHTML='&#9654; One-Click Demo';}

function toggleDemo(){if(isDemo){stopDemo();return;}isDemo=true;lt='convex';setLens('convex');document.getElementById('demoBtn').innerHTML='\\u25a0 Stop Demo';
const sU=4*fl,eU=0.6*fl,dur=6000,st=performance.now();
function anim(t){if(!isDemo)return;const p=Math.min((t-st)/dur,1),e=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2;od=sU-(sU-eU)*e;document.getElementById('uS').value=od;document.getElementById('uV').textContent=Math.round(od)+' px';render();if(p<1){demoId=requestAnimationFrame(anim);}else{setTimeout(()=>{if(!isDemo)return;const st2=performance.now();function rev(t){if(!isDemo)return;const p=Math.min((t-st2)/dur,1),e=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2;od=eU+(sU-eU)*e;document.getElementById('uS').value=od;document.getElementById('uV').textContent=Math.round(od)+' px';render();if(p<1)demoId=requestAnimationFrame(rev);else stopDemo();}demoId=requestAnimationFrame(rev);},400);}}
demoId=requestAnimationFrame(anim);}

addEventListener('resize',resize);resize();
<\/script></body></html>`;

// ── Categories ───────────────────────────────────────────────────────────────

export const STEM_CATEGORIES: StemCategory[] = [
  {
    id: 'mathematics',
    label: 'Mathematics',
    slug: 'mathematics',
    description: 'Explore geometry, vectors, and calculus through interactive 3D visualisations.',
    icon: 'Pi',
    gradient: 'from-blue-500 to-indigo-600',
    glowColor: 'rgba(99,102,241,0.35)',
    heroGradient: 'from-blue-600 via-indigo-700 to-violet-800',
    simulations: [
      {
        id: 'geometry-explorer',
        title: '3D Geometry Explorer',
        description: 'Explore 15+ shapes: cube, cuboid, sphere, cone, cylinder, pyramid, torus, hemisphere, compound shapes, and their nets — all interactive 3D.',
        icon: 'Box',
        gradient: 'from-blue-500 to-cyan-400',
        glowColor: 'rgba(59,130,246,0.35)',
        difficulty: 'Beginner',
        tags: ['Shapes', 'Volume', 'Nets', 'Compound', 'Surface Area'],
        instructions: 'Drag to rotate any shape. Scroll to zoom in/out. Basic shapes: Cube, Cuboid, Sphere, Cone, Cylinder, Pyramid, Torus, Hemisphere. Compound shapes: Pyramid+Cube, Cone+Cylinder, Cylinder+Hemisphere. Nets: unfolded views of Cube, Cylinder, Cone, Pyramid. Toggle Wireframe for edge view. Use "Draw Lines" mode to click any two vertex dots and connect them — great for visualising diagonals, cross-sections, or custom edges. "Clear Lines" removes all drawn lines.',
        html_code: GEOMETRY_HTML,
      },
      {
        id: 'vector-lab',
        title: 'Vector Visualiser',
        description: 'Add, subtract, and compute dot & cross products of 3D vectors with instant graphical feedback.',
        icon: 'Move3D',
        gradient: 'from-violet-500 to-purple-500',
        glowColor: 'rgba(139,92,246,0.35)',
        difficulty: 'Intermediate',
        tags: ['Vectors', 'Dot Product', 'Cross Product'],
        instructions: 'Enter vector components for A (purple) and B (green) in the input fields. Click operation buttons to compute addition, subtraction, cross product, or dot product. The result vector R (gold) updates live. Drag to rotate the 3D view.',
        html_code: VECTOR_HTML,
      },
      {
        id: 'calculus-visualiser',
        title: 'Interactive Graph Explorer',
        description: 'All O/A-Level graphs with 9 trig functions, domain restrictions, radian/degree toggle, transformation sliders, tangent lines, 3D volume of revolution, doodle, and infinite canvas.',
        icon: 'TrendingUp',
        gradient: 'from-emerald-500 to-teal-500',
        glowColor: 'rgba(16,185,129,0.35)',
        difficulty: 'Intermediate',
        tags: ['Graphs', 'Trigonometry', 'Calculus', 'Volume of Rotation'],
        instructions: 'Choose from O-Level (linear, quadratic, cubic, 1/x, \\u221ax, |x|), all 9 trig functions (sin, cos, tan, csc, sec, cot, arcsin, arccos, arctan) with domain restriction lines and radian/degree toggle, A-Level (e\\u02e3, ln, x\\u2074, sinc, Gaussian), or parametric curves. Use transformation sliders (a, b, c, d) to see y = a\\u00b7f(b(x-c))+d live. Click on the curve with Tangent mode to draw the tangent line and see slope/angle. Volume mode shows a rotating 3D wireframe preview and computes V = \\u03c0\\u222by\\u00b2dx. Doodle to freehand draw; Points to place and connect coordinates. Reset button centres the view and resets all transforms.',
        html_code: CALCULUS_HTML,
      },
    ],
  },
  {
    id: 'science',
    label: 'Science',
    slug: 'science',
    description: 'Dive into physics and chemistry with hands-on 3D simulations and experiments.',
    icon: 'FlaskConical',
    gradient: 'from-amber-500 to-orange-600',
    glowColor: 'rgba(245,158,11,0.35)',
    heroGradient: 'from-amber-600 via-orange-700 to-red-800',
    simulations: [
      {
        id: 'atomic-structure',
        title: 'Atomic Structure 3D',
        description: 'Explore electron shells, orbitals, and atomic models — from Bohr to quantum mechanical.',
        icon: 'Atom',
        gradient: 'from-amber-500 to-yellow-400',
        glowColor: 'rgba(245,158,11,0.35)',
        difficulty: 'Beginner',
        tags: ['Atoms', 'Electrons', 'Orbitals'],
        instructions: 'Click an element button (H, He, Li, C, Ne, Na) to view its Bohr model. Electrons orbit the nucleus in their respective shells. The display shows proton count and electron configuration.',
        html_code: ATOMIC_HTML,
      },
      {
        id: 'pendulum-lab',
        title: 'Physics Pendulum Lab',
        description: 'Adjust mass, length, and gravity to observe simple harmonic motion and energy conservation.',
        icon: 'Activity',
        gradient: 'from-rose-500 to-pink-500',
        glowColor: 'rgba(244,63,94,0.35)',
        difficulty: 'Intermediate',
        tags: ['SHM', 'Energy', 'Oscillation'],
        instructions: 'Adjust the Length, Gravity, and Damping sliders to change the pendulum behaviour. Watch how kinetic energy (KE), potential energy (PE), and total energy change in real time. Click Reset to restart from the initial angle.',
        html_code: PENDULUM_HTML,
      },
      {
        id: 'chemical-bonding',
        title: 'Chemical Bonding 3D',
        description: 'Build molecules, visualise ionic and covalent bonds, and explore molecular geometry.',
        icon: 'Hexagon',
        gradient: 'from-teal-500 to-emerald-500',
        glowColor: 'rgba(20,184,166,0.35)',
        difficulty: 'Intermediate',
        tags: ['Ionic', 'Covalent', 'Molecular Geometry'],
        instructions: 'Select a molecule (H₂O, CO₂, CH₄, NaCl, NH₃) to view its 3D structure. Atoms are colour-coded by element. Bonds are shown as white lines. Drag to rotate the molecule. The label shows bond type and molecular geometry.',
        html_code: BONDING_HTML,
      },
      {
        id: 'geometric-optics',
        title: 'Geometric Optics Lab',
        description: 'Simulate convex and concave lenses with interactive ray tracing, draggable objects, and real-time image calculations.',
        icon: 'Eye',
        gradient: 'from-cyan-500 to-blue-500',
        glowColor: 'rgba(0,212,255,0.35)',
        difficulty: 'Intermediate',
        tags: ['Lenses', 'Ray Tracing', 'Optics', 'Refraction'],
        instructions: 'Choose a lens type (Convex or Concave) using the toggle. Adjust focal length, object distance, and object height with the sliders or drag the candle on the canvas. Observe how rays bend through the lens and where the image forms. The data panel shows image distance, magnification, and image properties (real/virtual, upright/inverted, magnified/diminished). Click "Run Demo" for an animated walkthrough.',
        html_code: OPTICS_HTML,
      },
    ],
  },
];

/** Flat list of all simulations with their category slug */
export function getAllSimulations() {
  return STEM_CATEGORIES.flatMap((cat) =>
    cat.simulations.map((sim) => ({ ...sim, category: cat.slug })),
  );
}

/** Find a category by slug */
export function getCategoryBySlug(slug: string) {
  return STEM_CATEGORIES.find((c) => c.slug === slug);
}

/** Find a simulation by category + id */
export function getSimulation(categorySlug: string, simId: string) {
  const cat = getCategoryBySlug(categorySlug);
  if (!cat) return null;
  return cat.simulations.find((s) => s.id === simId) ?? null;
}
