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
#right-panel{position:fixed;top:48px;right:0;bottom:0;width:200px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.92);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.rp{padding:10px 10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.rp-title{font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.3);font-weight:700;margin-bottom:6px}
.rp .sg{display:flex;gap:3px;flex-wrap:wrap}
.rp .sg button{padding:5px 9px;font-size:9.5px}
button{padding:7px 13px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;white-space:nowrap}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(59,130,246,0.35);border-color:rgba(59,130,246,0.6);color:#93c5fd;box-shadow:0 0 12px rgba(59,130,246,0.2)}
button.tool-active{background:rgba(16,185,129,0.3);border-color:rgba(16,185,129,0.5);color:#6ee7b7;box-shadow:0 0 12px rgba(16,185,129,0.2)}
#ft{position:fixed;z-index:25;display:flex;gap:3px;padding:6px 8px;background:rgba(15,15,35,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:12px;backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.5)}
#ft .fg{width:6px;display:flex;flex-direction:column;justify-content:center;gap:2px;cursor:grab;padding:0 3px 0 0;margin-right:2px}
#ft .fg span{display:block;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.2)}
#ft .fg:active{cursor:grabbing}
#ft button{padding:6px 10px;font-size:9.5px;border-radius:7px}
#ft .sep{width:1px;background:rgba(255,255,255,0.08);margin:2px 3px}
#pause-badge{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.12);font-size:16px;pointer-events:none;transition:opacity .3s;z-index:5;background:rgba(255,255,255,0.05);padding:8px 20px;border-radius:20px;border:1px solid rgba(255,255,255,0.08);opacity:0}
#draw-hint{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.15);font-size:14px;pointer-events:none;transition:opacity .3s;z-index:5}
@media(max-width:700px){#right-panel{width:160px}}
</style></head><body>
<canvas id="c"></canvas>
<div id="top-bar">
  <div>
    <div id="shape-name">Cube</div>
    <div id="measurements"></div>
  </div>
  <div id="draw-status" style="font-size:11px;color:rgba(255,255,255,0.4)">Click to pause &middot; Drag to rotate &middot; Scroll to zoom</div>
</div>
<div id="draw-hint"></div>
<div id="pause-badge">PAUSED &mdash; click to resume</div>
<!-- Floating toolbar -->
<div id="ft">
  <div class="fg" id="ft-grip"><span></span><span></span><span></span></div>
  <button onclick="toggleWire()" id="b-wire">Wireframe</button>
  <button onclick="toggleDraw()" id="b-draw">Draw Lines</button>
  <button onclick="toggleDoodle()" id="b-doodle">Doodle</button>
  <div class="sep"></div>
  <button onclick="undoAction()" id="b-undo" style="color:rgba(255,255,255,0.35)">Undo</button>
  <button onclick="redoAction()" id="b-redo" style="color:rgba(255,255,255,0.35)">Redo</button>
  <button onclick="clearAll()" id="b-clear">Clear</button>
  <div class="sep"></div>
  <button onclick="resetView()" style="color:#fca5a5;border-color:rgba(239,68,68,0.35)">Reset</button>
</div>
<!-- Right panel with shapes -->
<div id="right-panel">
  <div class="rp"><div class="rp-title">Basic Shapes</div><div class="sg">
    <button onclick="set('cube')" id="b-cube" class="active">Cube</button>
    <button onclick="set('cuboid')" id="b-cuboid">Cuboid</button>
    <button onclick="set('sphere')" id="b-sphere">Sphere</button>
    <button onclick="set('cone')" id="b-cone">Cone</button>
    <button onclick="set('cylinder')" id="b-cylinder">Cylinder</button>
    <button onclick="set('pyramid')" id="b-pyramid">Pyramid</button>
    <button onclick="set('torus')" id="b-torus">Torus</button>
    <button onclick="set('hemisphere')" id="b-hemisphere">Hemisphere</button>
  </div></div>
  <div class="rp"><div class="rp-title">Compound</div><div class="sg">
    <button onclick="set('pyr_cube')" id="b-pyr_cube">Pyramid+Cube</button>
    <button onclick="set('cone_cyl')" id="b-cone_cyl">Cone+Cylinder</button>
    <button onclick="set('cyl_hemi')" id="b-cyl_hemi">Cylinder+Hemi</button>
  </div></div>
  <div class="rp"><div class="rp-title">Nets</div><div class="sg">
    <button onclick="set('net_cube')" id="b-net_cube">Cube Net</button>
    <button onclick="set('net_cyl')" id="b-net_cyl">Cylinder Net</button>
    <button onclick="set('net_cone')" id="b-net_cone">Cone Net</button>
    <button onclick="set('net_pyr')" id="b-net_pyr">Pyramid Net</button>
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
function clearAll(){userLines=[];selectedDot=-1;doodleStrokes=[];currentStroke=null;undoStack=[];redoStack=[];updateUndoUI();}

/* Undo / Redo */
let undoStack=[],redoStack=[];
function pushUndo(type,data){undoStack.push({type,data});redoStack=[];updateUndoUI();}
function undoAction(){
  if(undoStack.length===0)return;
  const act=undoStack.pop();
  if(act.type==='line'){userLines.pop();redoStack.push(act);}
  else if(act.type==='doodle'){const s=doodleStrokes.pop();redoStack.push({type:'doodle',data:s});}
  updateUndoUI();
}
function redoAction(){
  if(redoStack.length===0)return;
  const act=redoStack.pop();
  if(act.type==='line'){userLines.push(act.data);undoStack.push(act);}
  else if(act.type==='doodle'){doodleStrokes.push(act.data);undoStack.push(act);}
  updateUndoUI();
}
function updateUndoUI(){
  document.getElementById('b-undo').style.color=undoStack.length?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.25)';
  document.getElementById('b-redo').style.color=redoStack.length?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.25)';
}

/* Reset view */
function resetView(){rotX=0.4;rotY=0.6;zoom=220;paused=false;updateStatus();}

/* Floating toolbar drag */
(function(){
  const tb=document.getElementById('ft'),grip=document.getElementById('ft-grip');
  let dx=0,dy=0,isDrag=false;
  tb.style.top='56px';tb.style.left='50%';tb.style.transform='translateX(-50%)';
  grip.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();isDrag=true;const r=tb.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top;tb.style.transform='none';grip.setPointerCapture(e.pointerId)});
  grip.addEventListener('pointermove',e=>{if(!isDrag)return;e.preventDefault();tb.style.left=Math.max(0,e.clientX-dx)+'px';tb.style.top=Math.max(48,e.clientY-dy)+'px'});
  grip.addEventListener('pointerup',()=>{isDrag=false});
})();

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
        const line=[selectedDot,dot];userLines.push(line);pushUndo('line',line);selectedDot=-1;
        document.getElementById('draw-hint').style.opacity='0';
      }else{selectedDot=dot;document.getElementById('draw-hint').textContent='Now click another dot';}
    }else{selectedDot=-1;document.getElementById('draw-hint').textContent='Click any vertex dot to connect';}
    return;
  }
  drag=true;lx=e.clientX;ly=e.clientY;
});
addEventListener('mouseup',e=>{
  if(doodleMode&&currentStroke){
    if(currentStroke.pts.length>1){doodleStrokes.push(currentStroke);pushUndo('doodle',currentStroke);}
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
    if(dot>=0){if(selectedDot>=0&&selectedDot!==dot){const line=[selectedDot,dot];userLines.push(line);pushUndo('line',line);selectedDot=-1;}else{selectedDot=dot;}}
    return;
  }
  if(e.touches.length===1){drag=true;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}
},{passive:true});
addEventListener('touchend',()=>{
  if(doodleMode&&currentStroke){if(currentStroke.pts.length>1){doodleStrokes.push(currentStroke);pushUndo('doodle',currentStroke);}currentStroke=null;return;}
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
/* Parent message handler */
addEventListener('message',e=>{
  if(!e.data||!e.data.type)return;
  if(e.data.type==='resetCanvas'){resetView();}
  if(e.data.type==='resetGraph'){set('cube');}
  if(e.data.type==='selectAll'){}
});
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
#right-panel{position:fixed;top:48px;right:0;bottom:0;width:210px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.92);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.panel{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:10px;line-height:1.7;min-width:0;max-width:none}
.panel .lbl{color:rgba(255,255,255,0.4);font-size:8px;text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:2px}
.panel .val{color:#a78bfa;font-weight:700;font-family:'Courier New',monospace;font-size:11px}
.panel input[type=range]{width:100%;height:4px;-webkit-appearance:none;background:rgba(255,255,255,0.1);border-radius:2px;outline:none;margin:2px 0}
.panel input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#6366f1;cursor:pointer;border:2px solid rgba(255,255,255,0.3)}
.panel input[type=number]{width:46px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:4px;padding:2px 4px;font-size:10px}
.panel select{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);color:#fff;border-radius:4px;padding:2px 4px;font-size:10px}
#hint{position:fixed;top:50%;left:calc((100% - 210px)/2);transform:translate(-50%,-50%);color:rgba(255,255,255,0.08);font-size:14px;pointer-events:none;z-index:5}
.rp-title{font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.3);font-weight:700;margin-bottom:6px}
.rp-graphs{display:flex;gap:3px;flex-wrap:wrap}
.rp-graphs button{padding:4px 7px;font-size:9px}
#calc-ft{position:fixed;z-index:25;display:flex;gap:3px;padding:6px 8px;background:rgba(15,15,35,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:12px;backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.5)}
#calc-ft .fg{width:6px;display:flex;flex-direction:column;justify-content:center;gap:2px;cursor:grab;padding:0 3px 0 0;margin-right:2px}
#calc-ft .fg span{display:block;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.2)}
#calc-ft .fg:active{cursor:grabbing}
#calc-ft button{padding:6px 10px;font-size:9.5px;border-radius:7px}
#calc-ft .sep{width:1px;background:rgba(255,255,255,0.08);margin:2px 3px}
@media(max-width:700px){#right-panel{width:170px}}
button{padding:4px 8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.65);border-radius:6px;cursor:pointer;font-size:9px;font-weight:600;transition:all .2s;white-space:nowrap}
button:hover{background:rgba(255,255,255,0.12);color:#fff}
button.on{background:rgba(59,130,246,0.3);border-color:rgba(59,130,246,0.5);color:#93c5fd;box-shadow:0 0 8px rgba(59,130,246,0.15)}
button.tool{background:rgba(16,185,129,0.25);border-color:rgba(16,185,129,0.4);color:#6ee7b7;box-shadow:0 0 8px rgba(16,185,129,0.15)}
button.rst{background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.4);color:#fca5a5}
.tang-dot{position:fixed;width:12px;height:12px;border-radius:50%;background:#ef4444;border:2px solid rgba(255,255,255,0.5);transform:translate(-50%,-50%);pointer-events:none;z-index:25;display:none;box-shadow:0 0 8px rgba(239,68,68,0.5)}
#vol3d{position:fixed;top:50px;left:10px;z-index:20;display:none}
#vol3d canvas{border-radius:12px;border:1px solid rgba(167,139,250,0.3);background:rgba(5,5,20,0.92);box-shadow:0 0 20px rgba(167,139,250,0.15)}
#vol3d-bar{display:flex;gap:4px;margin-top:4px;justify-content:center}
#vol3d-bar button{padding:3px 10px;font-size:9px;border:1px solid rgba(167,139,250,0.3);background:rgba(167,139,250,0.12);color:#c4b5fd;border-radius:6px;cursor:pointer}
#vol3d-bar button:hover{background:rgba(167,139,250,0.25)}
#vol3d-bar button.active{background:rgba(167,139,250,0.35);color:#fff}
</style></head><body>
<canvas id="c"></canvas>
<div id="top-bar">
  <div><div id="fn-label">Quadratic</div><div id="fn-eq">y = x&sup2;</div></div>
  <div style="font-size:9px;color:rgba(255,255,255,0.3);text-align:right;line-height:1.5">Drag to pan &middot; Scroll to zoom<br>Click graph for tangent line</div>
</div>
<div id="coord-badge"></div>
<div class="tang-dot" id="tang-dot"></div>
<div id="vol3d">
  <canvas id="c3d" width="280" height="280"></canvas>
  <div id="vol3d-bar">
    <button onclick="vol3dPlayPause()" id="vol3d-pp" class="active">&#9646;&#9646; Pause</button>
    <button onclick="vol3dRotL()">&larr; Rotate</button>
    <button onclick="vol3dRotR()">Rotate &rarr;</button>
    <button onclick="vol3dReset()">Reset</button>
  </div>
</div>
<!-- Floating toolbar -->
<div id="calc-ft">
  <div class="fg" id="cft-grip"><span></span><span></span><span></span></div>
  <button onclick="togDeriv()" id="b-deriv">f&prime;(x)</button>
  <button onclick="togInteg()" id="b-integ">&int; dx</button>
  <button onclick="togVol()" id="b-vol">Volume</button>
  <button onclick="togTangent()" id="b-tang">Tangent</button>
  <div class="sep"></div>
  <button onclick="togDoodle()" id="b-doodle">Doodle</button>
  <button onclick="togPoints()" id="b-pts">Points</button>
  <div class="sep"></div>
  <button onclick="calcUndo()" id="b-cundo" style="color:rgba(255,255,255,0.35)">Undo</button>
  <button onclick="calcRedo()" id="b-credo" style="color:rgba(255,255,255,0.35)">Redo</button>
  <button onclick="clearAll()">Clear</button>
  <div class="sep"></div>
  <button onclick="resetView()" style="color:#fca5a5;border-color:rgba(239,68,68,0.35)">Reset</button>
</div>
<div id="right-panel">
  <!-- Graph categories -->
  <div class="panel"><div class="rp-title">Linear &amp; Quadratic</div><div class="rp-graphs">
    <button onclick="pick('linear')" id="b-linear">y = mx+c</button>
    <button onclick="pick('quadratic')" id="b-quadratic" class="on">y = x&sup2;</button>
    <button onclick="pick('quad2')" id="b-quad2">x&sup2;&minus;4</button>
    <button onclick="pick('reciprocal')" id="b-reciprocal">1/x</button>
    <button onclick="pick('sqrt')" id="b-sqrt">&radic;x</button>
    <button onclick="pick('abs')" id="b-abs">|x|</button>
  </div></div>
  <div class="panel"><div class="rp-title">Cubic</div><div class="rp-graphs">
    <button onclick="pick('cubic')" id="b-cubic">x&sup3;</button>
    <button onclick="pick('cubic2')" id="b-cubic2">x&sup3;&minus;3x</button>
    <button onclick="pick('cubic3')" id="b-cubic3">x&sup3;&minus;x</button>
    <button onclick="pick('cubic4')" id="b-cubic4">(x&minus;1)(x&minus;2)(x&minus;3)</button>
    <button onclick="pick('cubic5')" id="b-cubic5">x&sup3;+x</button>
    <button onclick="pick('cubic6')" id="b-cubic6">&minus;x&sup3;</button>
    <button onclick="pick('x4')" id="b-x4">x&#8308;</button>
  </div></div>
  <div class="panel"><div class="rp-title">Trigonometric</div><div class="rp-graphs">
    <button onclick="pick('sin')" id="b-sin">sin</button>
    <button onclick="pick('cos')" id="b-cos">cos</button>
    <button onclick="pick('tan')" id="b-tan">tan</button>
    <button onclick="pick('csc')" id="b-csc">csc</button>
    <button onclick="pick('sec')" id="b-sec">sec</button>
    <button onclick="pick('cot')" id="b-cot">cot</button>
  </div></div>
  <div class="panel"><div class="rp-title">Inverse Trig</div><div class="rp-graphs">
    <button onclick="pick('asin')" id="b-asin">sin<sup>&minus;1</sup></button>
    <button onclick="pick('acos')" id="b-acos">cos<sup>&minus;1</sup></button>
    <button onclick="pick('atan')" id="b-atan">tan<sup>&minus;1</sup></button>
  </div></div>
  <div class="panel"><div class="rp-title">Exp &amp; Log</div><div class="rp-graphs">
    <button onclick="pick('exp')" id="b-exp">e<sup>x</sup></button>
    <button onclick="pick('ln')" id="b-ln">ln(x)</button>
    <button onclick="pick('sinc')" id="b-sinc">sinc</button>
    <button onclick="pick('gauss')" id="b-gauss">Gauss</button>
  </div></div>
  <div class="panel"><div class="rp-title">Parametric</div><div class="rp-graphs">
    <button onclick="pick('circle')" id="b-circle">Circle</button>
    <button onclick="pick('parabola')" id="b-parabola">x=y&sup2;</button>
    <button onclick="pick('hyperbola')" id="b-hyperbola">Hyperbola</button>
    <button onclick="pick('ellipse')" id="b-ellipse">Ellipse</button>
  </div></div>
  <!-- Transform/settings panels -->
  <div class="panel" id="p-transform">
    <div class="lbl" style="color:#f472b6">&#9645; Reflection</div>
    <div style="display:flex;gap:4px;margin:4px 0 6px">
      <button onclick="togRefX()" id="b-refx" style="flex:1;font-size:9px">x-axis</button>
      <button onclick="togRefY()" id="b-refy" style="flex:1;font-size:9px">y-axis</button>
      <button onclick="togRefO()" id="b-refo" style="flex:1;font-size:9px">y = x</button>
    </div>
    <div class="lbl" style="color:#60a5fa">&#8644; Translation</div>
    <div style="display:grid;grid-template-columns:50px 1fr 30px;align-items:center;gap:2px;margin:4px 0 6px">
      <span style="font-size:9px">&harr; Horiz</span><input type="range" id="sl-tx" min="-10" max="10" step="0.1" value="0"><span id="v-tx" style="font-size:9px">0</span>
      <span style="font-size:9px">&varr; Vert</span><input type="range" id="sl-ty" min="-10" max="10" step="0.1" value="0"><span id="v-ty" style="font-size:9px">0</span>
    </div>
    <div class="lbl" style="color:#a78bfa">&#8596; Stretch</div>
    <div style="display:grid;grid-template-columns:50px 1fr 30px;align-items:center;gap:2px;margin:4px 0 2px">
      <span style="font-size:9px">&harr; x-str</span><input type="range" id="sl-sx" min="0.1" max="5" step="0.1" value="1"><span id="v-sx" style="font-size:9px">1</span>
      <span style="font-size:9px">&varr; y-str</span><input type="range" id="sl-sy" min="0.1" max="5" step="0.1" value="1"><span id="v-sy" style="font-size:9px">1</span>
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
    <div style="font-size:9px">V = &pi; &int; y&sup2; dx</div>
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

function resize(){W=cv.width=innerWidth;H=cv.height=innerHeight;if(oX===undefined){oX=W/2;oY=H/2;sc=Math.min(W,H)/40;}}
resize();addEventListener('resize',()=>{W=cv.width=innerWidth;H=cv.height=innerHeight;});

/* ── Angle conversion ── */
function toRad(x){return unit==='deg'?x*DEG:x;}
function fromRad(x){return unit==='deg'?x/DEG:x;}

/* ── Graph definitions ── */
const TRIG_SET=new Set(['sin','cos','tan','csc','sec','cot','asin','acos','atan']);
const G={
  linear:{fn:x=>x,deriv:x=>1,label:'Linear',eq:'y = x',color:'#3b82f6'},
  quadratic:{fn:x=>x*x,deriv:x=>2*x,label:'Quadratic',eq:'y = x\xb2',color:'#10b981'},
  quad2:{fn:x=>x*x-4,deriv:x=>2*x,label:'Quadratic',eq:'y = x\xb2 \u2212 4',color:'#059669'},
  cubic:{fn:x=>x*x*x,deriv:x=>3*x*x,label:'Cubic',eq:'y = x\xb3',color:'#8b5cf6'},
  cubic2:{fn:x=>x*x*x-3*x,deriv:x=>3*x*x-3,label:'Cubic (2 turning pts)',eq:'y = x\xb3 \u2212 3x',color:'#7c3aed'},
  cubic3:{fn:x=>x*x*x-x,deriv:x=>3*x*x-1,label:'Cubic (3 roots)',eq:'y = x\xb3 \u2212 x',color:'#6d28d9'},
  cubic4:{fn:x=>(x-1)*(x-2)*(x-3),deriv:x=>3*x*x-12*x+11,label:'Cubic (roots 1,2,3)',eq:'y = (x\u22121)(x\u22122)(x\u22123)',color:'#5b21b6'},
  cubic5:{fn:x=>x*x*x+x,deriv:x=>3*x*x+1,label:'Cubic (monotonic)',eq:'y = x\xb3 + x',color:'#4c1d95'},
  cubic6:{fn:x=>-x*x*x,deriv:x=>-3*x*x,label:'Cubic (negative)',eq:'y = \u2212x\xb3',color:'#a855f7'},
  reciprocal:{fn:x=>Math.abs(x)<0.02?NaN:1/x,deriv:x=>-1/(x*x),label:'Reciprocal',eq:'y = 1/x',color:'#f59e0b'},
  sqrt:{fn:x=>x>=0?Math.sqrt(x):NaN,deriv:x=>x>0.001?0.5/Math.sqrt(x):NaN,label:'Square Root',eq:'y = \u221ax',color:'#ec4899'},
  abs:{fn:x=>Math.abs(x),deriv:x=>x>0?1:x<0?-1:0,label:'Modulus',eq:'y = |x|',color:'#06b6d4'},
  sin:{fn:x=>Math.sin(toRad(x)),deriv:x=>(unit==='deg'?DEG:1)*Math.cos(toRad(x)),label:'Sine',eq:'y = sin(x)',color:'#10b981',trig:true,domain:'All reals',range:'[\u22121, 1]'},
  cos:{fn:x=>Math.cos(toRad(x)),deriv:x=>-(unit==='deg'?DEG:1)*Math.sin(toRad(x)),label:'Cosine',eq:'y = cos(x)',color:'#6366f1',trig:true,domain:'All reals',range:'[\u22121, 1]'},
  tan:{fn:x=>{const v=Math.tan(toRad(x));return Math.abs(v)>80?NaN:v;},deriv:x=>{const c=Math.cos(toRad(x));return Math.abs(c)<0.01?NaN:(unit==='deg'?DEG:1)/(c*c);},label:'Tangent',eq:'y = tan(x)',color:'#f97316',trig:true,domain:unit==='deg'?'x \u2260 90\xb0n':'x \u2260 \u03c0/2 + n\u03c0',range:'(\u2212\u221e, \u221e)'},
  csc:{fn:x=>{const s=Math.sin(toRad(x));return Math.abs(s)<0.02?NaN:1/s;},deriv:x=>{const s=Math.sin(toRad(x)),c=Math.cos(toRad(x));return Math.abs(s)<0.02?NaN:-(unit==='deg'?DEG:1)*c/(s*s);},label:'Cosecant',eq:'y = csc(x)',color:'#f472b6',trig:true,domain:unit==='deg'?'x \u2260 180\xb0n':'x \u2260 n\u03c0',range:'(\u2212\u221e,\u22121] \u222a [1,\u221e)'},
  sec:{fn:x=>{const c=Math.cos(toRad(x));return Math.abs(c)<0.02?NaN:1/c;},deriv:x=>{const s=Math.sin(toRad(x)),c=Math.cos(toRad(x));return Math.abs(c)<0.02?NaN:(unit==='deg'?DEG:1)*s/(c*c);},label:'Secant',eq:'y = sec(x)',color:'#a78bfa',trig:true,domain:unit==='deg'?'x \u2260 90\xb0+180\xb0n':'x \u2260 \u03c0/2 + n\u03c0',range:'(\u2212\u221e,\u22121] \u222a [1,\u221e)'},
  cot:{fn:x=>{const s=Math.sin(toRad(x));return Math.abs(s)<0.02?NaN:Math.cos(toRad(x))/s;},deriv:x=>{const s=Math.sin(toRad(x));return Math.abs(s)<0.02?NaN:-(unit==='deg'?DEG:1)/(s*s);},label:'Cotangent',eq:'y = cot(x)',color:'#22d3ee',trig:true,domain:unit==='deg'?'x \u2260 180\xb0n':'x \u2260 n\u03c0',range:'(\u2212\u221e, \u221e)'},
  asin:{fn:x=>Math.abs(x)>1?NaN:fromRad(Math.asin(x)),deriv:x=>Math.abs(x)>=1?NaN:fromRad(1/Math.sqrt(1-x*x)),label:'Arcsine',eq:'y = sin\u207b\xb9(x)',color:'#34d399',trig:true,domain:'[\u22121, 1]',range:unit==='deg'?'[\u221290\xb0, 90\xb0]':'[\u2212\u03c0/2, \u03c0/2]'},
  acos:{fn:x=>Math.abs(x)>1?NaN:fromRad(Math.acos(x)),deriv:x=>Math.abs(x)>=1?NaN:fromRad(-1/Math.sqrt(1-x*x)),label:'Arccosine',eq:'y = cos\u207b\xb9(x)',color:'#fb923c',trig:true,domain:'[\u22121, 1]',range:unit==='deg'?'[0\xb0, 180\xb0]':'[0, \u03c0]'},
  atan:{fn:x=>fromRad(Math.atan(x)),deriv:x=>fromRad(1/(1+x*x)),label:'Arctangent',eq:'y = tan\u207b\xb9(x)',color:'#c084fc',trig:true,domain:'All reals',range:unit==='deg'?'(\u221290\xb0, 90\xb0)':'(\u2212\u03c0/2, \u03c0/2)'},
  exp:{fn:x=>{const v=Math.exp(x);return v>1e6?NaN:v;},deriv:x=>{const v=Math.exp(x);return v>1e6?NaN:v;},label:'Exponential',eq:'y = e\u02e3',color:'#ef4444'},
  ln:{fn:x=>x>0?Math.log(x):NaN,deriv:x=>x>0?1/x:NaN,label:'Natural Log',eq:'y = ln(x)',color:'#14b8a6'},
  x4:{fn:x=>x*x*x*x,deriv:x=>4*x*x*x,label:'Quartic',eq:'y = x\u2074',color:'#a855f7'},
  sinc:{fn:x=>Math.abs(x)<0.001?1:Math.sin(x)/x,deriv:x=>Math.abs(x)<0.001?0:(Math.cos(x)*x-Math.sin(x))/(x*x),label:'Sinc',eq:'y = sin(x)/x',color:'#22d3ee'},
  gauss:{fn:x=>Math.exp(-x*x),deriv:x=>-2*x*Math.exp(-x*x),label:'Gaussian',eq:'y = e\u207b\u02e3\xb2',color:'#f472b6'},
  circle:{param:true,label:'Unit Circle',eq:'x\xb2 + y\xb2 = 4',color:'#fbbf24'},
  parabola:{param:true,label:'Sideways Parabola',eq:'x = y\xb2',color:'#34d399'},
  hyperbola:{param:true,label:'Hyperbola',eq:'x\xb2/4 \u2212 y\xb2 = 1',color:'#fb923c'},
  ellipse:{param:true,label:'Ellipse',eq:'x\xb2/9 + y\xb2/4 = 1',color:'#c084fc'},
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
  document.querySelectorAll('#right-panel .rp-graphs button').forEach(b=>b.classList.remove('on'));
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
function clearAll(){doodleStrokes=[];curStroke=null;userPts=[];selectedPt=-1;tangentX=null;calcUndoStack=[];calcRedoStack=[];updateCalcUndoUI();document.getElementById('tang-dot').style.display='none';}

/* Undo / Redo for doodle and points */
let calcUndoStack=[],calcRedoStack=[];
function calcPushUndo(type,data){calcUndoStack.push({type,data});calcRedoStack=[];updateCalcUndoUI();}
function calcUndo(){
  if(calcUndoStack.length===0)return;
  const a=calcUndoStack.pop();
  if(a.type==='doodle'){doodleStrokes.pop();calcRedoStack.push(a);}
  else if(a.type==='point'){userPts.pop();calcRedoStack.push(a);}
  updateCalcUndoUI();
}
function calcRedo(){
  if(calcRedoStack.length===0)return;
  const a=calcRedoStack.pop();
  if(a.type==='doodle'){doodleStrokes.push(a.data);calcUndoStack.push(a);}
  else if(a.type==='point'){userPts.push(a.data);calcUndoStack.push(a);}
  updateCalcUndoUI();
}
function updateCalcUndoUI(){
  document.getElementById('b-cundo').style.color=calcUndoStack.length?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.25)';
  document.getElementById('b-credo').style.color=calcRedoStack.length?'rgba(255,255,255,0.7)':'rgba(255,255,255,0.25)';
}

function resetView(){
  sc=Math.min(W,H)/40;oX=W/2;oY=H/2;
  resetSliders();tangentX=null;
  document.getElementById('tang-dot').style.display='none';
  const g=G[curFn];
  document.getElementById('fn-eq').textContent=g.param?g.eq:g.eq;
  calcVol();
}

/* Floating toolbar drag */
(function(){
  const tb=document.getElementById('calc-ft'),grip=document.getElementById('cft-grip');
  let dx=0,dy=0,isDrag=false;
  tb.style.top='56px';tb.style.left='50%';tb.style.transform='translateX(-50%)';
  grip.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();isDrag=true;const r=tb.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top;tb.style.transform='none';grip.setPointerCapture(e.pointerId)});
  grip.addEventListener('pointermove',e=>{if(!isDrag)return;e.preventDefault();tb.style.left=Math.max(0,e.clientX-dx)+'px';tb.style.top=Math.max(48,e.clientY-dy)+'px'});
  grip.addEventListener('pointerup',()=>{isDrag=false});
})();

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
let rot3d=0,vol3dPlaying=true,vol3dAnimId=null;
function vol3dPlayPause(){
  vol3dPlaying=!vol3dPlaying;
  const btn=document.getElementById('vol3d-pp');
  btn.textContent=vol3dPlaying?'\\u23f8 Pause':'\\u25b6 Play';
  btn.classList.toggle('active',vol3dPlaying);
  if(vol3dPlaying&&showVol){const fn=getTransFn();if(fn){const a=parseFloat(document.getElementById('inp-a').value)||-2,b=parseFloat(document.getElementById('inp-b').value)||2;draw3DVol(fn,a,b);}}
}
function vol3dRotL(){rot3d-=0.3;if(!vol3dPlaying&&showVol){const fn=getTransFn();if(fn){const a=parseFloat(document.getElementById('inp-a').value)||-2,b=parseFloat(document.getElementById('inp-b').value)||2;draw3DVol(fn,a,b);}}}
function vol3dRotR(){rot3d+=0.3;if(!vol3dPlaying&&showVol){const fn=getTransFn();if(fn){const a=parseFloat(document.getElementById('inp-a').value)||-2,b=parseFloat(document.getElementById('inp-b').value)||2;draw3DVol(fn,a,b);}}}
function vol3dReset(){rot3d=0;if(!vol3dPlaying&&showVol){const fn=getTransFn();if(fn){const a=parseFloat(document.getElementById('inp-a').value)||-2,b=parseFloat(document.getElementById('inp-b').value)||2;draw3DVol(fn,a,b);}}}
function draw3DVol(fn,a,b){
  const w=280,h=280;cx3.fillStyle='rgba(5,5,20,0.95)';cx3.fillRect(0,0,w,h);
  const cx0=w/2,cy0=h/2,s3=30,tilt=0.4;
  const cosT=Math.cos(tilt),sinT=Math.sin(tilt);
  if(vol3dPlaying)rot3d+=0.015;const cosR=Math.cos(rot3d),sinR=Math.sin(rot3d);
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

  if(showVol&&vol3dPlaying)requestAnimationFrame(()=>draw3DVol(fn,a,b));
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
    const[mx,my]=toMath(e.clientX,e.clientY);userPts.push([mx,my]);calcPushUndo('point',[mx,my]);selectedPt=userPts.length-1;showPtCoord(selectedPt);return;
  }
  dragging=true;lx=e.clientX;ly=e.clientY;
});
addEventListener('mouseup',e=>{
  if(doodleMode&&curStroke){if(curStroke.pts.length>1){doodleStrokes.push(curStroke);calcPushUndo('doodle',curStroke);}curStroke=null;return;}
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
  if(pointMode&&e.touches.length===1){const t=e.touches[0];const[mx,my]=toMath(t.clientX,t.clientY);userPts.push([mx,my]);calcPushUndo('point',[mx,my]);selectedPt=userPts.length-1;showPtCoord(selectedPt);return;}
  if(e.touches.length===1){dragging=true;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}
},{passive:true});
addEventListener('touchend',()=>{if(doodleMode&&curStroke){if(curStroke.pts.length>1){doodleStrokes.push(curStroke);calcPushUndo('doodle',curStroke);}curStroke=null;}dragging=false;});
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
/* Parent message handler */
addEventListener('message',e=>{
  if(!e.data||!e.data.type)return;
  if(e.data.type==='resetCanvas'){resetView();}
  if(e.data.type==='resetGraph'){resetView();pick('quadratic');}
  if(e.data.type==='selectAll'){}
});
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

// ── Newton's Laws ───────────────────────────────────────────────────────────
const NEWTON_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;user-select:none;color:#fff}
canvas{display:block}
#ui{position:fixed;top:48px;right:0;bottom:0;width:210px;z-index:20;background:rgba(15,15,35,0.92);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;display:flex;flex-direction:column}
#ui::-webkit-scrollbar{width:4px}#ui::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.pn{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06)}
.pn-t{font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.3);font-weight:700;margin-bottom:6px}
.pn button{display:block;width:100%;padding:7px;margin-bottom:4px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);border-radius:7px;cursor:pointer;font-size:10px;font-weight:600;text-align:left;transition:all .2s}
.pn button:hover{background:rgba(255,255,255,0.1);color:#fff}
.pn button.on{background:rgba(59,130,246,0.3);border-color:rgba(59,130,246,0.5);color:#93c5fd}
.sl-row{display:flex;align-items:center;gap:4px;margin:4px 0}
.sl-row label{font-size:9px;color:rgba(255,255,255,0.4);min-width:40px}
.sl-row input[type=range]{flex:1;height:4px;-webkit-appearance:none;background:rgba(255,255,255,0.1);border-radius:2px;outline:none}
.sl-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#3b82f6;cursor:pointer}
.sl-row span{font-size:9px;color:rgba(255,255,255,0.6);min-width:30px;text-align:right;font-weight:600}
#info{position:fixed;bottom:8px;left:8px;z-index:20;background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 12px;font-size:10px;line-height:1.6;backdrop-filter:blur(8px);max-width:280px}
#info .val{color:#60a5fa;font-weight:700;font-family:'Courier New',monospace}
@media(max-width:700px){#ui{width:170px}}
</style></head><body>
<canvas id="c"></canvas>
<div id="ui">
  <div class="pn"><div class="pn-t">Newton's Laws</div>
    <button class="on" onclick="setLaw(1)" id="l1">1st Law — Inertia</button>
    <button onclick="setLaw(2)" id="l2">2nd Law — F = ma</button>
    <button onclick="setLaw(3)" id="l3">3rd Law — Action-Reaction</button>
  </div>
  <div class="pn" id="p-controls">
    <div class="pn-t">Controls</div>
    <div class="sl-row"><label>Force</label><input type="range" id="sl-f" min="0" max="100" value="0"><span id="v-f">0 N</span></div>
    <div class="sl-row"><label>Mass</label><input type="range" id="sl-m" min="1" max="20" value="5"><span id="v-m">5 kg</span></div>
    <div class="sl-row"><label>Friction</label><input type="range" id="sl-mu" min="0" max="0.5" step="0.01" value="0"><span id="v-mu">0</span></div>
  </div>
  <div class="pn"><button onclick="resetSim()" style="text-align:center;color:#fca5a5;border-color:rgba(239,68,68,0.3)">Reset</button>
    <button onclick="playpause()" id="b-pp" style="text-align:center;color:#6ee7b7;border-color:rgba(16,185,129,0.3)">&#9654; Play</button>
  </div>
</div>
<div id="info"></div>
<script>
const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,H,law=1,running=false,t=0,dt=1/60;
let force=0,mass=5,mu=0,vel=0,pos=0,acc=0;
// Law 3 state
let rocketX=0,rocketV=0,gasParticles=[];

function resize(){W=C.width=innerWidth;H=C.height=innerHeight}
resize();addEventListener('resize',resize);

function setLaw(n){law=n;document.querySelectorAll('#ui .pn:first-child button').forEach(b=>b.classList.remove('on'));document.getElementById('l'+n).classList.add('on');resetSim();}

document.getElementById('sl-f').oninput=e=>{force=+e.target.value;document.getElementById('v-f').textContent=force+' N'};
document.getElementById('sl-m').oninput=e=>{mass=+e.target.value;document.getElementById('v-m').textContent=mass+' kg'};
document.getElementById('sl-mu').oninput=e=>{mu=+e.target.value;document.getElementById('v-mu').textContent=mu.toFixed(2)};

function resetSim(){vel=0;pos=0;acc=0;t=0;rocketX=0;rocketV=0;gasParticles=[];running=false;document.getElementById('b-pp').innerHTML='&#9654; Play'}
function playpause(){running=!running;document.getElementById('b-pp').innerHTML=running?'&#9646;&#9646; Pause':'&#9654; Play'}

function draw(){
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  const cw=W-210,ch=H;
  // Ground
  const gy=ch*0.7;
  ctx.fillStyle='rgba(255,255,255,0.03)';ctx.fillRect(0,gy,cw,ch-gy);
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(cw,gy);ctx.stroke();

  if(law===1) drawLaw1(cw,gy);
  else if(law===2) drawLaw2(cw,gy);
  else drawLaw3(cw,gy);

  if(running) t+=dt;
  requestAnimationFrame(draw);
}

function drawLaw1(cw,gy){
  // Block on frictionless surface — stays still or constant velocity
  const bw=80,bh=60;
  if(running&&force===0&&mu===0){pos+=vel*dt*50;}
  if(running&&force>0){vel=force/mass;pos+=vel*dt*50;}
  const bx=cw/2-bw/2+pos%cw;
  // Block
  ctx.fillStyle='rgba(59,130,246,0.3)';ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;
  ctx.fillRect(bx,gy-bh,bw,bh);ctx.strokeRect(bx,gy-bh,bw,bh);
  ctx.fillStyle='#fff';ctx.font='bold 12px system-ui';ctx.textAlign='center';
  ctx.fillText(mass+' kg',bx+bw/2,gy-bh/2+4);
  // Force arrow
  if(force>0){
    const aw=force*1.5;
    ctx.strokeStyle='#ef4444';ctx.lineWidth=3;ctx.beginPath();
    ctx.moveTo(bx-10,gy-bh/2);ctx.lineTo(bx-10-aw,gy-bh/2);ctx.stroke();
    ctx.fillStyle='#ef4444';ctx.beginPath();ctx.moveTo(bx-10,gy-bh/2);ctx.lineTo(bx-20,gy-bh/2-8);ctx.lineTo(bx-20,gy-bh/2+8);ctx.fill();
    ctx.fillStyle='#ef4444';ctx.font='bold 11px system-ui';ctx.textAlign='center';
    ctx.fillText('F = '+force+' N',bx-10-aw/2,gy-bh/2-15);
  }
  // Velocity arrow
  if(Math.abs(vel)>0.1){
    ctx.strokeStyle='#10b981';ctx.lineWidth=3;const vw=vel*20;
    ctx.beginPath();ctx.moveTo(bx+bw+10,gy-bh/2);ctx.lineTo(bx+bw+10+vw,gy-bh/2);ctx.stroke();
    ctx.fillStyle='#10b981';ctx.beginPath();ctx.moveTo(bx+bw+10+vw,gy-bh/2);ctx.lineTo(bx+bw+vw,gy-bh/2-8);ctx.lineTo(bx+bw+vw,gy-bh/2+8);ctx.fill();
    ctx.fillStyle='#10b981';ctx.font='10px system-ui';ctx.fillText('v = '+vel.toFixed(1)+' m/s',bx+bw+10+vw/2,gy-bh/2-12);
  }
  // Title
  ctx.fillStyle='rgba(255,255,255,0.15)';ctx.font='bold 18px system-ui';ctx.textAlign='center';
  ctx.fillText("Newton's 1st Law: An object at rest stays at rest",cw/2,60);
  ctx.font='14px system-ui';ctx.fillText("unless acted upon by an external force",cw/2,85);
  // Info
  document.getElementById('info').innerHTML='<b style="color:#93c5fd">1st Law — Inertia</b><br>Velocity: <span class="val">'+vel.toFixed(2)+' m/s</span><br>Position: <span class="val">'+pos.toFixed(1)+' m</span><br>'+(force===0&&vel===0?'<span style="color:#10b981">Object at rest — no net force</span>':'<span style="color:#f59e0b">Object in motion — constant velocity</span>');
}

function drawLaw2(cw,gy){
  const bw=60+mass*3,bh=40+mass*2;
  const friction=mu*mass*9.8;
  const netF=Math.max(0,force-friction);
  acc=netF/mass;
  if(running){vel+=acc*dt;pos+=vel*dt*30;}
  const bx=cw/2-bw/2+(pos%cw);
  ctx.fillStyle='rgba(139,92,246,0.3)';ctx.strokeStyle='#8b5cf6';ctx.lineWidth=2;
  ctx.fillRect(bx,gy-bh,bw,bh);ctx.strokeRect(bx,gy-bh,bw,bh);
  ctx.fillStyle='#fff';ctx.font='bold 11px system-ui';ctx.textAlign='center';
  ctx.fillText(mass+' kg',bx+bw/2,gy-bh/2+4);
  // Force arrows
  if(force>0){const aw=force*1.2;ctx.strokeStyle='#ef4444';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(bx+bw+5,gy-bh/2);ctx.lineTo(bx+bw+5+aw,gy-bh/2);ctx.stroke();ctx.fillStyle='#ef4444';ctx.font='10px system-ui';ctx.fillText('F='+force+'N',bx+bw+5+aw/2,gy-bh/2-10);}
  if(friction>0.1){const fw=friction*1.2;ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(bx-5,gy-bh/2);ctx.lineTo(bx-5-fw,gy-bh/2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#f59e0b';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText('f='+friction.toFixed(1)+'N',bx-5-fw/2,gy-bh/2-10);}
  // a vector
  if(acc>0.01){ctx.strokeStyle='#10b981';ctx.lineWidth=2;const aw2=acc*15;ctx.beginPath();ctx.moveTo(bx+bw/2,gy-bh-10);ctx.lineTo(bx+bw/2+aw2,gy-bh-10);ctx.stroke();ctx.fillStyle='#10b981';ctx.font='9px system-ui';ctx.fillText('a='+acc.toFixed(2)+' m/s\\xb2',bx+bw/2+aw2/2,gy-bh-20);}
  ctx.fillStyle='rgba(255,255,255,0.15)';ctx.font='bold 18px system-ui';ctx.textAlign='center';
  ctx.fillText("Newton's 2nd Law: F = ma",cw/2,60);
  ctx.font='14px system-ui';ctx.fillText("Acceleration is proportional to net force, inversely to mass",cw/2,85);
  document.getElementById('info').innerHTML='<b style="color:#a78bfa">2nd Law — F = ma</b><br>Net Force: <span class="val">'+netF.toFixed(1)+' N</span><br>Acceleration: <span class="val">'+acc.toFixed(2)+' m/s\\xb2</span><br>Velocity: <span class="val">'+vel.toFixed(2)+' m/s</span><br>Friction: <span class="val">'+friction.toFixed(1)+' N</span>';
}

function drawLaw3(cw,gy){
  // Rocket
  if(running){
    rocketV+=2*dt;rocketX-=rocketV*dt*5;
    if(Math.random()<0.4)gasParticles.push({x:cw/2+40,y:gy-50,vx:3+Math.random()*3,vy:(Math.random()-0.5)*2,life:1});
  }
  gasParticles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=0.02;});
  gasParticles=gasParticles.filter(p=>p.life>0);
  const rx=cw/2-30+rocketX,ry=gy-100;
  // Rocket body
  ctx.fillStyle='rgba(239,68,68,0.3)';ctx.strokeStyle='#ef4444';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-15,ry+60);ctx.lineTo(rx+15,ry+60);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(59,130,246,0.4)';ctx.fillRect(rx-12,ry+30,24,30);
  // Flame
  if(running){ctx.fillStyle='rgba(245,158,11,0.6)';ctx.beginPath();ctx.moveTo(rx-10,ry+60);ctx.lineTo(rx+10,ry+60);ctx.lineTo(rx,ry+60+20+Math.random()*15);ctx.fill();}
  // Gas particles
  ctx.fillStyle='rgba(245,158,11,0.5)';gasParticles.forEach(p=>{ctx.globalAlpha=p.life;ctx.beginPath();ctx.arc(p.x,p.y,2,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
  // Action arrow (thrust left)
  ctx.strokeStyle='#3b82f6';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(rx-20,ry+30);ctx.lineTo(rx-60,ry+30);ctx.stroke();
  ctx.fillStyle='#3b82f6';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('Action (thrust)',rx-40,ry+20);
  // Reaction arrow (gas right)
  ctx.strokeStyle='#f59e0b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(rx+20,ry+50);ctx.lineTo(rx+60,ry+50);ctx.stroke();
  ctx.fillStyle='#f59e0b';ctx.fillText('Reaction (exhaust)',rx+40,ry+68);
  ctx.fillStyle='rgba(255,255,255,0.15)';ctx.font='bold 18px system-ui';ctx.textAlign='center';
  ctx.fillText("Newton's 3rd Law: Every action has an equal opposite reaction",cw/2,60);
  document.getElementById('info').innerHTML='<b style="color:#fca5a5">3rd Law — Action-Reaction</b><br>Rocket pushes gas <span class="val">right</span><br>Gas pushes rocket <span class="val">left</span><br>Velocity: <span class="val">'+rocketV.toFixed(2)+' m/s</span>';
}

addEventListener('message',e=>{if(!e.data||!e.data.type)return;if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){resetSim();}});
draw();
<\/script></body></html>`;

// ── Projectile Motion ───────────────────────────────────────────────────────
const PROJECTILE_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;user-select:none;color:#fff}
canvas{display:block}
#ui{position:fixed;top:48px;right:0;bottom:0;width:210px;z-index:20;background:rgba(15,15,35,0.92);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;display:flex;flex-direction:column}
.pn{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06)}
.pn-t{font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.3);font-weight:700;margin-bottom:6px}
.sl-row{display:flex;align-items:center;gap:4px;margin:4px 0}
.sl-row label{font-size:9px;color:rgba(255,255,255,0.4);min-width:45px}
.sl-row input[type=range]{flex:1;height:4px;-webkit-appearance:none;background:rgba(255,255,255,0.1);border-radius:2px;outline:none}
.sl-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#3b82f6;cursor:pointer}
.sl-row span{font-size:9px;color:rgba(255,255,255,0.6);min-width:35px;text-align:right;font-weight:600}
.pn button{display:block;width:100%;padding:7px;margin-bottom:4px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);border-radius:7px;cursor:pointer;font-size:10px;font-weight:600;text-align:center;transition:all .2s}
.pn button:hover{background:rgba(255,255,255,0.1);color:#fff}
#info{position:fixed;bottom:8px;left:8px;z-index:20;background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 12px;font-size:10px;line-height:1.6;backdrop-filter:blur(8px)}
#info .val{color:#60a5fa;font-weight:700;font-family:'Courier New',monospace}
</style></head><body>
<canvas id="c"></canvas>
<div id="ui">
  <div class="pn"><div class="pn-t">Launch Settings</div>
    <div class="sl-row"><label>Angle</label><input type="range" id="sl-a" min="5" max="85" value="45"><span id="v-a">45&deg;</span></div>
    <div class="sl-row"><label>Velocity</label><input type="range" id="sl-v" min="5" max="50" value="25"><span id="v-v">25 m/s</span></div>
    <div class="sl-row"><label>Gravity</label><input type="range" id="sl-g" min="1" max="20" step="0.1" value="9.8"><span id="v-g">9.8</span></div>
    <div class="sl-row"><label>Height</label><input type="range" id="sl-h" min="0" max="20" value="0"><span id="v-h">0 m</span></div>
  </div>
  <div class="pn">
    <button onclick="launch()" style="color:#6ee7b7;border-color:rgba(16,185,129,0.3)">&#9654; Launch</button>
    <button onclick="resetSim()" style="color:#fca5a5;border-color:rgba(239,68,68,0.3)">Reset</button>
    <button onclick="toggleTrace()" id="b-trace" style="color:#93c5fd;border-color:rgba(59,130,246,0.3)">Trace: ON</button>
  </div>
  <div class="pn"><div class="pn-t">Theory</div>
    <div style="font-size:9px;color:rgba(255,255,255,0.4);line-height:1.6">
      Range = v&sup2;sin(2&theta;)/g<br>
      Max Height = v&sup2;sin&sup2;(&theta;)/2g<br>
      Time = 2v&middot;sin(&theta;)/g
    </div>
  </div>
</div>
<div id="info"></div>
<script>
const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,H;
let angle=45,v0=25,g=9.8,h0=0;
let t=0,running=false,px=0,py=0,trail=[],showTrace=true;
let traces=[];

function resize(){W=C.width=innerWidth;H=C.height=innerHeight}
resize();addEventListener('resize',resize);

const slA=document.getElementById('sl-a'),slV=document.getElementById('sl-v'),slG=document.getElementById('sl-g'),slH=document.getElementById('sl-h');
slA.oninput=e=>{angle=+e.target.value;document.getElementById('v-a').innerHTML=angle+'&deg;'};
slV.oninput=e=>{v0=+e.target.value;document.getElementById('v-v').textContent=v0+' m/s'};
slG.oninput=e=>{g=+e.target.value;document.getElementById('v-g').textContent=g.toFixed(1)};
slH.oninput=e=>{h0=+e.target.value;document.getElementById('v-h').textContent=h0+' m'};

function launch(){
  t=0;running=true;trail=[];
  px=0;py=h0;
}
function resetSim(){t=0;running=false;px=0;py=h0;trail=[];traces=[];}
function toggleTrace(){showTrace=!showTrace;document.getElementById('b-trace').textContent='Trace: '+(showTrace?'ON':'OFF');}

const sc=12; // pixels per meter
function toScreen(x,y){const cw=W-210;const ox=80,oy=H-60;return[ox+x*sc,oy-y*sc];}

function draw(){
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  const cw=W-210;
  // Ground
  const gy=H-60;
  ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(cw,gy);ctx.stroke();
  // Grid
  ctx.strokeStyle='rgba(255,255,255,0.03)';ctx.lineWidth=1;
  for(let x=0;x<cw;x+=sc*5){ctx.beginPath();ctx.moveTo(80+x,0);ctx.lineTo(80+x,gy);ctx.stroke();}
  for(let y=0;y<gy;y+=sc*5){ctx.beginPath();ctx.moveTo(0,gy-y);ctx.lineTo(cw,gy-y);ctx.stroke();}

  // Physics
  const rad=angle*Math.PI/180;
  const vx=v0*Math.cos(rad),vy=v0*Math.sin(rad);
  const range=h0===0?(v0*v0*Math.sin(2*rad)/g):(vx/g*(vy+Math.sqrt(vy*vy+2*g*h0)));
  const maxH=h0+vy*vy/(2*g);
  const tTotal=h0===0?(2*vy/g):(vy+Math.sqrt(vy*vy+2*g*h0))/g;

  // Predicted path (dashed)
  ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=1;ctx.beginPath();
  for(let tt=0;tt<=tTotal;tt+=0.05){
    const xx=vx*tt,yy=h0+vy*tt-0.5*g*tt*tt;
    const[sx,sy]=toScreen(xx,Math.max(0,yy));
    tt===0?ctx.moveTo(sx,sy):ctx.lineTo(sx,sy);
  }ctx.stroke();ctx.setLineDash([]);

  // Old traces
  traces.forEach(tr=>{
    ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=1;ctx.beginPath();
    tr.forEach((p,i)=>{const[sx,sy]=toScreen(p[0],p[1]);i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy)});ctx.stroke();
  });

  // Active trail
  if(showTrace&&trail.length>1){
    ctx.strokeStyle='rgba(59,130,246,0.6)';ctx.lineWidth=2;ctx.beginPath();
    trail.forEach((p,i)=>{const[sx,sy]=toScreen(p[0],p[1]);i?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy)});ctx.stroke();
  }

  // Simulate
  if(running){
    t+=1/60;
    px=vx*t;py=h0+vy*t-0.5*g*t*t;
    if(py>=0)trail.push([px,py]);
    if(py<0){py=0;running=false;traces.push([...trail]);}
  }

  // Projectile
  const[bx,by]=toScreen(px,py);
  ctx.beginPath();ctx.arc(bx,by,6,0,Math.PI*2);ctx.fillStyle='#ef4444';ctx.fill();
  ctx.beginPath();ctx.arc(bx,by,10,0,Math.PI*2);ctx.strokeStyle='rgba(239,68,68,0.3)';ctx.lineWidth=2;ctx.stroke();

  // Launch angle indicator
  const[ox,oy]=toScreen(0,h0);
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(ox,oy,30,-Math.PI,0);ctx.stroke();
  ctx.strokeStyle='#f59e0b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(ox+50*Math.cos(-rad),oy+50*Math.sin(-rad));ctx.stroke();
  ctx.fillStyle='#f59e0b';ctx.font='10px system-ui';ctx.fillText(angle+'\\xb0',ox+35,oy-10);

  // Height indicator
  if(h0>0){ctx.fillStyle='rgba(16,185,129,0.3)';ctx.fillRect(60,gy-h0*sc,20,h0*sc);ctx.fillStyle='#10b981';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText(h0+'m',70,gy-h0*sc-5);ctx.textAlign='left';}

  // Info
  document.getElementById('info').innerHTML='<b style="color:#93c5fd">Projectile Motion</b><br>Range: <span class="val">'+range.toFixed(1)+' m</span><br>Max Height: <span class="val">'+maxH.toFixed(1)+' m</span><br>Flight Time: <span class="val">'+tTotal.toFixed(2)+' s</span><br>Current: (<span class="val">'+px.toFixed(1)+'</span>, <span class="val">'+py.toFixed(1)+'</span>)';

  requestAnimationFrame(draw);
}
addEventListener('message',e=>{if(!e.data||!e.data.type)return;if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){resetSim();}});
draw();
<\/script></body></html>`;

// ── Solar System ────────────────────────────────────────────────────────────
const SOLAR_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#020210;overflow:hidden;font-family:system-ui,sans-serif;user-select:none;color:#fff}
canvas{display:block}
#ui{position:fixed;top:48px;right:0;bottom:0;width:200px;z-index:20;background:rgba(5,5,25,0.92);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;display:flex;flex-direction:column}
.pn{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06)}
.pn-t{font-size:8px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.3);font-weight:700;margin-bottom:6px}
.planet-btn{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;margin-bottom:3px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);border-radius:7px;cursor:pointer;font-size:10px;font-weight:600;transition:all .2s}
.planet-btn:hover{background:rgba(255,255,255,0.08);color:#fff}
.planet-btn.on{background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.3);color:#93c5fd}
.planet-btn .dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.sl-row{display:flex;align-items:center;gap:4px;margin:4px 0}
.sl-row label{font-size:9px;color:rgba(255,255,255,0.4);min-width:40px}
.sl-row input[type=range]{flex:1;height:4px;-webkit-appearance:none;background:rgba(255,255,255,0.1);border-radius:2px;outline:none}
.sl-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#f59e0b;cursor:pointer}
.sl-row span{font-size:9px;color:rgba(255,255,255,0.6);min-width:25px;text-align:right;font-weight:600}
#planet-info{position:fixed;bottom:8px;left:8px;z-index:20;background:rgba(0,0,0,0.75);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:10px 14px;font-size:10px;line-height:1.7;backdrop-filter:blur(8px);max-width:260px}
#planet-info .val{color:#fbbf24;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="ui">
  <div class="pn"><div class="pn-t">Speed</div>
    <div class="sl-row"><label>Speed</label><input type="range" id="sl-spd" min="0.1" max="10" step="0.1" value="1"><span id="v-spd">1x</span></div>
  </div>
  <div class="pn"><div class="pn-t">Planets</div><div id="planet-list"></div></div>
</div>
<div id="planet-info"></div>
<script>
const C=document.getElementById('c'),ctx=C.getContext('2d');
let W,H,speed=1,selPlanet=null,t=0;
function resize(){W=C.width=innerWidth;H=C.height=innerHeight}
resize();addEventListener('resize',resize);

const PLANETS=[
  {name:'Mercury',r:8, orbit:50, period:0.24,color:'#94a3b8',mass:'3.3\\u00d710\\xb2\\xb3 kg',dist:'57.9M km',temp:'167\\xb0C',moons:0},
  {name:'Venus',  r:12,orbit:75, period:0.62,color:'#f59e0b',mass:'4.87\\u00d710\\xb2\\u2074 kg',dist:'108.2M km',temp:'464\\xb0C',moons:0},
  {name:'Earth',  r:13,orbit:105,period:1,   color:'#3b82f6',mass:'5.97\\u00d710\\xb2\\u2074 kg',dist:'149.6M km',temp:'15\\xb0C',moons:1},
  {name:'Mars',   r:10,orbit:140,period:1.88,color:'#ef4444',mass:'6.42\\u00d710\\xb2\\xb3 kg',dist:'227.9M km',temp:'-65\\xb0C',moons:2},
  {name:'Jupiter',r:28,orbit:195,period:11.86,color:'#f97316',mass:'1.9\\u00d710\\xb2\\u2077 kg',dist:'778.5M km',temp:'-110\\xb0C',moons:95},
  {name:'Saturn', r:24,orbit:250,period:29.46,color:'#eab308',mass:'5.68\\u00d710\\xb2\\u2076 kg',dist:'1.43B km',temp:'-140\\xb0C',moons:146},
  {name:'Uranus', r:18,orbit:300,period:84.01,color:'#06b6d4',mass:'8.68\\u00d710\\xb2\\u2075 kg',dist:'2.87B km',temp:'-195\\xb0C',moons:28},
  {name:'Neptune',r:17,orbit:340,period:164.8,color:'#6366f1',mass:'1.02\\u00d710\\xb2\\u2076 kg',dist:'4.5B km',temp:'-200\\xb0C',moons:16},
];

// Build planet list
const pl=document.getElementById('planet-list');
PLANETS.forEach((p,i)=>{
  const btn=document.createElement('div');btn.className='planet-btn';btn.innerHTML='<div class="dot" style="background:'+p.color+'"></div>'+p.name;
  btn.onclick=()=>{selPlanet=selPlanet===i?null:i;document.querySelectorAll('.planet-btn').forEach(b=>b.classList.remove('on'));if(selPlanet!==null)btn.classList.add('on');};
  pl.appendChild(btn);
});

document.getElementById('sl-spd').oninput=e=>{speed=+e.target.value;document.getElementById('v-spd').textContent=speed.toFixed(1)+'x'};

// Stars background
const stars=Array.from({length:200},()=>({x:Math.random()*2000,y:Math.random()*2000,s:Math.random()*1.5+0.5,b:Math.random()}));

function draw(){
  ctx.fillStyle='#020210';ctx.fillRect(0,0,W,H);
  const cw=W-200,cx=cw/2,cy=H/2;

  // Stars
  stars.forEach(s=>{ctx.fillStyle='rgba(255,255,255,'+(0.3+0.3*Math.sin(t*2+s.b*10))+')';ctx.beginPath();ctx.arc(s.x%cw,s.y%H,s.s,0,Math.PI*2);ctx.fill()});

  // Sun
  const sunR=22;
  const sunGrad=ctx.createRadialGradient(cx,cy,0,cx,cy,sunR*3);
  sunGrad.addColorStop(0,'rgba(255,200,50,0.8)');sunGrad.addColorStop(0.3,'rgba(255,150,0,0.4)');sunGrad.addColorStop(1,'transparent');
  ctx.fillStyle=sunGrad;ctx.beginPath();ctx.arc(cx,cy,sunR*3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fbbf24';ctx.beginPath();ctx.arc(cx,cy,sunR,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText('Sun',cx,cy+sunR+12);

  // Planets
  PLANETS.forEach((p,i)=>{
    const a=t*speed*2*Math.PI/p.period;
    const px=cx+p.orbit*Math.cos(a),py=cy+p.orbit*0.4*Math.sin(a);
    // Orbit ring
    ctx.strokeStyle=selPlanet===i?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.04)';ctx.lineWidth=1;
    ctx.beginPath();ctx.ellipse(cx,cy,p.orbit,p.orbit*0.4,0,0,Math.PI*2);ctx.stroke();
    // Planet glow
    if(selPlanet===i){ctx.beginPath();ctx.arc(px,py,p.r+6,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fill();}
    // Planet
    ctx.beginPath();ctx.arc(px,py,p.r,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();
    // Saturn ring
    if(p.name==='Saturn'){ctx.strokeStyle='rgba(234,179,8,0.4)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(px,py,p.r+12,4,0.3,0,Math.PI*2);ctx.stroke();}
    // Label
    ctx.fillStyle=selPlanet===i?'#fff':'rgba(255,255,255,0.35)';ctx.font=(selPlanet===i?'bold ':'')+' 8px system-ui';ctx.textAlign='center';ctx.fillText(p.name,px,py+p.r+10);
  });

  // Info panel
  if(selPlanet!==null){
    const p=PLANETS[selPlanet];
    document.getElementById('planet-info').innerHTML='<b style="color:'+p.color+'">'+p.name+'</b><br>Mass: <span class="val">'+p.mass+'</span><br>Distance: <span class="val">'+p.dist+'</span><br>Temp: <span class="val">'+p.temp+'</span><br>Moons: <span class="val">'+p.moons+'</span><br>Orbital Period: <span class="val">'+p.period+' years</span>';
  } else {
    document.getElementById('planet-info').innerHTML='<span style="opacity:0.4">Click a planet for details</span>';
  }

  t+=1/60;
  requestAnimationFrame(draw);
}
addEventListener('message',e=>{if(!e.data||!e.data.type)return;if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){t=0;speed=1;selPlanet=null;document.getElementById('sl-spd').value=1;document.getElementById('v-spd').textContent='1.0x';document.querySelectorAll('.planet-btn').forEach(b=>b.classList.remove('on'));}});
draw();
<\/script></body></html>`;

// ── Friction & Inclined Plane ───────────────────────────────────────────────
const FRICTION_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600;font-size:11px}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#f59e0b}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(245,158,11,0.25);border-color:rgba(245,158,11,0.5);color:#f59e0b}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#f59e0b;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Inclined Plane</div>
<label>Angle <span id="vAng">30</span>°</label>
<input type="range" id="sAng" min="0" max="80" value="30" step="1">
<label>Mass <span id="vMass">5</span> kg</label>
<input type="range" id="sMass" min="1" max="50" value="5" step="1">
<label>μ (friction) <span id="vMu">0.30</span></label>
<input type="range" id="sMu" min="0" max="100" value="30" step="1">
<label>Gravity <span id="vG">9.8</span> m/s²</label>
<input type="range" id="sG" min="1" max="25" value="10" step="1">
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<button id="bStart">Start / Reset</button>
<button id="bPause">Pause</button>
</div>
<div class="sec">
<div class="sec-title">Forces (N)</div>
<div class="info" id="forces">Click Start to begin</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>On an incline at angle θ:</b><br>
Weight component ∥ = mg sin θ<br>
Normal force N = mg cos θ<br>
Friction f = μN = μmg cos θ<br>
Net force = mg sin θ − μmg cos θ<br>
a = g(sin θ − μ cos θ)<br><br>
Block slides when tan θ > μ
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
const sAng=document.getElementById('sAng'),sMass=document.getElementById('sMass'),sMu=document.getElementById('sMu'),sG=document.getElementById('sG');
const vAng=document.getElementById('vAng'),vMass=document.getElementById('vMass'),vMu=document.getElementById('vMu'),vG=document.getElementById('vG');
const forcesEl=document.getElementById('forces');
let W,H,ang=30,mass=5,mu=0.3,g=9.8,running=false,paused=false,pos=0,vel=0,t=0;
function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}
resize();window.onresize=resize;
function sliders(){
ang=+sAng.value;vAng.textContent=ang;
mass=+sMass.value;vMass.textContent=mass;
mu=(+sMu.value)/100;vMu.textContent=mu.toFixed(2);
g=(+sG.value)*0.98;vG.textContent=g.toFixed(1);
if(!running)draw();
}
[sAng,sMass,sMu,sG].forEach(s=>s.oninput=sliders);
document.getElementById('bStart').onclick=()=>{pos=0;vel=0;t=0;running=true;paused=false};
document.getElementById('bPause').onclick=()=>{paused=!paused};
function draw(){
X.clearRect(0,0,W,H);
const rad=ang*Math.PI/180;
const planeLen=Math.min(W*0.7,H*0.8);
const baseX=W*0.15,baseY=H*0.82;
const topX=baseX+planeLen*Math.cos(rad),topY=baseY-planeLen*Math.sin(rad);
// ground
X.fillStyle='rgba(255,255,255,0.03)';X.fillRect(0,baseY,W,H-baseY);
X.strokeStyle='rgba(255,255,255,0.15)';X.lineWidth=1;X.beginPath();X.moveTo(0,baseY);X.lineTo(W,baseY);X.stroke();
// plane
X.save();X.beginPath();X.moveTo(baseX,baseY);X.lineTo(topX,topY);X.lineTo(baseX+(topX-baseX),baseY);X.closePath();
X.fillStyle='rgba(245,158,11,0.08)';X.fill();X.strokeStyle='rgba(245,158,11,0.4)';X.lineWidth=2;X.stroke();X.restore();
// angle arc
X.beginPath();X.arc(baseX+(topX-baseX)*0.5,baseY,40,0,-rad,true);X.strokeStyle='rgba(255,255,255,0.3)';X.lineWidth=1;X.stroke();
X.fillStyle='rgba(255,255,255,0.5)';X.font='11px system-ui';X.fillText(ang+'°',baseX+(topX-baseX)*0.5+45,baseY-8);
// block position along plane
const maxDist=planeLen-60;
const blockDist=Math.min(pos*30,maxDist);
const bx=baseX+20+(planeLen-60-blockDist)*Math.cos(rad);
const by=baseY-(20+(planeLen-60-blockDist)*Math.sin(rad));
const bSize=24+mass*0.4;
// draw block
X.save();X.translate(bx,by);X.rotate(-rad);
X.fillStyle='rgba(59,130,246,0.6)';X.strokeStyle='rgba(59,130,246,0.8)';X.lineWidth=2;
X.fillRect(-bSize/2,-bSize,bSize,bSize);X.strokeRect(-bSize/2,-bSize,bSize,bSize);
X.fillStyle='#fff';X.font='bold 10px system-ui';X.textAlign='center';X.fillText(mass+'kg',-0,(-bSize/2)+4);
X.restore();
// force arrows
const scale=0.8;
const Fg=mass*g,Fp=Fg*Math.sin(rad),Fn=Fg*Math.cos(rad),Ff=mu*Fn;
const netF=Fp-Ff;
// draw arrows from block center
X.save();X.translate(bx,by-bSize/2);
// weight down
drawArrow(X,0,0,0,Fg*scale*0.5,'rgba(255,80,80,0.8)','W='+Fg.toFixed(1)+'N');
// component along plane (down the slope)
X.save();X.rotate(-rad);
drawArrow(X,0,0,Fp*scale*0.5,0,'rgba(255,180,0,0.8)','F∥='+Fp.toFixed(1));
if(Ff>0.01)drawArrow(X,0,0,-Ff*scale*0.5,0,'rgba(0,200,100,0.8)','f='+Ff.toFixed(1));
X.restore();
// normal
X.save();X.rotate(-rad);
drawArrow(X,0,0,0,-Fn*scale*0.5,'rgba(100,150,255,0.8)','N='+Fn.toFixed(1));
X.restore();
X.restore();
// update forces display
forcesEl.innerHTML='Weight: <span class="val">'+Fg.toFixed(1)+'</span> N<br>'+
'F∥ (along slope): <span class="val">'+Fp.toFixed(1)+'</span> N<br>'+
'Normal N: <span class="val">'+Fn.toFixed(1)+'</span> N<br>'+
'Friction f: <span class="val">'+Ff.toFixed(1)+'</span> N<br>'+
'Net force: <span class="val">'+netF.toFixed(1)+'</span> N<br>'+
'Acceleration: <span class="val">'+(netF>0?(netF/mass).toFixed(2):'0.00')+'</span> m/s²<br>'+
'Velocity: <span class="val">'+vel.toFixed(2)+'</span> m/s<br>'+
(netF<=0?'<span style="color:#10b981">Block stationary (friction ≥ gravity component)</span>':'<span style="color:#f59e0b">Block sliding!</span>');
}
function drawArrow(ctx,x1,y1,x2,y2,color,label){
const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
if(len<2)return;
ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1+x2,y1+y2);
ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.stroke();
const angle=Math.atan2(y2,x2);
ctx.save();ctx.translate(x1+x2,y1+y2);ctx.rotate(angle);
ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-8,-4);ctx.lineTo(-8,4);ctx.closePath();
ctx.fillStyle=color;ctx.fill();ctx.restore();
if(label){ctx.fillStyle=color;ctx.font='bold 9px system-ui';ctx.fillText(label,x1+x2*0.5+8,y1+y2*0.5-6)}
}
const dt=1/60;
function loop(){
requestAnimationFrame(loop);
if(running&&!paused){
const rad=ang*Math.PI/180;
const a=g*(Math.sin(rad)-mu*Math.cos(rad));
if(a>0){vel+=a*dt;pos+=vel*dt;t+=dt}
if(pos*30>=(Math.min(W*0.7,H*0.8))-60){pos=0;vel=0}
}
draw();
}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){pos=0;vel=0;t=0;running=false;paused=false}
});
<\/script></body></html>`;

// ── Hooke's Law & Springs ──────────────────────────────────────────────────
const HOOKE_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#10b981}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#10b981;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Spring Properties</div>
<label>Spring constant k <span id="vK">20</span> N/m</label>
<input type="range" id="sK" min="5" max="100" value="20" step="1">
<label>Mass <span id="vM">2</span> kg</label>
<input type="range" id="sM" min="1" max="20" value="2" step="1">
<label>Damping <span id="vD">0.02</span></label>
<input type="range" id="sD" min="0" max="50" value="2" step="1">
<label>Initial stretch <span id="vX">100</span> px</label>
<input type="range" id="sX" min="20" max="200" value="100" step="5">
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<button id="bDrop">Drop Mass</button>
<button id="bReset">Reset</button>
<button id="bGraph">Toggle Graph</button>
</div>
<div class="sec">
<div class="sec-title">Measurements</div>
<div class="info" id="meas">Drop the mass to begin</div>
</div>
<div class="sec">
<div class="sec-title">Hooke's Law</div>
<div class="info">
<b>F = −kx</b><br><br>
Force is proportional to displacement from equilibrium and acts in the opposite direction.<br><br>
<b>Period T = 2π√(m/k)</b><br>
<b>PE = ½kx²</b><br>
<b>KE = ½mv²</b>
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H,k=20,mass=2,damp=0.02,initStretch=100;
let springY=0,velY=0,equilY,running=false,showGraph=true,history=[];
function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight;equilY=H*0.3}
resize();window.onresize=resize;
const sK=document.getElementById('sK'),sM=document.getElementById('sM'),sD=document.getElementById('sD'),sX=document.getElementById('sX');
function sliders(){
k=+sK.value;document.getElementById('vK').textContent=k;
mass=+sM.value;document.getElementById('vM').textContent=mass;
damp=(+sD.value)/100;document.getElementById('vD').textContent=damp.toFixed(2);
initStretch=+sX.value;document.getElementById('vX').textContent=initStretch;
}
[sK,sM,sD,sX].forEach(s=>s.oninput=sliders);
document.getElementById('bDrop').onclick=()=>{springY=initStretch;velY=0;running=true;history=[]};
document.getElementById('bReset').onclick=()=>{springY=0;velY=0;running=false;history=[]};
document.getElementById('bGraph').onclick=()=>{showGraph=!showGraph};
function drawSpring(x,y1,y2,coils){
const segH=(y2-y1)/((coils*2)+2),amp=14;
X.beginPath();X.moveTo(x,y1);X.lineTo(x,y1+segH);
for(let i=0;i<coils*2;i++){
const yy=y1+segH+(i+1)*segH;
X.lineTo(x+(i%2===0?amp:-amp),yy);
}
X.lineTo(x,y2-segH);X.lineTo(x,y2);
X.strokeStyle='rgba(16,185,129,0.7)';X.lineWidth=2.5;X.stroke();
}
function draw(){
X.clearRect(0,0,W,H);
const anchorX=W*0.4,anchorY=40;
const massY=equilY+springY;
const massSize=20+mass*1.5;
// ceiling
X.fillStyle='rgba(255,255,255,0.06)';X.fillRect(anchorX-40,0,80,anchorY);
X.strokeStyle='rgba(255,255,255,0.2)';X.lineWidth=2;
X.beginPath();X.moveTo(anchorX-40,anchorY);X.lineTo(anchorX+40,anchorY);X.stroke();
// spring
const coils=8+Math.floor(springY/20);
drawSpring(anchorX,anchorY,massY,Math.max(4,Math.min(coils,20)));
// equilibrium line
X.setLineDash([5,5]);X.strokeStyle='rgba(255,255,255,0.15)';X.lineWidth=1;
X.beginPath();X.moveTo(anchorX-80,equilY);X.lineTo(anchorX+80,equilY);X.stroke();
X.setLineDash([]);
X.fillStyle='rgba(255,255,255,0.3)';X.font='10px system-ui';X.fillText('Equilibrium',anchorX+85,equilY+4);
// mass block
X.fillStyle='rgba(59,130,246,0.6)';X.strokeStyle='rgba(59,130,246,0.8)';X.lineWidth=2;
X.fillRect(anchorX-massSize/2,massY,massSize,massSize);
X.strokeRect(anchorX-massSize/2,massY,massSize,massSize);
X.fillStyle='#fff';X.font='bold 10px system-ui';X.textAlign='center';
X.fillText(mass+'kg',anchorX,massY+massSize/2+4);X.textAlign='left';
// force arrow
const force=-k*springY/100;
if(Math.abs(force)>0.5){
const arrowLen=force*3;
X.beginPath();X.moveTo(anchorX+massSize/2+10,massY+massSize/2);
X.lineTo(anchorX+massSize/2+10,massY+massSize/2-arrowLen);
X.strokeStyle='rgba(255,100,100,0.8)';X.lineWidth=2.5;X.stroke();
X.fillStyle='rgba(255,100,100,0.8)';X.font='9px system-ui';
X.fillText('F='+(-force).toFixed(1)+'N',anchorX+massSize/2+16,massY+massSize/2-arrowLen/2);
}
// displacement marker
if(Math.abs(springY)>2){
X.strokeStyle='rgba(245,158,11,0.5)';X.lineWidth=1;
X.beginPath();X.moveTo(anchorX-massSize/2-20,equilY);X.lineTo(anchorX-massSize/2-20,massY);X.stroke();
X.fillStyle='rgba(245,158,11,0.7)';X.font='9px system-ui';
X.fillText('x='+(springY/100).toFixed(2)+'m',anchorX-massSize/2-70,(equilY+massY)/2+4);
}
// energy
const PE=0.5*k*(springY/100)*(springY/100);
const KE=0.5*mass*(velY/100)*(velY/100);
const TE=PE+KE;
document.getElementById('meas').innerHTML=
'Displacement: <span class="val">'+(springY/100).toFixed(3)+'</span> m<br>'+
'Velocity: <span class="val">'+(velY/100).toFixed(3)+'</span> m/s<br>'+
'Force: <span class="val">'+(k*springY/100).toFixed(2)+'</span> N<br>'+
'PE: <span class="val">'+PE.toFixed(3)+'</span> J<br>'+
'KE: <span class="val">'+KE.toFixed(3)+'</span> J<br>'+
'Total: <span class="val">'+TE.toFixed(3)+'</span> J<br>'+
'Period T: <span class="val">'+(2*Math.PI*Math.sqrt(mass/k)).toFixed(3)+'</span> s';
// graph
if(showGraph&&history.length>1){
const gx=20,gy=H-160,gw=W*0.4-40,gh=130;
X.fillStyle='rgba(0,0,0,0.4)';X.fillRect(gx,gy,gw,gh);
X.strokeStyle='rgba(255,255,255,0.1)';X.lineWidth=1;X.strokeRect(gx,gy,gw,gh);
// axis
X.strokeStyle='rgba(255,255,255,0.2)';X.beginPath();X.moveTo(gx,gy+gh/2);X.lineTo(gx+gw,gy+gh/2);X.stroke();
X.fillStyle='rgba(255,255,255,0.3)';X.font='9px system-ui';X.fillText('Displacement vs Time',gx+4,gy+12);
const maxPts=300,pts=history.slice(-maxPts);
const maxV=Math.max(...pts.map(p=>Math.abs(p)),50);
X.beginPath();
pts.forEach((v,i)=>{
const px=gx+(i/maxPts)*gw,py=gy+gh/2-(v/maxV)*(gh/2)*0.9;
i===0?X.moveTo(px,py):X.lineTo(px,py);
});
X.strokeStyle='rgba(16,185,129,0.8)';X.lineWidth=1.5;X.stroke();
}
}
function loop(){
requestAnimationFrame(loop);
if(running){
const a=(-k*springY/100-damp*velY/100)*100/mass;
velY+=a/60;springY+=velY/60;
history.push(springY);
if(history.length>600)history.shift();
}
draw();
}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){springY=0;velY=0;running=false;history=[]}
});
<\/script></body></html>`;

// ── Wave Motion ────────────────────────────────────────────────────────────
const WAVE_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#8b5cf6}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(139,92,246,0.25);border-color:rgba(139,92,246,0.5);color:#8b5cf6}
.btns{display:flex;gap:4px;margin-bottom:8px}
.btns button{flex:1}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#8b5cf6;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Wave Type</div>
<div class="btns"><button id="bTrans" class="active">Transverse</button><button id="bLong">Longitudinal</button></div>
</div>
<div class="sec">
<div class="sec-title">Properties</div>
<label>Amplitude <span id="vA">60</span> px</label>
<input type="range" id="sA" min="10" max="120" value="60" step="1">
<label>Wavelength <span id="vL">200</span> px</label>
<input type="range" id="sL" min="60" max="500" value="200" step="5">
<label>Frequency <span id="vF">1.0</span> Hz</label>
<input type="range" id="sF" min="1" max="50" value="10" step="1">
<label>Particles <span id="vN">40</span></label>
<input type="range" id="sN" min="10" max="80" value="40" step="1">
</div>
<div class="sec">
<div class="sec-title">Display</div>
<button id="bPause">Pause</button>
<button id="bParticles">Toggle Particles</button>
<button id="bLabels">Toggle Labels</button>
</div>
<div class="sec">
<div class="sec-title">Measurements</div>
<div class="info" id="meas">v = fλ</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>Wave equation:</b> v = fλ<br><br>
<b>Transverse:</b> oscillation ⊥ to wave direction (e.g., light, water waves)<br><br>
<b>Longitudinal:</b> oscillation ∥ to wave direction (e.g., sound)<br><br>
T = 1/f (period)<br>
v = λ/T
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;
function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}
resize();window.onresize=resize;
let waveType='transverse',amp=60,wl=200,freq=1.0,nParts=40,paused=false,showParts=true,showLabels=true,time=0;
const sA=document.getElementById('sA'),sL=document.getElementById('sL'),sF=document.getElementById('sF'),sN=document.getElementById('sN');
function sl(){
amp=+sA.value;document.getElementById('vA').textContent=amp;
wl=+sL.value;document.getElementById('vL').textContent=wl;
freq=(+sF.value)/10;document.getElementById('vF').textContent=freq.toFixed(1);
nParts=+sN.value;document.getElementById('vN').textContent=nParts;
}
[sA,sL,sF,sN].forEach(s=>s.oninput=sl);
document.getElementById('bTrans').onclick=()=>{waveType='transverse';document.getElementById('bTrans').classList.add('active');document.getElementById('bLong').classList.remove('active')};
document.getElementById('bLong').onclick=()=>{waveType='longitudinal';document.getElementById('bLong').classList.add('active');document.getElementById('bTrans').classList.remove('active')};
document.getElementById('bPause').onclick=()=>{paused=!paused;document.getElementById('bPause').textContent=paused?'Play':'Pause'};
document.getElementById('bParticles').onclick=()=>{showParts=!showParts};
document.getElementById('bLabels').onclick=()=>{showLabels=!showLabels};
function draw(){
X.clearRect(0,0,W,H);
const cy=H/2,startX=40;
const v=freq*wl;
// grid
X.strokeStyle='rgba(255,255,255,0.04)';X.lineWidth=1;
for(let y=0;y<H;y+=50){X.beginPath();X.moveTo(0,y);X.lineTo(W,y);X.stroke()}
for(let x=0;x<W;x+=50){X.beginPath();X.moveTo(x,0);X.lineTo(x,H);X.stroke()}
// equilibrium line
X.setLineDash([4,4]);X.strokeStyle='rgba(255,255,255,0.15)';
X.beginPath();X.moveTo(startX,cy);X.lineTo(W-20,cy);X.stroke();X.setLineDash([]);
if(waveType==='transverse'){
// wave curve
X.beginPath();
for(let px=startX;px<W-20;px++){
const y=cy+amp*Math.sin(2*Math.PI*(px/wl-freq*time));
px===startX?X.moveTo(px,y):X.lineTo(px,y);
}
X.strokeStyle='rgba(139,92,246,0.8)';X.lineWidth=2.5;X.stroke();
// particles
if(showParts){
const spacing=(W-60)/nParts;
for(let i=0;i<nParts;i++){
const px=startX+i*spacing;
const py=cy+amp*Math.sin(2*Math.PI*(px/wl-freq*time));
X.beginPath();X.arc(px,py,4,0,Math.PI*2);
X.fillStyle='rgba(139,92,246,0.9)';X.fill();
// motion line
X.strokeStyle='rgba(255,255,255,0.1)';X.lineWidth=1;
X.beginPath();X.moveTo(px,cy-amp-8);X.lineTo(px,cy+amp+8);X.stroke();
}
}
// labels
if(showLabels){
X.fillStyle='rgba(255,255,255,0.5)';X.font='10px system-ui';
// wavelength
const lx=startX+wl*0.1;
const ly1=cy+amp*Math.sin(2*Math.PI*(lx/wl-freq*time));
X.strokeStyle='rgba(245,158,11,0.6)';X.lineWidth=1.5;
X.beginPath();X.moveTo(lx,ly1-amp*0.3-30);X.lineTo(lx+wl,ly1-amp*0.3-30);X.stroke();
X.beginPath();X.moveTo(lx,ly1-amp*0.3-35);X.lineTo(lx,ly1-amp*0.3-25);X.stroke();
X.beginPath();X.moveTo(lx+wl,ly1-amp*0.3-35);X.lineTo(lx+wl,ly1-amp*0.3-25);X.stroke();
X.fillStyle='rgba(245,158,11,0.8)';X.textAlign='center';X.fillText('λ = '+wl+'px',lx+wl/2,ly1-amp*0.3-38);X.textAlign='left';
// amplitude
const ax=startX+30;
X.strokeStyle='rgba(16,185,129,0.6)';
X.beginPath();X.moveTo(ax-15,cy);X.lineTo(ax-15,cy-amp);X.stroke();
X.beginPath();X.moveTo(ax-20,cy);X.lineTo(ax-10,cy);X.stroke();
X.beginPath();X.moveTo(ax-20,cy-amp);X.lineTo(ax-10,cy-amp);X.stroke();
X.fillStyle='rgba(16,185,129,0.8)';X.fillText('A='+amp,ax-12,cy-amp/2+4);
}
}else{
// longitudinal wave
const spacing=(W-60)/nParts;
for(let i=0;i<nParts;i++){
const restX=startX+i*spacing;
const displacement=amp*0.5*Math.sin(2*Math.PI*(restX/wl-freq*time));
const px=restX+displacement;
const density=1+0.6*Math.cos(2*Math.PI*(restX/wl-freq*time));
const r=3+density*3;
X.beginPath();X.arc(px,cy,r,0,Math.PI*2);
X.fillStyle='rgba(139,92,246,'+(0.3+density*0.3)+')';X.fill();
// motion arrow
if(showParts&&Math.abs(displacement)>2){
X.beginPath();X.moveTo(px,cy+15);X.lineTo(px+displacement*0.3,cy+15);
X.strokeStyle='rgba(245,158,11,0.5)';X.lineWidth=1;X.stroke();
}
}
if(showLabels){
X.fillStyle='rgba(255,255,255,0.4)';X.font='10px system-ui';
X.fillText('← Rarefaction',W*0.2,cy+50);X.fillText('Compression →',W*0.5,cy+50);
}
}
// direction arrow
X.fillStyle='rgba(255,255,255,0.3)';X.font='11px system-ui';
X.fillText('Wave direction →',W/2-50,H-30);
// measurements
const T=freq>0?1/freq:Infinity;
document.getElementById('meas').innerHTML=
'Speed v: <span class="val">'+(v).toFixed(1)+'</span> px/s<br>'+
'Period T: <span class="val">'+T.toFixed(3)+'</span> s<br>'+
'Frequency f: <span class="val">'+freq.toFixed(1)+'</span> Hz<br>'+
'Wavelength λ: <span class="val">'+wl+'</span> px<br>'+
'Amplitude A: <span class="val">'+amp+'</span> px';
}
function loop(){requestAnimationFrame(loop);if(!paused)time+=1/60;draw()}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){time=0;paused=false}
});
<\/script></body></html>`;

// ── Circuit Builder ─────────────────────────────────────────────────────────
const CIRCUIT_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block;cursor:crosshair}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(59,130,246,0.25);border-color:rgba(59,130,246,0.5);color:#60a5fa}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#60a5fa;font-weight:700}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#60a5fa}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Components</div>
<button id="bBat" class="active">🔋 Battery</button>
<button id="bRes">⚡ Resistor</button>
<button id="bBulb">💡 Bulb</button>
<button id="bSwitch">🔌 Switch</button>
<button id="bWire">➖ Wire</button>
</div>
<div class="sec">
<div class="sec-title">Presets</div>
<button id="pSeries">Series Circuit</button>
<button id="pParallel">Parallel Circuit</button>
<button id="pClear">Clear All</button>
</div>
<div class="sec">
<div class="sec-title">Battery</div>
<label>Voltage <span id="vV">9</span> V</label>
<input type="range" id="sV" min="1" max="24" value="9" step="1">
</div>
<div class="sec">
<div class="sec-title">Readings</div>
<div class="info" id="readings">Build a circuit to see readings</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>Ohm's Law:</b> V = IR<br><br>
<b>Series:</b> R_total = R₁ + R₂ + ...<br>
Same current through all<br><br>
<b>Parallel:</b> 1/R = 1/R₁ + 1/R₂ + ...<br>
Same voltage across all<br><br>
<b>Power:</b> P = VI = I²R = V²/R
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let voltage=9,components=[],wires=[],selectedComp='battery',dragging=null,dragOff={x:0,y:0};
let switchOn=true,electrons=[];
const sV=document.getElementById('sV');
sV.oninput=()=>{voltage=+sV.value;document.getElementById('vV').textContent=voltage;calc()};
['bBat','bRes','bBulb','bSwitch','bWire'].forEach(id=>{
document.getElementById(id).onclick=()=>{
document.querySelectorAll('#right-panel .sec:first-child button').forEach(b=>b.classList.remove('active'));
document.getElementById(id).classList.add('active');
selectedComp={bBat:'battery',bRes:'resistor',bBulb:'bulb',bSwitch:'switch',bWire:'wire'}[id];
}});
function addComp(type,x,y){
const c={type,x,y,w:60,h:40,r:type==='resistor'?100:type==='bulb'?200:0};
components.push(c);return c;
}
function buildSeries(){
components=[];wires=[];electrons=[];switchOn=true;
const cx=W/2,cy=H/2;
const bat=addComp('battery',cx-150,cy-100);
const r1=addComp('resistor',cx+50,cy-100);
const bulb=addComp('bulb',cx+50,cy+60);
const sw=addComp('switch',cx-150,cy+60);
wires.push({from:bat,to:r1},{from:r1,to:bulb},{from:bulb,to:sw},{from:sw,to:bat});
initElectrons();calc();
}
function buildParallel(){
components=[];wires=[];electrons=[];switchOn=true;
const cx=W/2,cy=H/2;
const bat=addComp('battery',cx-180,cy);
const r1=addComp('resistor',cx+40,cy-60);
const r2=addComp('bulb',cx+40,cy+60);
wires.push({from:bat,to:r1},{from:bat,to:r2},{from:r1,to:bat},{from:r2,to:bat});
initElectrons();calc();
}
document.getElementById('pSeries').onclick=buildSeries;
document.getElementById('pParallel').onclick=buildParallel;
document.getElementById('pClear').onclick=()=>{components=[];wires=[];electrons=[];document.getElementById('readings').innerHTML='Build a circuit'};
function initElectrons(){
electrons=[];
wires.forEach(w=>{
for(let i=0;i<6;i++){electrons.push({wire:w,t:Math.random(),speed:0.003})}
});
}
function calc(){
if(components.length===0)return;
const resistors=components.filter(c=>c.type==='resistor'||c.type==='bulb');
if(resistors.length===0){document.getElementById('readings').innerHTML='Add resistors/bulbs';return}
const totalR=resistors.reduce((s,c)=>s+c.r,0);
const I=switchOn?voltage/totalR:0;
const P=voltage*I;
document.getElementById('readings').innerHTML=
'Voltage: <span class="val">'+voltage+'</span> V<br>'+
'Total R: <span class="val">'+totalR+'</span> Ω<br>'+
'Current: <span class="val">'+I.toFixed(3)+'</span> A<br>'+
'Power: <span class="val">'+P.toFixed(2)+'</span> W<br>'+
(switchOn?'<span style="color:#10b981">Circuit: ON</span>':'<span style="color:#ef4444">Circuit: OFF</span>');
}
C.onmousedown=e=>{
const mx=e.offsetX,my=e.offsetY;
// check switch toggle
for(const c of components){
if(c.type==='switch'&&mx>c.x&&mx<c.x+c.w&&my>c.y&&my<c.y+c.h){switchOn=!switchOn;calc();return}
}
// drag existing
for(const c of components){
if(mx>c.x&&mx<c.x+c.w&&my>c.y&&my<c.y+c.h){dragging=c;dragOff={x:mx-c.x,y:my-c.y};return}
}
// place new
if(selectedComp!=='wire')addComp(selectedComp,mx-30,my-20);
calc();
};
C.onmousemove=e=>{if(dragging){dragging.x=e.offsetX-dragOff.x;dragging.y=e.offsetY-dragOff.y}};
C.onmouseup=()=>{dragging=null};
function drawComp(c){
X.save();
if(c.type==='battery'){
X.fillStyle='rgba(245,158,11,0.3)';X.strokeStyle='rgba(245,158,11,0.7)';X.lineWidth=2;
X.fillRect(c.x,c.y,c.w,c.h);X.strokeRect(c.x,c.y,c.w,c.h);
X.fillStyle='#f59e0b';X.font='bold 9px system-ui';X.textAlign='center';
X.fillText(voltage+'V',c.x+c.w/2,c.y+c.h/2+3);
X.fillText('+',c.x+c.w-8,c.y+12);X.fillText('−',c.x+8,c.y+12);
}else if(c.type==='resistor'){
X.fillStyle='rgba(59,130,246,0.2)';X.strokeStyle='rgba(59,130,246,0.6)';X.lineWidth=2;
X.fillRect(c.x,c.y,c.w,c.h);X.strokeRect(c.x,c.y,c.w,c.h);
// zigzag
X.beginPath();const zx=c.x+8,zy=c.y+c.h/2;
X.moveTo(zx,zy);for(let i=0;i<5;i++){X.lineTo(zx+4+i*9,zy+(i%2?-8:8))}X.lineTo(c.x+c.w-8,zy);
X.strokeStyle='rgba(59,130,246,0.8)';X.lineWidth=1.5;X.stroke();
X.fillStyle='#60a5fa';X.font='8px system-ui';X.textAlign='center';X.fillText(c.r+'Ω',c.x+c.w/2,c.y-4);
}else if(c.type==='bulb'){
X.fillStyle=switchOn?'rgba(253,224,71,0.3)':'rgba(255,255,255,0.05)';
X.strokeStyle=switchOn?'rgba(253,224,71,0.7)':'rgba(255,255,255,0.2)';X.lineWidth=2;
X.beginPath();X.arc(c.x+c.w/2,c.y+c.h/2,18,0,Math.PI*2);X.fill();X.stroke();
if(switchOn){X.beginPath();X.arc(c.x+c.w/2,c.y+c.h/2,24,0,Math.PI*2);X.fillStyle='rgba(253,224,71,0.08)';X.fill()}
X.fillStyle=switchOn?'#fde047':'rgba(255,255,255,0.3)';X.font='12px system-ui';X.textAlign='center';X.fillText('💡',c.x+c.w/2,c.y+c.h/2+5);
X.fillStyle='rgba(255,255,255,0.5)';X.font='8px system-ui';X.fillText(c.r+'Ω',c.x+c.w/2,c.y-4);
}else if(c.type==='switch'){
X.fillStyle='rgba(16,185,129,0.15)';X.strokeStyle=switchOn?'rgba(16,185,129,0.6)':'rgba(239,68,68,0.6)';X.lineWidth=2;
X.fillRect(c.x,c.y,c.w,c.h);X.strokeRect(c.x,c.y,c.w,c.h);
X.beginPath();X.arc(c.x+12,c.y+c.h/2,4,0,Math.PI*2);X.fillStyle=switchOn?'#10b981':'#ef4444';X.fill();
X.beginPath();X.arc(c.x+c.w-12,c.y+c.h/2,4,0,Math.PI*2);X.fill();
if(switchOn){X.beginPath();X.moveTo(c.x+12,c.y+c.h/2);X.lineTo(c.x+c.w-12,c.y+c.h/2);X.strokeStyle='#10b981';X.lineWidth=2;X.stroke()}
else{X.beginPath();X.moveTo(c.x+12,c.y+c.h/2);X.lineTo(c.x+c.w-12,c.y+c.h/2-15);X.strokeStyle='#ef4444';X.lineWidth=2;X.stroke()}
X.fillStyle='rgba(255,255,255,0.4)';X.font='8px system-ui';X.textAlign='center';X.fillText(switchOn?'ON':'OFF',c.x+c.w/2,c.y+c.h+12);
}
X.textAlign='left';X.restore();
}
function draw(){
X.clearRect(0,0,W,H);
// grid
X.strokeStyle='rgba(255,255,255,0.03)';X.lineWidth=1;
for(let y=0;y<H;y+=30){X.beginPath();X.moveTo(0,y);X.lineTo(W,y);X.stroke()}
for(let x=0;x<W;x+=30){X.beginPath();X.moveTo(x,0);X.lineTo(x,H);X.stroke()}
// wires
wires.forEach(w=>{
X.beginPath();
X.moveTo(w.from.x+w.from.w/2,w.from.y+w.from.h/2);
X.lineTo(w.to.x+w.to.w/2,w.to.y+w.to.h/2);
X.strokeStyle=switchOn?'rgba(59,130,246,0.4)':'rgba(255,255,255,0.1)';X.lineWidth=2;X.stroke();
});
// electrons
if(switchOn){
electrons.forEach(el=>{
el.t+=el.speed;if(el.t>1)el.t-=1;
const fx=el.wire.from.x+el.wire.from.w/2,fy=el.wire.from.y+el.wire.from.h/2;
const tx=el.wire.to.x+el.wire.to.w/2,ty=el.wire.to.y+el.wire.to.h/2;
const ex=fx+(tx-fx)*el.t,ey=fy+(ty-fy)*el.t;
X.beginPath();X.arc(ex,ey,2.5,0,Math.PI*2);X.fillStyle='rgba(96,165,250,0.8)';X.fill();
});
}
components.forEach(drawComp);
if(components.length===0){
X.fillStyle='rgba(255,255,255,0.2)';X.font='14px system-ui';X.textAlign='center';
X.fillText('Click a component, then click the canvas to place it',W/2,H/2-10);
X.fillText('Or use a preset circuit from the right panel',W/2,H/2+14);
X.textAlign='left';
}
}
function loop(){requestAnimationFrame(loop);draw()}
loop();calc();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){components=[];wires=[];electrons=[];switchOn=true}
});
<\/script></body></html>`;

// ── DC Motor ───────────────────────────────────────────────────────────────
const MOTOR_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#f59e0b}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#f59e0b;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Motor Controls</div>
<label>Voltage <span id="vV">12</span> V</label>
<input type="range" id="sV" min="0" max="24" value="12" step="1">
<label>Field Strength <span id="vB">80</span>%</label>
<input type="range" id="sB" min="10" max="100" value="80" step="1">
<label>Coil Turns <span id="vN">4</span></label>
<input type="range" id="sN" min="1" max="8" value="4" step="1">
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<button id="bToggle">Start Motor</button>
<button id="bReverse">Reverse Direction</button>
<button id="bLabels">Toggle Labels</button>
</div>
<div class="sec">
<div class="sec-title">Readings</div>
<div class="info" id="readings">Press Start to begin</div>
</div>
<div class="sec">
<div class="sec-title">How DC Motor Works</div>
<div class="info">
<b>Principle:</b> A current-carrying coil in a magnetic field experiences a force (F = BIL).<br><br>
<b>Components:</b><br>
• Magnets (N/S) create field<br>
• Coil carries current<br>
• Commutator reverses current every half turn<br>
• Brushes maintain contact<br><br>
<b>Fleming's Left-Hand Rule:</b><br>
Thumb=Force, Index=Field, Middle=Current
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let voltage=12,fieldStrength=0.8,nTurns=4,running=false,angle=0,direction=1,showLabels=true;
const sV=document.getElementById('sV'),sB=document.getElementById('sB'),sN=document.getElementById('sN');
sV.oninput=()=>{voltage=+sV.value;document.getElementById('vV').textContent=voltage};
sB.oninput=()=>{fieldStrength=(+sB.value)/100;document.getElementById('vB').textContent=+sB.value};
sN.oninput=()=>{nTurns=+sN.value;document.getElementById('vN').textContent=nTurns};
document.getElementById('bToggle').onclick=()=>{running=!running;document.getElementById('bToggle').textContent=running?'Stop Motor':'Start Motor'};
document.getElementById('bReverse').onclick=()=>{direction*=-1};
document.getElementById('bLabels').onclick=()=>{showLabels=!showLabels};
function draw(){
X.clearRect(0,0,W,H);
const cx=W*0.42,cy=H*0.45,R=Math.min(W,H)*0.22;
// Magnetic field lines
X.strokeStyle='rgba(59,130,246,0.15)';X.lineWidth=1;
for(let i=-3;i<=3;i++){
const y=cy+i*25;
X.beginPath();X.moveTo(cx-R*1.6,y);X.lineTo(cx+R*1.6,y);X.stroke();
// arrows
X.fillStyle='rgba(59,130,246,0.3)';
X.beginPath();X.moveTo(cx+20,y);X.lineTo(cx+14,y-3);X.lineTo(cx+14,y+3);X.closePath();X.fill();
}
// Magnets
X.fillStyle='rgba(239,68,68,0.3)';X.strokeStyle='rgba(239,68,68,0.6)';X.lineWidth=2;
X.fillRect(cx-R*1.6-30,cy-R*0.8,30,R*1.6);X.strokeRect(cx-R*1.6-30,cy-R*0.8,30,R*1.6);
X.fillStyle='#ef4444';X.font='bold 16px system-ui';X.textAlign='center';X.fillText('N',cx-R*1.6-15,cy+6);
X.fillStyle='rgba(59,130,246,0.3)';X.strokeStyle='rgba(59,130,246,0.6)';
X.fillRect(cx+R*1.6,cy-R*0.8,30,R*1.6);X.strokeRect(cx+R*1.6,cy-R*0.8,30,R*1.6);
X.fillStyle='#3b82f6';X.fillText('S',cx+R*1.6+15,cy+6);X.textAlign='left';
// Coil
X.save();X.translate(cx,cy);X.rotate(angle);
for(let t=0;t<nTurns;t++){
const offset=(t-nTurns/2+0.5)*6;
X.strokeStyle='rgba(245,158,11,0.7)';X.lineWidth=2.5;
X.beginPath();X.ellipse(0,0,R*0.7+offset,R*0.4,0,0,Math.PI*2);X.stroke();
}
// current direction arrows on coil
const currentDir=direction*(Math.cos(angle)>0?1:-1);
X.fillStyle='rgba(245,158,11,0.9)';X.font='14px system-ui';X.textAlign='center';
X.fillText(currentDir>0?'→':'←',R*0.7,0);
X.fillText(currentDir>0?'←':'→',-R*0.7,0);
// Force arrows
if(running&&showLabels){
const forceScale=voltage*fieldStrength*0.5;
// up force on left side
X.strokeStyle='rgba(16,185,129,0.8)';X.lineWidth=2;
X.beginPath();X.moveTo(-R*0.7,0);X.lineTo(-R*0.7,-forceScale);X.stroke();
X.fillStyle='rgba(16,185,129,0.8)';X.beginPath();X.moveTo(-R*0.7,-forceScale);X.lineTo(-R*0.7-5,-forceScale+8);X.lineTo(-R*0.7+5,-forceScale+8);X.closePath();X.fill();
// down force on right
X.beginPath();X.moveTo(R*0.7,0);X.lineTo(R*0.7,forceScale);X.stroke();
X.beginPath();X.moveTo(R*0.7,forceScale);X.lineTo(R*0.7-5,forceScale-8);X.lineTo(R*0.7+5,forceScale-8);X.closePath();X.fill();
}
X.restore();
// Commutator (split ring)
X.save();X.translate(cx,cy+R*0.4+20);
X.rotate(angle);
X.beginPath();X.arc(0,0,12,0,Math.PI);X.strokeStyle='rgba(245,158,11,0.6)';X.lineWidth=3;X.stroke();
X.beginPath();X.arc(0,0,12,Math.PI,Math.PI*2);X.strokeStyle='rgba(139,92,246,0.6)';X.lineWidth=3;X.stroke();
X.restore();
// Brushes
X.fillStyle='rgba(156,163,175,0.5)';
X.fillRect(cx-18,cy+R*0.4+30,8,16);X.fillRect(cx+10,cy+R*0.4+30,8,16);
// Labels
if(showLabels){
X.fillStyle='rgba(255,255,255,0.5)';X.font='10px system-ui';X.textAlign='center';
X.fillText('Commutator',cx,cy+R*0.4+60);
X.fillText('Brushes',cx,cy+R*0.4+72);
X.fillText('B field →',cx,cy-R*0.5-10);
if(running){X.fillStyle='rgba(16,185,129,0.6)';X.fillText('Force (F=BIL)',cx-R*0.7-40,cy-10)}
}
// RPM indicator
const speed=running?voltage*fieldStrength*direction*2:0;
const rpm=Math.abs(speed*60/(2*Math.PI)).toFixed(0);
document.getElementById('readings').innerHTML=
'Speed: <span class="val">'+rpm+'</span> RPM<br>'+
'Direction: <span class="val">'+(direction>0?'Clockwise':'Counter-CW')+'</span><br>'+
'Torque ∝ BIN: <span class="val">'+(voltage*fieldStrength*nTurns*0.1).toFixed(1)+'</span><br>'+
'Status: '+(running?'<span style="color:#10b981">Running</span>':'<span style="color:#ef4444">Stopped</span>');
}
function loop(){
requestAnimationFrame(loop);
if(running){
const speed=voltage*fieldStrength*direction*0.002;
angle+=speed;
}
draw();
}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){angle=0;running=false;document.getElementById('bToggle').textContent='Start Motor'}
});
<\/script></body></html>`;

// ── Electric Fields ────────────────────────────────────────────────────────
const EFIELD_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block;cursor:crosshair}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(139,92,246,0.25);border-color:rgba(139,92,246,0.5);color:#8b5cf6}
.btns{display:flex;gap:4px;margin-bottom:8px}
.btns button{flex:1}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#8b5cf6;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Place Charges</div>
<div class="btns"><button id="bPos" class="active">+ Charge</button><button id="bNeg">− Charge</button></div>
</div>
<div class="sec">
<div class="sec-title">Presets</div>
<button id="pDipole">Dipole</button>
<button id="pSame">Two Positive</button>
<button id="pQuad">Quadrupole</button>
<button id="pClear">Clear All</button>
</div>
<div class="sec">
<div class="sec-title">Display</div>
<button id="bLines">Toggle Field Lines</button>
<button id="bVectors">Toggle Vector Field</button>
<button id="bPotential">Toggle Potential</button>
</div>
<div class="sec">
<div class="sec-title">Info</div>
<div class="info" id="info">Click canvas to place charges. Drag to move them.</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>Coulomb's Law:</b><br>
F = kq₁q₂/r²<br><br>
<b>Electric field:</b><br>
E = kQ/r² (away from +, toward −)<br><br>
<b>Field lines:</b><br>
• Start on + charges, end on −<br>
• Never cross<br>
• Density ∝ field strength<br><br>
k = 8.99 × 10⁹ N⋅m²/C²
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let charges=[],placeType=1,dragging=null,dragOff={x:0,y:0};
let showLines=true,showVectors=false,showPotential=false;
document.getElementById('bPos').onclick=()=>{placeType=1;document.getElementById('bPos').classList.add('active');document.getElementById('bNeg').classList.remove('active')};
document.getElementById('bNeg').onclick=()=>{placeType=-1;document.getElementById('bNeg').classList.add('active');document.getElementById('bPos').classList.remove('active')};
document.getElementById('bLines').onclick=()=>{showLines=!showLines};
document.getElementById('bVectors').onclick=()=>{showVectors=!showVectors};
document.getElementById('bPotential').onclick=()=>{showPotential=!showPotential};
function preset(arr){charges=arr.map(a=>({x:W*a[0],y:H*a[1],q:a[2]}))}
document.getElementById('pDipole').onclick=()=>preset([[0.35,0.5,1],[0.65,0.5,-1]]);
document.getElementById('pSame').onclick=()=>preset([[0.35,0.5,1],[0.65,0.5,1]]);
document.getElementById('pQuad').onclick=()=>preset([[0.35,0.35,1],[0.65,0.35,-1],[0.35,0.65,-1],[0.65,0.65,1]]);
document.getElementById('pClear').onclick=()=>{charges=[]};
C.onmousedown=e=>{
const mx=e.offsetX,my=e.offsetY;
for(const c of charges){
if(Math.hypot(mx-c.x,my-c.y)<20){dragging=c;dragOff={x:mx-c.x,y:my-c.y};return}
}
charges.push({x:mx,y:my,q:placeType});
};
C.onmousemove=e=>{if(dragging){dragging.x=e.offsetX-dragOff.x;dragging.y=e.offsetY-dragOff.y}};
C.onmouseup=()=>{dragging=null};
function fieldAt(px,py){
let ex=0,ey=0;
for(const c of charges){
const dx=px-c.x,dy=py-c.y;
const r2=dx*dx+dy*dy;
if(r2<100)continue;
const r=Math.sqrt(r2);
const E=c.q*5000/r2;
ex+=E*dx/r;ey+=E*dy/r;
}
return{x:ex,y:ey};
}
function potentialAt(px,py){
let V=0;
for(const c of charges){
const r=Math.hypot(px-c.x,py-c.y);
if(r<10)continue;
V+=c.q*500/r;
}
return V;
}
function draw(){
X.clearRect(0,0,W,H);
// potential heatmap
if(showPotential&&charges.length>0){
const step=8;
for(let y=0;y<H;y+=step){
for(let x=0;x<W;x+=step){
const V=potentialAt(x,y);
const clamped=Math.max(-1,Math.min(1,V/3));
if(clamped>0)X.fillStyle='rgba(239,68,68,'+(clamped*0.15)+')';
else X.fillStyle='rgba(59,130,246,'+(-clamped*0.15)+')';
X.fillRect(x,y,step,step);
}}
}
// vector field
if(showVectors&&charges.length>0){
const step=35;
for(let y=20;y<H;y+=step){
for(let x=20;x<W;x+=step){
const f=fieldAt(x,y);
const mag=Math.sqrt(f.x*f.x+f.y*f.y);
if(mag<0.01)continue;
const len=Math.min(mag*2,15);
const nx=f.x/mag,ny=f.y/mag;
X.beginPath();X.moveTo(x,y);X.lineTo(x+nx*len,y+ny*len);
X.strokeStyle='rgba(139,92,246,'+Math.min(0.6,mag*0.05)+')';X.lineWidth=1;X.stroke();
X.beginPath();X.moveTo(x+nx*len,y+ny*len);X.lineTo(x+nx*len-ny*3-nx*3,y+ny*len+nx*3-ny*3);
X.lineTo(x+nx*len+ny*3-nx*3,y+ny*len-nx*3-ny*3);X.closePath();
X.fillStyle='rgba(139,92,246,'+Math.min(0.6,mag*0.05)+')';X.fill();
}}
}
// field lines
if(showLines&&charges.length>0){
for(const c of charges){
if(c.q<=0)continue;
const nLines=12;
for(let i=0;i<nLines;i++){
const a=(i/nLines)*Math.PI*2;
let lx=c.x+Math.cos(a)*15,ly=c.y+Math.sin(a)*15;
X.beginPath();X.moveTo(lx,ly);
for(let s=0;s<300;s++){
const f=fieldAt(lx,ly);
const mag=Math.sqrt(f.x*f.x+f.y*f.y);
if(mag<0.01)break;
lx+=f.x/mag*3;ly+=f.y/mag*3;
if(lx<0||lx>W||ly<0||ly>H)break;
X.lineTo(lx,ly);
let hitNeg=false;
for(const ch of charges){if(ch.q<0&&Math.hypot(lx-ch.x,ly-ch.y)<12){hitNeg=true;break}}
if(hitNeg)break;
}
X.strokeStyle='rgba(139,92,246,0.35)';X.lineWidth=1.2;X.stroke();
}
}
}
// charges
for(const c of charges){
const grad=X.createRadialGradient(c.x,c.y,0,c.x,c.y,25);
if(c.q>0){grad.addColorStop(0,'rgba(239,68,68,0.6)');grad.addColorStop(1,'rgba(239,68,68,0)')}
else{grad.addColorStop(0,'rgba(59,130,246,0.6)');grad.addColorStop(1,'rgba(59,130,246,0)')}
X.fillStyle=grad;X.beginPath();X.arc(c.x,c.y,25,0,Math.PI*2);X.fill();
X.beginPath();X.arc(c.x,c.y,14,0,Math.PI*2);
X.fillStyle=c.q>0?'rgba(239,68,68,0.8)':'rgba(59,130,246,0.8)';X.fill();
X.strokeStyle=c.q>0?'#ef4444':'#3b82f6';X.lineWidth=2;X.stroke();
X.fillStyle='#fff';X.font='bold 14px system-ui';X.textAlign='center';X.textBaseline='middle';
X.fillText(c.q>0?'+':'−',c.x,c.y);X.textBaseline='alphabetic';X.textAlign='left';
}
if(charges.length===0){
X.fillStyle='rgba(255,255,255,0.2)';X.font='14px system-ui';X.textAlign='center';
X.fillText('Click to place charges, or use a preset',W/2,H/2);X.textAlign='left';
}
document.getElementById('info').innerHTML=charges.length+' charge'+(charges.length!==1?'s':'')+' placed<br>Drag to reposition';
}
function loop(){requestAnimationFrame(loop);draw()}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){charges=[]}
});
<\/script></body></html>`;

// ── Sound Waves ────────────────────────────────────────────────────────────
const SOUND_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#f97316}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(249,115,22,0.25);border-color:rgba(249,115,22,0.5);color:#f97316}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#f97316;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Sound Source</div>
<label>Frequency <span id="vF">440</span> Hz</label>
<input type="range" id="sF" min="20" max="2000" value="440" step="10">
<label>Amplitude <span id="vA">70</span>%</label>
<input type="range" id="sA" min="10" max="100" value="70" step="1">
<label>Medium speed <span id="vS">343</span> m/s</label>
<input type="range" id="sS" min="100" max="1500" value="343" step="1">
</div>
<div class="sec">
<div class="sec-title">Medium</div>
<button id="mAir" class="active">Air (343 m/s)</button>
<button id="mWater">Water (1480 m/s)</button>
<button id="mSteel">Steel (5120 m/s)</button>
</div>
<div class="sec">
<div class="sec-title">Visualisation</div>
<button id="bWave">Waveform</button>
<button id="bPressure">Pressure View</button>
<button id="bPlay">🔊 Play Tone</button>
</div>
<div class="sec">
<div class="sec-title">Readings</div>
<div class="info" id="readings">Adjust frequency to explore</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>Sound</b> is a longitudinal pressure wave.<br><br>
v = fλ<br>
λ = v/f<br><br>
<b>Human hearing:</b> 20 Hz – 20,000 Hz<br>
<b>Speed in air:</b> ~343 m/s (20°C)<br>
<b>Speed in water:</b> ~1480 m/s<br>
<b>Speed in steel:</b> ~5120 m/s
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let freq=440,amp=0.7,speed=343,time=0,showPressure=false,audioCtx=null,osc=null,playing=false;
const sF=document.getElementById('sF'),sA=document.getElementById('sA'),sS=document.getElementById('sS');
sF.oninput=()=>{freq=+sF.value;document.getElementById('vF').textContent=freq;if(osc)osc.frequency.value=freq;update()};
sA.oninput=()=>{amp=(+sA.value)/100;document.getElementById('vA').textContent=+sA.value;update()};
sS.oninput=()=>{speed=+sS.value;document.getElementById('vS').textContent=speed;update()};
document.getElementById('mAir').onclick=()=>{speed=343;sS.value=343;document.getElementById('vS').textContent=343;update()};
document.getElementById('mWater').onclick=()=>{speed=1480;sS.value=1480;document.getElementById('vS').textContent=1480;update()};
document.getElementById('mSteel').onclick=()=>{speed=5120;sS.value=1500;document.getElementById('vS').textContent=5120;update()};
document.getElementById('bWave').onclick=()=>{showPressure=false};
document.getElementById('bPressure').onclick=()=>{showPressure=true};
document.getElementById('bPlay').onclick=()=>{
if(!playing){
audioCtx=new(window.AudioContext||window.webkitAudioContext)();
osc=audioCtx.createOscillator();const gain=audioCtx.createGain();
osc.frequency.value=freq;gain.gain.value=0.15;
osc.connect(gain);gain.connect(audioCtx.destination);osc.start();
playing=true;document.getElementById('bPlay').textContent='🔇 Stop';
}else{osc.stop();audioCtx.close();playing=false;document.getElementById('bPlay').textContent='🔊 Play Tone'}
};
function update(){
const wl=speed/freq;
document.getElementById('readings').innerHTML=
'Frequency: <span class="val">'+freq+'</span> Hz<br>'+
'Wavelength: <span class="val">'+wl.toFixed(3)+'</span> m<br>'+
'Period: <span class="val">'+(1/freq*1000).toFixed(2)+'</span> ms<br>'+
'Speed: <span class="val">'+speed+'</span> m/s<br>'+
(freq<20?'<span style="color:#ef4444">Infrasound</span>':freq>20000?'<span style="color:#ef4444">Ultrasound</span>':'<span style="color:#10b981">Audible range</span>');
}
update();
function draw(){
X.clearRect(0,0,W,H);
const cy=H/2,wl=speed/freq,pixelWL=Math.max(20,Math.min(W*0.8,(speed/freq)*2));
if(!showPressure){
// waveform
X.beginPath();
for(let px=0;px<W;px++){
const y=cy+amp*(H*0.3)*Math.sin(2*Math.PI*(px/pixelWL-freq*time*0.001));
px===0?X.moveTo(px,y):X.lineTo(px,y);
}
X.strokeStyle='rgba(249,115,22,0.8)';X.lineWidth=2.5;X.stroke();
// equilibrium
X.setLineDash([4,4]);X.strokeStyle='rgba(255,255,255,0.1)';X.lineWidth=1;
X.beginPath();X.moveTo(0,cy);X.lineTo(W,cy);X.stroke();X.setLineDash([]);
// speaker icon
X.fillStyle='rgba(249,115,22,0.4)';X.beginPath();
X.moveTo(20,cy-30);X.lineTo(40,cy-20);X.lineTo(40,cy+20);X.lineTo(20,cy+30);X.closePath();X.fill();
X.fillRect(10,cy-20,12,40);
// sound rings
for(let r=1;r<=4;r++){
X.beginPath();X.arc(45,cy,r*25,Math.PI*-0.4,Math.PI*0.4);
X.strokeStyle='rgba(249,115,22,'+(0.4-r*0.08)+')';X.lineWidth=2;X.stroke();
}
}else{
// pressure bars
const nBars=80;
for(let i=0;i<nBars;i++){
const px=(i/nBars)*W;
const pressure=Math.sin(2*Math.PI*(px/pixelWL-freq*time*0.001));
const barH=Math.abs(pressure)*amp*H*0.3;
const alpha=0.2+Math.abs(pressure)*0.5;
X.fillStyle=pressure>0?'rgba(249,115,22,'+alpha+')':'rgba(59,130,246,'+alpha+')';
X.fillRect(px,cy-barH,W/nBars-1,barH*2);
}
X.fillStyle='rgba(255,255,255,0.3)';X.font='10px system-ui';X.textAlign='center';
X.fillText('Compression (+)',W/2,40);X.fillText('Rarefaction (−)',W/2,H-30);X.textAlign='left';
}
// frequency label
const noteNames=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const noteNum=12*Math.log2(freq/440)+69;
const note=noteNames[Math.round(noteNum)%12];
X.fillStyle='rgba(255,255,255,0.4)';X.font='12px system-ui';
X.fillText(freq+' Hz ≈ '+note,W-120,30);
}
function loop(){requestAnimationFrame(loop);time+=16.67;draw()}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){time=0;if(playing){osc.stop();audioCtx.close();playing=false;document.getElementById('bPlay').textContent='🔊 Play Tone'}}
});
<\/script></body></html>`;

// ── Doppler Effect ─────────────────────────────────────────────────────────
const DOPPLER_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#ec4899}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#ec4899;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Source</div>
<label>Source freq <span id="vF">500</span> Hz</label>
<input type="range" id="sF" min="100" max="2000" value="500" step="10">
<label>Source speed <span id="vVs">60</span> m/s</label>
<input type="range" id="sVs" min="0" max="330" value="60" step="5">
</div>
<div class="sec">
<div class="sec-title">Observer</div>
<label>Observer speed <span id="vVo">0</span> m/s</label>
<input type="range" id="sVo" min="0" max="200" value="0" step="5">
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<button id="bReset">Reset Position</button>
<button id="bPause">Pause</button>
</div>
<div class="sec">
<div class="sec-title">Observed Frequencies</div>
<div class="info" id="readings">Press play to observe</div>
</div>
<div class="sec">
<div class="sec-title">Doppler Equation</div>
<div class="info">
<b>f' = f × (v ± v_o) / (v ∓ v_s)</b><br><br>
v = speed of sound (343 m/s)<br>
v_s = source speed<br>
v_o = observer speed<br>
f = source frequency<br><br>
<b>Approaching:</b> pitch ↑ (compressed)<br>
<b>Receding:</b> pitch ↓ (stretched)<br><br>
If v_s > v → <b>sonic boom</b> (Mach cone)
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
const v=343;
let srcFreq=500,srcSpeed=60,obsSpeed=0,paused=false;
let srcX=-200,time=0,wavefronts=[];
const sF=document.getElementById('sF'),sVs=document.getElementById('sVs'),sVo=document.getElementById('sVo');
sF.oninput=()=>{srcFreq=+sF.value;document.getElementById('vF').textContent=srcFreq};
sVs.oninput=()=>{srcSpeed=+sVs.value;document.getElementById('vVs').textContent=srcSpeed};
sVo.oninput=()=>{obsSpeed=+sVo.value;document.getElementById('vVo').textContent=obsSpeed};
document.getElementById('bReset').onclick=()=>{srcX=-200;time=0;wavefronts=[]};
document.getElementById('bPause').onclick=()=>{paused=!paused;document.getElementById('bPause').textContent=paused?'Play':'Pause'};
function draw(){
X.clearRect(0,0,W,H);
const cy=H/2;
const scale=W/(800);
const sxPx=W/2+(srcX*scale);
const obsX=W*0.75;
// wavefronts
wavefronts.forEach(wf=>{
const r=wf.r*scale;
const cx2=W/2+wf.ox*scale;
if(r>0&&r<W){
X.beginPath();X.arc(cx2,cy,r,0,Math.PI*2);
const alpha=Math.max(0,0.4-r/(W*0.8));
X.strokeStyle='rgba(236,72,153,'+alpha+')';X.lineWidth=1.5;X.stroke();
}
});
// source (car/ambulance icon)
X.fillStyle='rgba(236,72,153,0.6)';X.strokeStyle='rgba(236,72,153,0.8)';X.lineWidth=2;
X.beginPath();X.arc(sxPx,cy,12,0,Math.PI*2);X.fill();X.stroke();
X.fillStyle='#fff';X.font='bold 9px system-ui';X.textAlign='center';X.fillText('SRC',sxPx,cy+3);
// direction arrow
if(srcSpeed>0){
X.beginPath();X.moveTo(sxPx+18,cy);X.lineTo(sxPx+35,cy);X.strokeStyle='rgba(236,72,153,0.5)';X.lineWidth=2;X.stroke();
X.beginPath();X.moveTo(sxPx+35,cy);X.lineTo(sxPx+29,cy-4);X.lineTo(sxPx+29,cy+4);X.closePath();X.fillStyle='rgba(236,72,153,0.5)';X.fill();
}
// observer
X.fillStyle='rgba(59,130,246,0.6)';X.strokeStyle='rgba(59,130,246,0.8)';X.lineWidth=2;
X.beginPath();X.arc(obsX,cy,12,0,Math.PI*2);X.fill();X.stroke();
X.fillStyle='#fff';X.fillText('OBS',obsX,cy+3);X.textAlign='left';
// compression/stretch labels
X.fillStyle='rgba(239,68,68,0.5)';X.font='11px system-ui';X.textAlign='center';
if(srcSpeed>0){
X.fillText('Compressed (higher pitch)',sxPx+80,cy-40);
X.fillStyle='rgba(59,130,246,0.5)';
X.fillText('Stretched (lower pitch)',sxPx-80,cy-40);
}
X.textAlign='left';
// calculate observed frequencies
const fApproach=srcFreq*(v+obsSpeed)/(v-Math.min(srcSpeed,v-1));
const fRecede=srcFreq*(v-obsSpeed)/(v+srcSpeed);
const mach=srcSpeed/v;
document.getElementById('readings').innerHTML=
'Source: <span class="val">'+srcFreq+'</span> Hz<br>'+
'Approaching: <span class="val">'+fApproach.toFixed(1)+'</span> Hz<br>'+
'Receding: <span class="val">'+fRecede.toFixed(1)+'</span> Hz<br>'+
'Mach number: <span class="val">'+mach.toFixed(2)+'</span><br>'+
(mach>=1?'<span style="color:#ef4444">⚠ Supersonic! Sonic boom</span>':'<span style="color:#10b981">Subsonic</span>');
// mach cone if supersonic
if(mach>=1){
const halfAngle=Math.asin(1/mach);
X.save();X.translate(sxPx,cy);
X.beginPath();X.moveTo(0,0);X.lineTo(-200,Math.tan(halfAngle)*200);X.moveTo(0,0);X.lineTo(-200,-Math.tan(halfAngle)*200);
X.strokeStyle='rgba(239,68,68,0.4)';X.lineWidth=2;X.stroke();
X.restore();
}
}
const dt=1/60;
function loop(){
requestAnimationFrame(loop);
if(!paused){
time+=dt;
srcX+=srcSpeed*dt;
// emit wavefronts
if(Math.floor(time*srcFreq)>Math.floor((time-dt)*srcFreq)){
wavefronts.push({ox:srcX,r:0});
}
wavefronts.forEach(wf=>{wf.r+=v*dt});
wavefronts=wavefronts.filter(wf=>wf.r*W/800<W*1.5);
if(srcX>600){srcX=-200;wavefronts=[]}
}
draw();
}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){srcX=-200;time=0;wavefronts=[];paused=false;document.getElementById('bPause').textContent='Pause'}
});
<\/script></body></html>`;

// ── EM Spectrum ────────────────────────────────────────────────────────────
const EM_SPECTRUM_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(168,85,247,0.25);border-color:rgba(168,85,247,0.5);color:#a855f7}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#a855f7;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Select Region</div>
<button id="b0">Radio Waves</button>
<button id="b1">Microwaves</button>
<button id="b2">Infrared</button>
<button id="b3" class="active">Visible Light</button>
<button id="b4">Ultraviolet</button>
<button id="b5">X-Rays</button>
<button id="b6">Gamma Rays</button>
</div>
<div class="sec">
<div class="sec-title">Selected Region</div>
<div class="info" id="info">Visible Light</div>
</div>
<div class="sec">
<div class="sec-title">Key Facts</div>
<div class="info">
<b>All EM waves travel at c</b> = 3×10⁸ m/s in vacuum.<br><br>
c = fλ<br>
E = hf (photon energy)<br>
h = 6.63×10⁻³⁴ J⋅s<br><br>
↑ frequency = ↑ energy = ↓ wavelength<br><br>
Radio → Micro → IR → <b>Visible</b> → UV → X-ray → Gamma
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
const regions=[
{name:'Radio Waves',wl:'> 1 m',freq:'< 3×10⁸ Hz',color:'#ef4444',uses:'Broadcasting, communication, MRI',source:'Antennas, stars',danger:'Safe — non-ionising'},
{name:'Microwaves',wl:'1 mm – 1 m',freq:'3×10⁸ – 3×10¹¹ Hz',color:'#f97316',uses:'Microwave ovens, radar, Wi-Fi, satellite',source:'Magnetrons, cosmic background',danger:'Can heat tissue'},
{name:'Infrared',wl:'700 nm – 1 mm',freq:'3×10¹¹ – 4.3×10¹⁴ Hz',color:'#f59e0b',uses:'Thermal imaging, remote controls, heating',source:'Warm objects, fires',danger:'Burns if intense'},
{name:'Visible Light',wl:'400 – 700 nm',freq:'4.3×10¹⁴ – 7.5×10¹⁴ Hz',color:'#10b981',uses:'Vision, photography, fibre optics',source:'Sun, LEDs, lasers',danger:'Eye damage if intense'},
{name:'Ultraviolet',wl:'10 – 400 nm',freq:'7.5×10¹⁴ – 3×10¹⁶ Hz',color:'#8b5cf6',uses:'Sterilisation, fluorescence, tanning',source:'Sun, UV lamps',danger:'Sunburn, skin cancer'},
{name:'X-Rays',wl:'0.01 – 10 nm',freq:'3×10¹⁶ – 3×10¹⁹ Hz',color:'#3b82f6',uses:'Medical imaging, airport security',source:'X-ray tubes, neutron stars',danger:'Cell damage, cancer risk'},
{name:'Gamma Rays',wl:'< 0.01 nm',freq:'> 3×10¹⁹ Hz',color:'#ec4899',uses:'Cancer treatment, sterilisation',source:'Nuclear decay, supernovae',danger:'Highly ionising, very dangerous'},
];
let selected=3,time=0;
regions.forEach((r,i)=>{
document.getElementById('b'+i).onclick=()=>{
selected=i;
document.querySelectorAll('#right-panel .sec:first-child button').forEach(b=>b.classList.remove('active'));
document.getElementById('b'+i).classList.add('active');
updateInfo();
}});
function updateInfo(){
const r=regions[selected];
document.getElementById('info').innerHTML=
'<b style="color:'+r.color+'">'+r.name+'</b><br><br>'+
'Wavelength: <span class="val">'+r.wl+'</span><br>'+
'Frequency: <span class="val">'+r.freq+'</span><br><br>'+
'<b>Uses:</b> '+r.uses+'<br><br>'+
'<b>Source:</b> '+r.source+'<br><br>'+
'<b>Danger:</b> '+r.danger;
}
updateInfo();
function draw(){
X.clearRect(0,0,W,H);
const barH=80,barY=H/2-barH/2,margin=40;
const barW=W-margin*2;
// spectrum bar
const grad=X.createLinearGradient(margin,0,margin+barW,0);
grad.addColorStop(0,'#ef4444');grad.addColorStop(0.15,'#f97316');grad.addColorStop(0.28,'#f59e0b');
grad.addColorStop(0.38,'#ef4444');grad.addColorStop(0.42,'#f97316');grad.addColorStop(0.46,'#facc15');
grad.addColorStop(0.50,'#22c55e');grad.addColorStop(0.54,'#3b82f6');grad.addColorStop(0.58,'#6366f1');grad.addColorStop(0.62,'#8b5cf6');
grad.addColorStop(0.75,'#3b82f6');grad.addColorStop(0.88,'#ec4899');grad.addColorStop(1,'#ec4899');
X.fillStyle=grad;
X.beginPath();X.roundRect(margin,barY,barW,barH,8);X.fill();
// region labels
const segW=barW/7;
regions.forEach((r,i)=>{
const rx=margin+i*segW;
const rw=segW;
// highlight selected
if(i===selected){
X.strokeStyle=r.color;X.lineWidth=3;
X.beginPath();X.roundRect(rx+2,barY-4,rw-4,barH+8,6);X.stroke();
X.fillStyle=r.color+'20';X.beginPath();X.roundRect(rx+2,barY-4,rw-4,barH+8,6);X.fill();
}
// label
X.fillStyle='rgba(255,255,255,0.8)';X.font='bold 9px system-ui';X.textAlign='center';
const words=r.name.split(' ');
words.forEach((w,wi)=>{X.fillText(w,rx+rw/2,barY+barH+18+wi*12)});
});
// wavelength arrow
X.fillStyle='rgba(255,255,255,0.3)';X.font='11px system-ui';X.textAlign='left';
X.fillText('← Long wavelength',margin,barY-20);
X.textAlign='right';X.fillText('Short wavelength →',margin+barW,barY-20);
X.textAlign='center';X.fillText('Low frequency →',margin+barW*0.25,barY-40);
X.fillText('← High frequency',margin+barW*0.75,barY-40);
// animated wave for selected region
const r=regions[selected];
const waveY=barY+barH+70+(regions[0].name.split(' ').length>1?12:0)+20;
const waveAmp=30;
const waveFreq=1+selected*3;// visual frequency increases with region
X.beginPath();
for(let px=margin;px<margin+barW;px++){
const y=waveY+waveAmp*Math.sin(2*Math.PI*(px/(barW/(waveFreq)))-time*3);
px===margin?X.moveTo(px,y):X.lineTo(px,y);
}
X.strokeStyle=r.color;X.lineWidth=2;X.stroke();
X.fillStyle=r.color;X.font='10px system-ui';X.textAlign='center';
X.fillText(r.name+' wave pattern',margin+barW/2,waveY+waveAmp+25);
// energy arrow at top
const arrowY=40;
X.strokeStyle='rgba(255,255,255,0.15)';X.lineWidth=1;
X.beginPath();X.moveTo(margin,arrowY);X.lineTo(margin+barW,arrowY);X.stroke();
X.fillStyle='rgba(255,255,255,0.25)';X.font='10px system-ui';
X.textAlign='left';X.fillText('Low energy',margin,arrowY-8);
X.textAlign='right';X.fillText('High energy',margin+barW,arrowY-8);
X.textAlign='left';
}
function loop(){requestAnimationFrame(loop);time+=1/60;draw()}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){time=0;selected=3;updateInfo()}
});
<\/script></body></html>`;

// ── Gas Laws ───────────────────────────────────────────────────────────────
const GAS_LAWS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#10b981}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(16,185,129,0.25);border-color:rgba(16,185,129,0.5);color:#10b981}
.btns{display:flex;gap:4px;margin-bottom:8px}
.btns button{flex:1;font-size:9px}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#10b981;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Gas Law</div>
<div class="btns"><button id="bBoyle" class="active">Boyle's</button><button id="bCharles">Charles's</button><button id="bPressure">Pressure</button></div>
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<label>Temperature <span id="vT">300</span> K</label>
<input type="range" id="sT" min="100" max="800" value="300" step="10">
<label>Volume <span id="vV">50</span>%</label>
<input type="range" id="sV" min="20" max="100" value="50" step="1">
<label>Particles <span id="vN">40</span></label>
<input type="range" id="sN" min="10" max="80" value="40" step="1">
</div>
<div class="sec">
<div class="sec-title">Readings</div>
<div class="info" id="readings">Adjust sliders</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info" id="theory">
<b>Boyle's Law:</b> PV = constant (at constant T)<br>P₁V₁ = P₂V₂<br><br>
<b>Charles's Law:</b> V/T = constant (at constant P)<br>V₁/T₁ = V₂/T₂<br><br>
<b>Pressure Law:</b> P/T = constant (at constant V)<br>P₁/T₁ = P₂/T₂<br><br>
<b>Ideal Gas:</b> PV = nRT
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let law='boyle',temp=300,volume=50,nParts=40;
let particles=[];
function initParticles(){
particles=[];
for(let i=0;i<nParts;i++){
particles.push({x:Math.random(),y:Math.random(),vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2});
}
}
initParticles();
const sT=document.getElementById('sT'),sV=document.getElementById('sV'),sN=document.getElementById('sN');
sT.oninput=()=>{temp=+sT.value;document.getElementById('vT').textContent=temp};
sV.oninput=()=>{volume=+sV.value;document.getElementById('vV').textContent=volume};
sN.oninput=()=>{nParts=+sN.value;document.getElementById('vN').textContent=nParts;initParticles()};
document.getElementById('bBoyle').onclick=()=>{law='boyle';document.querySelectorAll('.btns button').forEach(b=>b.classList.remove('active'));document.getElementById('bBoyle').classList.add('active')};
document.getElementById('bCharles').onclick=()=>{law='charles';document.querySelectorAll('.btns button').forEach(b=>b.classList.remove('active'));document.getElementById('bCharles').classList.add('active')};
document.getElementById('bPressure').onclick=()=>{law='pressure';document.querySelectorAll('.btns button').forEach(b=>b.classList.remove('active'));document.getElementById('bPressure').classList.add('active')};
function draw(){
X.clearRect(0,0,W,H);
const cx=W*0.42,cy=H*0.5;
const maxW=Math.min(W*0.6,H*0.7);
const boxW=maxW*(volume/100);
const boxH=maxW*0.6;
const bx=cx-boxW/2,by=cy-boxH/2;
// container
X.strokeStyle='rgba(16,185,129,0.5)';X.lineWidth=3;
X.strokeRect(bx,by,boxW,boxH);
// piston on right
X.fillStyle='rgba(16,185,129,0.2)';X.fillRect(bx+boxW-8,by,8,boxH);
X.strokeStyle='rgba(16,185,129,0.7)';X.lineWidth=2;
X.beginPath();X.moveTo(bx+boxW,by);X.lineTo(bx+boxW,by+boxH);X.stroke();
// piston handle
X.strokeStyle='rgba(255,255,255,0.2)';X.lineWidth=4;
X.beginPath();X.moveTo(bx+boxW,cy);X.lineTo(bx+boxW+30,cy);X.stroke();
// temperature color
const tNorm=(temp-100)/700;
const r=Math.floor(50+tNorm*200),g=Math.floor(50+50*(1-tNorm)),b2=Math.floor(200-tNorm*150);
X.fillStyle='rgba('+r+','+g+','+b2+',0.05)';X.fillRect(bx,by,boxW,boxH);
// particles
const speed=Math.sqrt(temp/300)*2;
particles.forEach(p=>{
p.x+=p.vx*speed*0.005;p.y+=p.vy*speed*0.005;
if(p.x<0){p.x=0;p.vx*=-1}if(p.x>1){p.x=1;p.vx*=-1}
if(p.y<0){p.y=0;p.vy*=-1}if(p.y>1){p.y=1;p.vy*=-1}
const px=bx+p.x*boxW,py=by+p.y*boxH;
X.beginPath();X.arc(px,py,3,0,Math.PI*2);
X.fillStyle='rgba('+r+','+g+','+b2+',0.8)';X.fill();
});
// pressure calculation
const P=(nParts*temp)/(volume*10);
// graph area
const gx=20,gy=H-170,gw=W*0.35,gh=140;
X.fillStyle='rgba(0,0,0,0.3)';X.fillRect(gx,gy,gw,gh);
X.strokeStyle='rgba(255,255,255,0.1)';X.lineWidth=1;X.strokeRect(gx,gy,gw,gh);
// draw PV, VT, or PT graph
X.beginPath();
if(law==='boyle'){
X.fillStyle='rgba(255,255,255,0.3)';X.font='9px system-ui';X.fillText('P vs V (Boyle\'s Law)',gx+4,gy+12);
X.fillText('V →',gx+gw-20,gy+gh-4);X.fillText('P ↑',gx+4,gy+24);
for(let i=0;i<gw;i++){
const v2=20+i*(80/gw);
const p2=(nParts*temp)/(v2*10);
const py=gy+gh-10-(p2/15)*gh*0.8;
i===0?X.moveTo(gx+10+i,Math.max(gy,py)):X.lineTo(gx+10+i,Math.max(gy,py));
}
}else if(law==='charles'){
X.fillStyle='rgba(255,255,255,0.3)';X.font='9px system-ui';X.fillText('V vs T (Charles\'s Law)',gx+4,gy+12);
X.fillText('T →',gx+gw-20,gy+gh-4);X.fillText('V ↑',gx+4,gy+24);
for(let i=0;i<gw;i++){
const t2=100+i*(700/gw);
const v2=volume*(t2/temp);
const py=gy+gh-10-(v2/150)*gh*0.8;
i===0?X.moveTo(gx+10+i,Math.max(gy,py)):X.lineTo(gx+10+i,Math.max(gy,py));
}
}else{
X.fillStyle='rgba(255,255,255,0.3)';X.font='9px system-ui';X.fillText('P vs T (Pressure Law)',gx+4,gy+12);
X.fillText('T →',gx+gw-20,gy+gh-4);X.fillText('P ↑',gx+4,gy+24);
for(let i=0;i<gw;i++){
const t2=100+i*(700/gw);
const p2=(nParts*t2)/(volume*10);
const py=gy+gh-10-(p2/15)*gh*0.8;
i===0?X.moveTo(gx+10+i,Math.max(gy,py)):X.lineTo(gx+10+i,Math.max(gy,py));
}
}
X.strokeStyle='rgba(16,185,129,0.7)';X.lineWidth=2;X.stroke();
// current point on graph
const dotX=gx+10+(law==='boyle'?(volume-20)/(80)*gw:law==='charles'?(temp-100)/700*gw:(temp-100)/700*gw);
const dotY=law==='boyle'?gy+gh-10-(P/15)*gh*0.8:law==='charles'?gy+gh-10-(volume/150)*gh*0.8:gy+gh-10-(P/15)*gh*0.8;
X.beginPath();X.arc(dotX,Math.max(gy+5,dotY),5,0,Math.PI*2);X.fillStyle='#10b981';X.fill();
document.getElementById('readings').innerHTML=
'Pressure: <span class="val">'+P.toFixed(1)+'</span> kPa<br>'+
'Volume: <span class="val">'+volume+'</span>%<br>'+
'Temperature: <span class="val">'+temp+'</span> K<br>'+
'Particles: <span class="val">'+nParts+'</span><br>'+
'Avg KE ∝ T: <span class="val">'+(temp*0.0138).toFixed(2)+'</span> ×10⁻²¹ J';
}
function loop(){requestAnimationFrame(loop);draw()}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){temp=300;volume=50;sT.value=300;sV.value=50;document.getElementById('vT').textContent=300;document.getElementById('vV').textContent=50}
});
<\/script></body></html>`;

// ── Heat Transfer ──────────────────────────────────────────────────────────
const HEAT_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(239,68,68,0.25);border-color:rgba(239,68,68,0.5);color:#ef4444}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#ef4444;font-weight:700}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#ef4444}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Transfer Type</div>
<button id="bCond" class="active">Conduction</button>
<button id="bConv">Convection</button>
<button id="bRad">Radiation</button>
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<label>Hot temp <span id="vH">400</span> °C</label>
<input type="range" id="sH" min="100" max="800" value="400" step="10">
<label>Cold temp <span id="vC">20</span> °C</label>
<input type="range" id="sC" min="-20" max="100" value="20" step="5">
<button id="bReset">Reset</button>
</div>
<div class="sec">
<div class="sec-title">Info</div>
<div class="info" id="info">Select a transfer type</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>Conduction:</b> Heat flows through a material via particle vibrations. Metals are good conductors.<br><br>
<b>Convection:</b> Hot fluid rises, cool fluid sinks — creating convection currents (liquids & gases only).<br><br>
<b>Radiation:</b> Heat transfer via infrared EM waves. No medium needed. All objects emit radiation.
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let mode='conduction',hotT=400,coldT=20,time=0,particles=[];
const sH=document.getElementById('sH'),sC=document.getElementById('sC');
sH.oninput=()=>{hotT=+sH.value;document.getElementById('vH').textContent=hotT};
sC.oninput=()=>{coldT=+sC.value;document.getElementById('vC').textContent=coldT};
document.getElementById('bCond').onclick=()=>{mode='conduction';setActive('bCond');initParticles()};
document.getElementById('bConv').onclick=()=>{mode='convection';setActive('bConv');initParticles()};
document.getElementById('bRad').onclick=()=>{mode='radiation';setActive('bRad');initParticles()};
document.getElementById('bReset').onclick=()=>{time=0;initParticles()};
function setActive(id){document.querySelectorAll('.sec:first-child button').forEach(b=>b.classList.remove('active'));document.getElementById(id).classList.add('active')}
function initParticles(){
particles=[];
for(let i=0;i<60;i++){
particles.push({x:Math.random()*W*0.7,y:Math.random()*H,vx:0,vy:0,temp:coldT+(hotT-coldT)*Math.random()});
}
}
initParticles();
function tempColor(t){
const n=Math.max(0,Math.min(1,(t-coldT)/(hotT-coldT+1)));
return 'rgba('+(50+n*205)+','+(50+80*(1-n))+','+(200-n*180)+',0.8)';
}
function draw(){
X.clearRect(0,0,W,H);
const cx=W*0.4,cy=H*0.5;
if(mode==='conduction'){
const barW=W*0.6,barH=60,bx=cx-barW/2,by=cy-barH/2;
// metal bar
const grad=X.createLinearGradient(bx,0,bx+barW,0);
const progress=Math.min(1,time*0.3);
grad.addColorStop(0,'rgba(239,68,68,0.6)');
grad.addColorStop(progress,'rgba(239,68,68,'+(0.6*Math.max(0,1-progress))+')');
grad.addColorStop(1,'rgba(59,130,246,0.3)');
X.fillStyle=grad;X.fillRect(bx,by,barW,barH);
X.strokeStyle='rgba(255,255,255,0.2)';X.lineWidth=2;X.strokeRect(bx,by,barW,barH);
// heat source
X.fillStyle='rgba(239,68,68,0.3)';X.fillRect(bx-40,by-10,40,barH+20);
X.fillStyle='#ef4444';X.font='bold 10px system-ui';X.textAlign='center';X.fillText(hotT+'°C',bx-20,by+barH/2+4);
// cold end
X.fillStyle='rgba(59,130,246,0.3)';X.fillRect(bx+barW,by-10,40,barH+20);
X.fillStyle='#3b82f6';X.fillText(coldT+'°C',bx+barW+20,by+barH/2+4);X.textAlign='left';
// vibrating particles in bar
for(let i=0;i<20;i++){
const frac=i/19;
const t=hotT-(hotT-coldT)*Math.min(1,frac/(progress+0.01));
const vibAmp=(t/hotT)*6;
const px=bx+10+frac*(barW-20);
const py=by+barH/2+Math.sin(time*5+i*2)*vibAmp;
X.beginPath();X.arc(px,py,4,0,Math.PI*2);X.fillStyle=tempColor(t);X.fill();
}
X.fillStyle='rgba(255,255,255,0.3)';X.font='11px system-ui';X.textAlign='center';
X.fillText('Heat flows from hot to cold via particle vibrations',cx,by+barH+40);
document.getElementById('info').innerHTML='<b>Conduction</b><br>Hot end: <span class="val">'+hotT+'</span>°C<br>Cold end: <span class="val">'+coldT+'</span>°C<br>Heat flows → through material';
}else if(mode==='convection'){
const tankW=W*0.5,tankH=H*0.6,tx=cx-tankW/2,ty=cy-tankH/2;
X.strokeStyle='rgba(255,255,255,0.2)';X.lineWidth=2;X.strokeRect(tx,ty,tankW,tankH);
X.fillStyle='rgba(59,130,246,0.08)';X.fillRect(tx,ty,tankW,tankH);
// heat source at bottom
X.fillStyle='rgba(239,68,68,0.4)';X.fillRect(tx+tankW*0.3,ty+tankH-10,tankW*0.4,10);
// convection current arrows
const arrowPath=[
{x:0.5,y:0.9},{x:0.5,y:0.2},{x:0.8,y:0.2},{x:0.8,y:0.8},{x:0.5,y:0.9}
];
X.beginPath();
arrowPath.forEach((p,i)=>{
const px=tx+p.x*tankW,py=ty+p.y*tankH;
i===0?X.moveTo(px,py):X.lineTo(px,py);
});
X.strokeStyle='rgba(239,68,68,0.3)';X.lineWidth=2;X.setLineDash([5,5]);X.stroke();X.setLineDash([]);
// animated particles
particles.forEach(p=>{
const inTank=p.x>tx&&p.x<tx+tankW&&p.y>ty&&p.y<ty+tankH;
if(!inTank){p.x=tx+Math.random()*tankW;p.y=ty+Math.random()*tankH}
const distToHeat=Math.max(0,1-(ty+tankH-p.y)/(tankH*0.3));
p.temp=coldT+(hotT-coldT)*distToHeat;
const rise=(p.temp-coldT)/(hotT-coldT)*-1.5;
p.vy+=rise*0.05;p.vy*=0.98;
if(p.y<ty+20){p.vx+=0.3;p.vy+=0.1}
if(p.y>ty+tankH-20){p.vx-=0.1;p.vy-=0.3}
if(p.x>tx+tankW-20)p.vx-=0.2;
if(p.x<tx+20)p.vx+=0.1;
p.x+=p.vx;p.y+=p.vy;
p.x=Math.max(tx+5,Math.min(tx+tankW-5,p.x));
p.y=Math.max(ty+5,Math.min(ty+tankH-5,p.y));
X.beginPath();X.arc(p.x,p.y,3,0,Math.PI*2);X.fillStyle=tempColor(p.temp);X.fill();
});
X.fillStyle='rgba(255,255,255,0.3)';X.font='11px system-ui';X.textAlign='center';
X.fillText('Hot fluid rises, cool fluid sinks → convection current',cx,ty+tankH+30);
document.getElementById('info').innerHTML='<b>Convection</b><br>Hot fluid rises ↑<br>Cool fluid sinks ↓<br>Creates circular current';
}else{
// radiation — sun emitting waves
const sunR=50;
X.beginPath();X.arc(cx-120,cy,sunR,0,Math.PI*2);
const sg=X.createRadialGradient(cx-120,cy,0,cx-120,cy,sunR);
sg.addColorStop(0,'rgba(253,224,71,0.9)');sg.addColorStop(1,'rgba(239,68,68,0.4)');
X.fillStyle=sg;X.fill();
// radiation waves
for(let r=1;r<=8;r++){
const radius=sunR+r*30+time*20%30;
X.beginPath();X.arc(cx-120,cy,radius,Math.PI*-0.5,Math.PI*0.5);
X.strokeStyle='rgba(239,68,68,'+(0.4-r*0.04)+')';X.lineWidth=2;X.stroke();
}
// object receiving radiation
X.fillStyle='rgba(100,100,100,0.5)';X.strokeStyle='rgba(255,255,255,0.3)';X.lineWidth=2;
X.fillRect(cx+80,cy-30,60,60);X.strokeRect(cx+80,cy-30,60,60);
const objTemp=coldT+(hotT-coldT)*Math.min(1,time*0.1);
X.fillStyle=tempColor(objTemp);X.font='bold 10px system-ui';X.textAlign='center';
X.fillText(objTemp.toFixed(0)+'°C',cx+110,cy+5);
X.fillStyle='rgba(255,255,255,0.3)';X.font='11px system-ui';
X.fillText('IR radiation transfers heat without contact',cx,cy+80);
document.getElementById('info').innerHTML='<b>Radiation</b><br>Source: <span class="val">'+hotT+'</span>°C<br>Object: <span class="val">'+objTemp.toFixed(0)+'</span>°C<br>No medium needed';
}
X.textAlign='left';
}
function loop(){requestAnimationFrame(loop);time+=1/60;draw()}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){time=0;initParticles()}
});
<\/script></body></html>`;

// ── Radioactive Decay ──────────────────────────────────────────────────────
const RADIOACTIVE_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#a855f7}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(168,85,247,0.25);border-color:rgba(168,85,247,0.5);color:#a855f7}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#a855f7;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Sample</div>
<label>Initial atoms <span id="vN">200</span></label>
<input type="range" id="sN" min="50" max="500" value="200" step="10">
<label>Half-life <span id="vHL">3</span> s</label>
<input type="range" id="sHL" min="1" max="20" value="3" step="1">
</div>
<div class="sec">
<div class="sec-title">Decay Type</div>
<button id="bAlpha" class="active">α Alpha</button>
<button id="bBeta">β Beta</button>
<button id="bGamma">γ Gamma</button>
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<button id="bStart">Start Decay</button>
<button id="bReset">Reset</button>
</div>
<div class="sec">
<div class="sec-title">Readings</div>
<div class="info" id="readings">Press Start</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>Half-life:</b> time for half the atoms to decay.<br><br>
N = N₀ × (½)^(t/T½)<br><br>
<b>α decay:</b> emits He-4 nucleus (2p+2n), mass −4, charge −2<br><br>
<b>β decay:</b> neutron → proton + electron, mass same, charge +1<br><br>
<b>γ decay:</b> emits high-energy photon, no mass/charge change<br><br>
<b>Activity:</b> A = λN = (ln2/T½)×N
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let initN=200,halfLife=3,decayType='alpha',running=false,time=0,atoms=[],decayed=0,history=[];
const sN=document.getElementById('sN'),sHL=document.getElementById('sHL');
sN.oninput=()=>{initN=+sN.value;document.getElementById('vN').textContent=initN};
sHL.oninput=()=>{halfLife=+sHL.value;document.getElementById('vHL').textContent=halfLife};
document.getElementById('bAlpha').onclick=()=>{decayType='alpha';setActive('bAlpha')};
document.getElementById('bBeta').onclick=()=>{decayType='beta';setActive('bBeta')};
document.getElementById('bGamma').onclick=()=>{decayType='gamma';setActive('bGamma')};
function setActive(id){document.querySelectorAll('.sec:nth-child(2) button').forEach(b=>b.classList.remove('active'));document.getElementById(id).classList.add('active')}
function initAtoms(){
atoms=[];decayed=0;history=[];time=0;
const cols=Math.ceil(Math.sqrt(initN*1.5)),rows=Math.ceil(initN/cols);
const sx=30,sy=30,sp=Math.min((W*0.7-60)/cols,(H*0.5-60)/rows,14);
for(let i=0;i<initN;i++){
const r=Math.floor(i/cols),col=i%cols;
atoms.push({x:sx+col*sp+sp/2,y:sy+r*sp+sp/2,alive:true,decayTime:Infinity});
}
}
initAtoms();
document.getElementById('bStart').onclick=()=>{
if(!running){initAtoms();
const lambda=Math.log(2)/halfLife;
atoms.forEach(a=>{a.decayTime=-Math.log(Math.random())/lambda});
running=true;document.getElementById('bStart').textContent='Running...'}
};
document.getElementById('bReset').onclick=()=>{running=false;initAtoms();document.getElementById('bStart').textContent='Start Decay'};
function draw(){
X.clearRect(0,0,W,H);
let alive=0;
atoms.forEach(a=>{
if(a.alive&&time>=a.decayTime){a.alive=false;decayed++}
X.beginPath();X.arc(a.x,a.y,4,0,Math.PI*2);
if(a.alive){X.fillStyle='rgba(168,85,247,0.8)';alive++}
else{X.fillStyle='rgba(100,100,100,0.3)'}
X.fill();
});
// decay particles animation
if(running){
atoms.forEach(a=>{
if(!a.alive&&time-a.decayTime<1){
const dt=time-a.decayTime;
const col=decayType==='alpha'?'rgba(239,68,68,':'rgba(59,130,246,';
if(decayType!=='gamma'){
X.beginPath();X.arc(a.x+dt*30,a.y-dt*20,2,0,Math.PI*2);
X.fillStyle=col+(1-dt)+')';X.fill();
}else{
X.strokeStyle='rgba(253,224,71,'+(1-dt)+')';X.lineWidth=1;
X.beginPath();X.moveTo(a.x,a.y);
for(let w=0;w<30*dt;w+=4){X.lineTo(a.x+w,a.y-2+Math.sin(w)*4)}X.stroke();
}
}
});
}
// decay curve graph
const gx=20,gy=H*0.55,gw=W*0.55,gh=H*0.35;
X.fillStyle='rgba(0,0,0,0.3)';X.fillRect(gx,gy,gw,gh);
X.strokeStyle='rgba(255,255,255,0.1)';X.lineWidth=1;X.strokeRect(gx,gy,gw,gh);
X.fillStyle='rgba(255,255,255,0.3)';X.font='9px system-ui';
X.fillText('N vs t (Decay Curve)',gx+4,gy+12);
X.fillText('t →',gx+gw-15,gy+gh-4);X.fillText('N ↑',gx+4,gy+24);
// theoretical curve
X.beginPath();
const maxT=halfLife*6;
for(let i=0;i<=gw;i++){
const t2=(i/gw)*maxT;
const n=initN*Math.pow(0.5,t2/halfLife);
const py=gy+gh-10-(n/initN)*(gh-20);
i===0?X.moveTo(gx+i,py):X.lineTo(gx+i,py);
}
X.strokeStyle='rgba(168,85,247,0.4)';X.lineWidth=1.5;X.setLineDash([4,4]);X.stroke();X.setLineDash([]);
// actual data
if(history.length>1){
X.beginPath();
history.forEach((h,i)=>{
const px=gx+(h.t/maxT)*gw;
const py=gy+gh-10-(h.n/initN)*(gh-20);
i===0?X.moveTo(px,py):X.lineTo(px,py);
});
X.strokeStyle='rgba(168,85,247,0.8)';X.lineWidth=2;X.stroke();
}
// half-life markers
for(let hl=1;hl<=5;hl++){
const tx=gx+(hl*halfLife/maxT)*gw;
if(tx<gx+gw){
X.setLineDash([2,4]);X.strokeStyle='rgba(255,255,255,0.1)';X.lineWidth=1;
X.beginPath();X.moveTo(tx,gy);X.lineTo(tx,gy+gh);X.stroke();X.setLineDash([]);
X.fillStyle='rgba(255,255,255,0.2)';X.font='8px system-ui';X.fillText('T½×'+hl,tx-8,gy+gh+12);
}
}
document.getElementById('readings').innerHTML=
'Time: <span class="val">'+time.toFixed(1)+'</span> s<br>'+
'Remaining: <span class="val">'+alive+'</span> / '+initN+'<br>'+
'Decayed: <span class="val">'+decayed+'</span><br>'+
'Half-lives passed: <span class="val">'+(time/halfLife).toFixed(1)+'</span><br>'+
'Activity: <span class="val">'+(Math.log(2)/halfLife*alive).toFixed(1)+'</span> decays/s<br>'+
'Type: <span class="val">'+decayType+'</span>';
}
const dt=1/60;
let histTimer=0;
function loop(){
requestAnimationFrame(loop);
if(running){
time+=dt;histTimer+=dt;
if(histTimer>0.2){
histTimer=0;
const alive=atoms.filter(a=>a.alive).length;
history.push({t:time,n:alive});
if(alive===0){running=false;document.getElementById('bStart').textContent='Start Decay'}
}
}
draw();
}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){running=false;initAtoms();document.getElementById('bStart').textContent='Start Decay'}
});
<\/script></body></html>`;

// ── Momentum & Collisions ──────────────────────────────────────────────────
const MOMENTUM_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#3b82f6}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(59,130,246,0.25);border-color:rgba(59,130,246,0.5);color:#60a5fa}
.btns{display:flex;gap:4px;margin-bottom:8px}
.btns button{flex:1;font-size:9px}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#60a5fa;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Collision Type</div>
<div class="btns"><button id="bElastic" class="active">Elastic</button><button id="bInelastic">Inelastic</button></div>
</div>
<div class="sec">
<div class="sec-title">Object A (Blue)</div>
<label>Mass A <span id="vMA">3</span> kg</label>
<input type="range" id="sMA" min="1" max="20" value="3" step="1">
<label>Velocity A <span id="vVA">5</span> m/s</label>
<input type="range" id="sVA" min="-10" max="10" value="5" step="1">
</div>
<div class="sec">
<div class="sec-title">Object B (Red)</div>
<label>Mass B <span id="vMB">5</span> kg</label>
<input type="range" id="sMB" min="1" max="20" value="5" step="1">
<label>Velocity B <span id="vVB">-3</span> m/s</label>
<input type="range" id="sVB" min="-10" max="10" value="-3" step="1">
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<button id="bLaunch">Launch</button>
<button id="bReset">Reset</button>
</div>
<div class="sec">
<div class="sec-title">Before / After</div>
<div class="info" id="readings">Set up and launch</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>Conservation of Momentum:</b><br>m₁v₁ + m₂v₂ = m₁v₁' + m₂v₂'<br><br>
<b>Elastic:</b> KE conserved<br>
<b>Inelastic:</b> objects stick, KE lost<br><br>
p = mv, KE = ½mv²
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let mA=3,mB=5,vA=5,vB=-3,elastic=true,running=false,collided=false;
let posA,posB,curVA,curVB,finalVA,finalVB;
const sMA=document.getElementById('sMA'),sMB=document.getElementById('sMB'),sVA=document.getElementById('sVA'),sVB=document.getElementById('sVB');
sMA.oninput=()=>{mA=+sMA.value;document.getElementById('vMA').textContent=mA};
sMB.oninput=()=>{mB=+sMB.value;document.getElementById('vMB').textContent=mB};
sVA.oninput=()=>{vA=+sVA.value;document.getElementById('vVA').textContent=vA};
sVB.oninput=()=>{vB=+sVB.value;document.getElementById('vVB').textContent=vB};
document.getElementById('bElastic').onclick=()=>{elastic=true;document.getElementById('bElastic').classList.add('active');document.getElementById('bInelastic').classList.remove('active')};
document.getElementById('bInelastic').onclick=()=>{elastic=false;document.getElementById('bInelastic').classList.add('active');document.getElementById('bElastic').classList.remove('active')};
function reset(){
running=false;collided=false;
posA=W*0.25;posB=W*0.65;
curVA=0;curVB=0;
}
reset();
document.getElementById('bLaunch').onclick=()=>{reset();curVA=vA;curVB=vB;running=true;collided=false};
document.getElementById('bReset').onclick=reset;
function draw(){
X.clearRect(0,0,W,H);
const cy=H*0.45,ground=cy+60;
// ground
X.strokeStyle='rgba(255,255,255,0.1)';X.lineWidth=1;X.beginPath();X.moveTo(0,ground);X.lineTo(W,ground);X.stroke();
const rA=15+mA*1.5,rB=15+mB*1.5;
// object A
X.beginPath();X.arc(posA,cy,rA,0,Math.PI*2);
X.fillStyle='rgba(59,130,246,0.5)';X.fill();X.strokeStyle='rgba(59,130,246,0.8)';X.lineWidth=2;X.stroke();
X.fillStyle='#fff';X.font='bold 10px system-ui';X.textAlign='center';X.fillText(mA+'kg',posA,cy+4);
// velocity arrow A
if(Math.abs(curVA)>0.1){
const aLen=curVA*8;
X.beginPath();X.moveTo(posA,cy-rA-10);X.lineTo(posA+aLen,cy-rA-10);
X.strokeStyle='rgba(59,130,246,0.7)';X.lineWidth=2;X.stroke();
X.fillStyle='rgba(59,130,246,0.7)';X.font='9px system-ui';X.fillText(curVA.toFixed(1)+' m/s',posA+aLen/2,cy-rA-18);
}
// object B
if(!collided||elastic){
X.beginPath();X.arc(posB,cy,rB,0,Math.PI*2);
X.fillStyle='rgba(239,68,68,0.5)';X.fill();X.strokeStyle='rgba(239,68,68,0.8)';X.lineWidth=2;X.stroke();
X.fillStyle='#fff';X.fillText(mB+'kg',posB,cy+4);
if(Math.abs(curVB)>0.1){
const bLen=curVB*8;
X.beginPath();X.moveTo(posB,cy-rB-10);X.lineTo(posB+bLen,cy-rB-10);
X.strokeStyle='rgba(239,68,68,0.7)';X.lineWidth=2;X.stroke();
X.fillStyle='rgba(239,68,68,0.7)';X.font='9px system-ui';X.fillText(curVB.toFixed(1)+' m/s',posB+bLen/2,cy-rB-18);
}
}else{
// combined mass after inelastic
const combinedR=15+(mA+mB)*1.2;
X.beginPath();X.arc(posA,cy,combinedR,0,Math.PI*2);
const cGrad=X.createLinearGradient(posA-combinedR,cy,posA+combinedR,cy);
cGrad.addColorStop(0,'rgba(59,130,246,0.4)');cGrad.addColorStop(1,'rgba(239,68,68,0.4)');
X.fillStyle=cGrad;X.fill();X.strokeStyle='rgba(168,85,247,0.8)';X.lineWidth=2;X.stroke();
X.fillStyle='#fff';X.fillText((mA+mB)+'kg',posA,cy+4);
}
X.textAlign='left';
// momentum bars at bottom
const barY=H*0.7,barH=30;
const pBefore=mA*vA+mB*vB;
const keBefore=0.5*mA*vA*vA+0.5*mB*vB*vB;
let pAfter=pBefore,keAfter;
if(elastic){
finalVA=((mA-mB)*vA+2*mB*vB)/(mA+mB);
finalVB=((mB-mA)*vB+2*mA*vA)/(mA+mB);
keAfter=0.5*mA*finalVA*finalVA+0.5*mB*finalVB*finalVB;
}else{
const vFinal=pBefore/(mA+mB);
finalVA=finalVB=vFinal;
keAfter=0.5*(mA+mB)*vFinal*vFinal;
}
X.fillStyle='rgba(255,255,255,0.3)';X.font='11px system-ui';
X.fillText('Total momentum before: '+(pBefore).toFixed(1)+' kg⋅m/s',30,barY);
X.fillText('Total momentum after: '+(pAfter).toFixed(1)+' kg⋅m/s',30,barY+20);
X.fillText('KE before: '+keBefore.toFixed(1)+' J    KE after: '+keAfter.toFixed(1)+' J'+(elastic?' (conserved)':' (lost: '+(keBefore-keAfter).toFixed(1)+' J)'),30,barY+40);
document.getElementById('readings').innerHTML=
'<b>Before:</b><br>p_A: <span class="val">'+(mA*vA).toFixed(1)+'</span> | p_B: <span class="val">'+(mB*vB).toFixed(1)+'</span><br>'+
'Total p: <span class="val">'+pBefore.toFixed(1)+'</span> kg⋅m/s<br>'+
'Total KE: <span class="val">'+keBefore.toFixed(1)+'</span> J<br><br>'+
'<b>After:</b><br>v_A\': <span class="val">'+finalVA.toFixed(2)+'</span> | v_B\': <span class="val">'+finalVB.toFixed(2)+'</span><br>'+
'Total p: <span class="val">'+pAfter.toFixed(1)+'</span> kg⋅m/s<br>'+
'Total KE: <span class="val">'+keAfter.toFixed(1)+'</span> J';
}
function loop(){
requestAnimationFrame(loop);
if(running){
const rA=15+mA*1.5,rB=15+mB*1.5;
posA+=curVA*1.5;posB+=curVB*1.5;
if(!collided&&Math.abs(posA-posB)<(rA+rB)){
collided=true;
if(elastic){curVA=finalVA;curVB=finalVB}
else{curVA=(mA*vA+mB*vB)/(mA+mB);curVB=curVA;posB=posA}
}
if(collided&&!elastic){posB=posA}
if(posA<-50||posA>W+50)running=false;
if(posB<-50||posB>W+50)running=false;
}
draw();
}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph')reset();
});
<\/script></body></html>`;

// ── Circular Motion ────────────────────────────────────────────────────────
const CIRCULAR_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#14b8a6}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#14b8a6;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Parameters</div>
<label>Radius <span id="vR">120</span> px</label>
<input type="range" id="sR" min="50" max="250" value="120" step="5">
<label>Speed <span id="vS">3.0</span> m/s</label>
<input type="range" id="sS" min="1" max="80" value="30" step="1">
<label>Mass <span id="vM">2</span> kg</label>
<input type="range" id="sM" min="1" max="20" value="2" step="1">
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<button id="bRelease">Release Object</button>
<button id="bReset">Reset</button>
<button id="bVectors">Toggle Vectors</button>
<button id="bTrail">Toggle Trail</button>
</div>
<div class="sec">
<div class="sec-title">Readings</div>
<div class="info" id="readings">Adjust parameters</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>Centripetal acceleration:</b><br>a = v²/r (toward centre)<br><br>
<b>Centripetal force:</b><br>F = mv²/r<br><br>
<b>Angular velocity:</b><br>ω = v/r = 2πf<br><br>
<b>Period:</b> T = 2πr/v<br><br>
If released, object moves in a straight line (tangent) — Newton's 1st Law.
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let radius=120,speed=3,mass=2,angle=0,released=false,relAngle=0,relX=0,relY=0,relVx=0,relVy=0;
let showVectors=true,showTrail=true,trail=[];
const sR=document.getElementById('sR'),sS=document.getElementById('sS'),sM=document.getElementById('sM');
sR.oninput=()=>{radius=+sR.value;document.getElementById('vR').textContent=radius};
sS.oninput=()=>{speed=(+sS.value)/10;document.getElementById('vS').textContent=speed.toFixed(1)};
sM.oninput=()=>{mass=+sM.value;document.getElementById('vM').textContent=mass};
document.getElementById('bRelease').onclick=()=>{
if(!released){released=true;relAngle=angle;
const cx=W*0.4,cy=H/2;
relX=cx+radius*Math.cos(angle);relY=cy+radius*Math.sin(angle);
relVx=-speed*Math.sin(angle)*40;relVy=speed*Math.cos(angle)*40;
}};
document.getElementById('bReset').onclick=()=>{released=false;trail=[];angle=0};
document.getElementById('bVectors').onclick=()=>{showVectors=!showVectors};
document.getElementById('bTrail').onclick=()=>{showTrail=!showTrail};
function draw(){
X.clearRect(0,0,W,H);
const cx=W*0.4,cy=H/2;
// orbit circle
X.beginPath();X.arc(cx,cy,radius,0,Math.PI*2);
X.strokeStyle='rgba(20,184,166,0.2)';X.lineWidth=1;X.setLineDash([4,4]);X.stroke();X.setLineDash([]);
// centre
X.beginPath();X.arc(cx,cy,4,0,Math.PI*2);X.fillStyle='rgba(255,255,255,0.3)';X.fill();
let objX,objY;
if(!released){
objX=cx+radius*Math.cos(angle);objY=cy+radius*Math.sin(angle);
}else{
objX=relX;objY=relY;
}
// trail
if(showTrail){
trail.push({x:objX,y:objY});if(trail.length>200)trail.shift();
X.beginPath();trail.forEach((p,i)=>{i===0?X.moveTo(p.x,p.y):X.lineTo(p.x,p.y)});
X.strokeStyle='rgba(20,184,166,0.3)';X.lineWidth=1.5;X.stroke();
}
// object
const r=8+mass;
X.beginPath();X.arc(objX,objY,r,0,Math.PI*2);
X.fillStyle='rgba(20,184,166,0.6)';X.fill();X.strokeStyle='rgba(20,184,166,0.9)';X.lineWidth=2;X.stroke();
X.fillStyle='#fff';X.font='bold 9px system-ui';X.textAlign='center';X.fillText(mass+'kg',objX,objY+3);X.textAlign='left';
if(showVectors&&!released){
// velocity (tangent)
const vScale=20;
const vx=-Math.sin(angle)*speed*vScale,vy=Math.cos(angle)*speed*vScale;
X.beginPath();X.moveTo(objX,objY);X.lineTo(objX+vx,objY+vy);
X.strokeStyle='rgba(16,185,129,0.8)';X.lineWidth=2;X.stroke();
drawArrowHead(X,objX+vx,objY+vy,Math.atan2(vy,vx),'rgba(16,185,129,0.8)');
X.fillStyle='rgba(16,185,129,0.8)';X.font='9px system-ui';X.fillText('v',objX+vx+5,objY+vy-5);
// centripetal acceleration (toward centre)
const aScale=5;
const ac=speed*speed/(radius/100);
const ax=(cx-objX)/radius*ac*aScale,ay=(cy-objY)/radius*ac*aScale;
X.beginPath();X.moveTo(objX,objY);X.lineTo(objX+ax,objY+ay);
X.strokeStyle='rgba(239,68,68,0.8)';X.lineWidth=2;X.stroke();
drawArrowHead(X,objX+ax,objY+ay,Math.atan2(ay,ax),'rgba(239,68,68,0.8)');
X.fillStyle='rgba(239,68,68,0.8)';X.fillText('a',objX+ax+5,objY+ay-5);
// string/force line
X.setLineDash([3,3]);X.strokeStyle='rgba(255,255,255,0.2)';X.lineWidth=1;
X.beginPath();X.moveTo(objX,objY);X.lineTo(cx,cy);X.stroke();X.setLineDash([]);
}
if(released){
// tangent direction line from release point
X.setLineDash([4,4]);X.strokeStyle='rgba(16,185,129,0.3)';X.lineWidth=1;
X.beginPath();X.moveTo(cx+radius*Math.cos(relAngle),cy+radius*Math.sin(relAngle));
X.lineTo(cx+radius*Math.cos(relAngle)+relVx*3,cy+radius*Math.sin(relAngle)+relVy*3);X.stroke();X.setLineDash([]);
X.fillStyle='rgba(255,255,255,0.3)';X.font='11px system-ui';X.textAlign='center';
X.fillText('Object released — moves in straight line (tangent)',W*0.4,H-40);X.textAlign='left';
}
const omega=speed/(radius/100);
const T=2*Math.PI/omega;
const F=mass*speed*speed/(radius/100);
const ac=speed*speed/(radius/100);
document.getElementById('readings').innerHTML=
'Centripetal a: <span class="val">'+ac.toFixed(2)+'</span> m/s²<br>'+
'Centripetal F: <span class="val">'+F.toFixed(2)+'</span> N<br>'+
'Angular vel ω: <span class="val">'+omega.toFixed(2)+'</span> rad/s<br>'+
'Period T: <span class="val">'+T.toFixed(2)+'</span> s<br>'+
'Speed v: <span class="val">'+speed.toFixed(1)+'</span> m/s';
}
function drawArrowHead(ctx,x,y,a,color){
ctx.save();ctx.translate(x,y);ctx.rotate(a);
ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-8,-4);ctx.lineTo(-8,4);ctx.closePath();
ctx.fillStyle=color;ctx.fill();ctx.restore();
}
function loop(){
requestAnimationFrame(loop);
if(!released){
angle+=speed*0.02;
}else{
relX+=relVx/60;relY+=relVy/60;
}
draw();
}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){released=false;trail=[];angle=0}
});
<\/script></body></html>`;

// ── Simple Machines ────────────────────────────────────────────────────────
const MACHINES_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;user-select:none}
canvas{display:block}
#right-panel{position:fixed;top:0;right:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.95);border-left:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent;padding:12px}
#right-panel::-webkit-scrollbar{width:4px}#right-panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.sec{margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)}
.sec-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
label{display:flex;justify-content:space-between;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);margin-bottom:4px}
label span{color:#fff;font-weight:600}
input[type=range]{width:100%;margin:2px 0 8px;accent-color:#f59e0b}
button{width:100%;padding:8px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.8);border-radius:8px;cursor:pointer;font-size:11px;font-weight:600;transition:all .2s;margin-bottom:6px}
button:hover{background:rgba(255,255,255,0.14);color:#fff}
button.active{background:rgba(245,158,11,0.25);border-color:rgba(245,158,11,0.5);color:#f59e0b}
.info{font-size:10px;color:rgba(255,255,255,0.5);line-height:1.6;padding:8px;background:rgba(255,255,255,0.04);border-radius:8px;border:1px solid rgba(255,255,255,0.06)}
.val{color:#f59e0b;font-weight:700}
</style></head><body>
<canvas id="c"></canvas>
<div id="right-panel">
<div class="sec">
<div class="sec-title">Machine Type</div>
<button id="bLever" class="active">Lever</button>
<button id="bPulley">Pulley</button>
<button id="bGear">Gears</button>
</div>
<div class="sec">
<div class="sec-title">Controls</div>
<label>Effort force <span id="vE">50</span> N</label>
<input type="range" id="sE" min="10" max="200" value="50" step="5">
<label>Load <span id="vL">100</span> N</label>
<input type="range" id="sL" min="10" max="300" value="100" step="5">
<label>Ratio <span id="vR">2</span></label>
<input type="range" id="sR" min="1" max="6" value="2" step="1">
</div>
<div class="sec">
<div class="sec-title">Readings</div>
<div class="info" id="readings">Select a machine</div>
</div>
<div class="sec">
<div class="sec-title">Theory</div>
<div class="info">
<b>Mechanical Advantage:</b><br>MA = Load / Effort<br><br>
<b>Lever:</b> F₁d₁ = F₂d₂ (moments)<br><br>
<b>Pulley:</b> MA = number of supporting ropes<br><br>
<b>Gears:</b> gear ratio = driven teeth / driver teeth<br>
Smaller driver → more torque, less speed
</div>
</div>
</div>
<script>
const C=document.getElementById('c'),X=C.getContext('2d');
let W,H;function resize(){W=C.width=innerWidth-220;H=C.height=innerHeight}resize();window.onresize=resize;
let machine='lever',effort=50,load=100,ratio=2,time=0;
const sE=document.getElementById('sE'),sL=document.getElementById('sL'),sR=document.getElementById('sR');
sE.oninput=()=>{effort=+sE.value;document.getElementById('vE').textContent=effort};
sL.oninput=()=>{load=+sL.value;document.getElementById('vL').textContent=load};
sR.oninput=()=>{ratio=+sR.value;document.getElementById('vR').textContent=ratio};
function setM(m,id){machine=m;document.querySelectorAll('.sec:first-child button').forEach(b=>b.classList.remove('active'));document.getElementById(id).classList.add('active')}
document.getElementById('bLever').onclick=()=>setM('lever','bLever');
document.getElementById('bPulley').onclick=()=>setM('pulley','bPulley');
document.getElementById('bGear').onclick=()=>setM('gear','bGear');
function draw(){
X.clearRect(0,0,W,H);
const cx=W*0.42,cy=H*0.45;
if(machine==='lever'){
const fulX=cx,fulY=cy+50;
const leverLen=300;
const effortArm=leverLen*ratio/(ratio+1),loadArm=leverLen/(ratio+1);
const tilt=Math.sin(time*2)*0.05*(effort*effortArm>load*loadArm?1:effort*effortArm<load*loadArm?-1:0);
X.save();X.translate(fulX,fulY);X.rotate(tilt);
// lever beam
X.fillStyle='rgba(245,158,11,0.3)';X.strokeStyle='rgba(245,158,11,0.6)';X.lineWidth=2;
X.fillRect(-effortArm,-8,leverLen,16);X.strokeRect(-effortArm,-8,leverLen,16);
// effort side
X.fillStyle='rgba(59,130,246,0.5)';X.fillRect(-effortArm-10,-25,30,25);
X.fillStyle='#60a5fa';X.font='bold 9px system-ui';X.textAlign='center';X.fillText(effort+'N',-effortArm+5,-30);
// load side
X.fillStyle='rgba(239,68,68,0.5)';const loadW=20+load*0.08;X.fillRect(loadArm-loadW/2,-20-load*0.08,loadW,load*0.08+12);
X.fillStyle='#ef4444';X.fillText(load+'N',loadArm,-30-load*0.05);
X.textAlign='left';X.restore();
// fulcrum triangle
X.beginPath();X.moveTo(fulX,fulY);X.lineTo(fulX-15,fulY+25);X.lineTo(fulX+15,fulY+25);X.closePath();
X.fillStyle='rgba(255,255,255,0.2)';X.fill();X.strokeStyle='rgba(255,255,255,0.3)';X.lineWidth=1.5;X.stroke();
// labels
X.fillStyle='rgba(255,255,255,0.4)';X.font='10px system-ui';X.textAlign='center';
X.fillText('Effort arm: '+effortArm.toFixed(0)+'px',fulX-effortArm/2,fulY+50);
X.fillText('Load arm: '+loadArm.toFixed(0)+'px',fulX+loadArm/2,fulY+50);
X.fillText('▲ Fulcrum',fulX,fulY+70);
const MA=effortArm/loadArm;
document.getElementById('readings').innerHTML='MA: <span class="val">'+MA.toFixed(1)+'</span><br>Effort arm: <span class="val">'+effortArm.toFixed(0)+'</span> px<br>Load arm: <span class="val">'+loadArm.toFixed(0)+'</span> px<br>Balanced: '+(Math.abs(effort*effortArm-load*loadArm)<5?'<span style="color:#10b981">Yes ✓</span>':'<span style="color:#ef4444">No</span>');
}else if(machine==='pulley'){
const nPulleys=ratio;
const topY=60,bottomY=cy+100;
for(let p=0;p<nPulleys;p++){
const py=topY+p*50;const px=cx+(p%2)*60-30;
// pulley wheel
X.beginPath();X.arc(px,py,18,0,Math.PI*2);X.strokeStyle='rgba(245,158,11,0.6)';X.lineWidth=2;X.stroke();
X.beginPath();X.arc(px,py,4,0,Math.PI*2);X.fillStyle='rgba(245,158,11,0.4)';X.fill();
}
// rope
X.strokeStyle='rgba(255,255,255,0.3)';X.lineWidth=1.5;
X.beginPath();X.moveTo(cx-30,topY);
for(let p=0;p<nPulleys;p++){
const py=topY+p*50;const px=cx+(p%2)*60-30;
X.lineTo(px,py-18);X.lineTo(px,py+18);
}
X.lineTo(cx,bottomY);X.stroke();
// load
X.fillStyle='rgba(239,68,68,0.5)';X.strokeStyle='rgba(239,68,68,0.7)';X.lineWidth=2;
X.fillRect(cx-20,bottomY,40,40);X.strokeRect(cx-20,bottomY,40,40);
X.fillStyle='#ef4444';X.font='bold 10px system-ui';X.textAlign='center';X.fillText(load+'N',cx,bottomY+25);
// effort arrow
const effortNeeded=load/nPulleys;
X.strokeStyle='rgba(59,130,246,0.7)';X.lineWidth=2;
const ey=topY-20+Math.sin(time*3)*5;
X.beginPath();X.moveTo(cx-40,topY+20);X.lineTo(cx-40,ey);X.stroke();
X.fillStyle='rgba(59,130,246,0.8)';X.fillText(effortNeeded.toFixed(1)+'N ↑',cx-60,ey);
X.textAlign='left';
document.getElementById('readings').innerHTML='Pulleys: <span class="val">'+nPulleys+'</span><br>MA: <span class="val">'+nPulleys+'</span><br>Effort needed: <span class="val">'+effortNeeded.toFixed(1)+'</span> N<br>Load: <span class="val">'+load+'</span> N';
}else{
// gears
const r1=40,r2=r1*ratio;
const g1x=cx-r2*0.3,g2x=cx+r1+r2-r2*0.3;
const gy=cy;
const teeth1=12,teeth2=teeth1*ratio;
const ang1=time*2,ang2=-time*2/ratio;
// draw gear function
function drawGear(gx,gy2,r,teeth,ang,color){
X.save();X.translate(gx,gy2);X.rotate(ang);
X.beginPath();
for(let t=0;t<teeth;t++){
const a1=(t/teeth)*Math.PI*2;
const a2=((t+0.3)/teeth)*Math.PI*2;
const a3=((t+0.5)/teeth)*Math.PI*2;
const a4=((t+0.8)/teeth)*Math.PI*2;
X.lineTo(Math.cos(a1)*(r-5),Math.sin(a1)*(r-5));
X.lineTo(Math.cos(a2)*(r+5),Math.sin(a2)*(r+5));
X.lineTo(Math.cos(a3)*(r+5),Math.sin(a3)*(r+5));
X.lineTo(Math.cos(a4)*(r-5),Math.sin(a4)*(r-5));
}
X.closePath();X.fillStyle=color+'30)';X.fill();X.strokeStyle=color+'80)';X.lineWidth=2;X.stroke();
X.beginPath();X.arc(0,0,6,0,Math.PI*2);X.fillStyle=color+'60)';X.fill();
X.restore();
}
drawGear(g1x,gy,r1,teeth1,ang1,'rgba(59,130,246,0.');
drawGear(g2x,gy,r2,teeth2,ang2,'rgba(239,68,68,0.');
X.fillStyle='rgba(255,255,255,0.4)';X.font='10px system-ui';X.textAlign='center';
X.fillText('Driver ('+teeth1+' teeth)',g1x,gy+r1+25);
X.fillText('Driven ('+teeth2+' teeth)',g2x,gy+r2+25);
X.textAlign='left';
document.getElementById('readings').innerHTML='Gear ratio: <span class="val">1:'+ratio+'</span><br>Driver teeth: <span class="val">'+teeth1+'</span><br>Driven teeth: <span class="val">'+teeth2+'</span><br>Driven turns '+(ratio)+'× slower<br>Torque ×'+ratio;
}
}
function loop(){requestAnimationFrame(loop);time+=1/60;draw()}
loop();
window.addEventListener('message',e=>{
if(!e.data||typeof e.data!=='object')return;
if(e.data.type==='resetCanvas'||e.data.type==='resetGraph'){time=0}
});
<\/script></body></html>`;

// ── 2D Shapes Lab ───────────────────────────────────────────────────────────
const SHAPES_2D_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,-apple-system,sans-serif;user-select:none;color:#fff}
canvas{display:block}
#ui{position:fixed;top:48px;left:0;bottom:0;width:220px;z-index:20;display:flex;flex-direction:column;background:rgba(15,15,35,0.92);border-right:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(12px);overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,0.15) transparent}
#ui::-webkit-scrollbar{width:4px}#ui::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.15);border-radius:2px}
.panel{padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06)}
.panel-title{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.35);font-weight:700;margin-bottom:8px}
.shape-bank{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.bank-item{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;cursor:grab;transition:all .2s;font-size:9px;color:rgba(255,255,255,0.5)}
.bank-item:hover{background:rgba(255,255,255,0.08);border-color:rgba(255,255,255,0.15);color:#fff;transform:translateY(-1px)}
.bank-item:active{cursor:grabbing}
.bank-item canvas{width:48px;height:48px;pointer-events:none}
.tools{display:flex;gap:4px;flex-wrap:wrap}
.tool-btn{padding:6px 10px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);border-radius:6px;cursor:pointer;font-size:10px;font-weight:600;transition:all .2s;flex:1;text-align:center;min-width:0}
.tool-btn:hover{background:rgba(255,255,255,0.1);color:#fff}
.tool-btn.active{background:rgba(59,130,246,0.3);border-color:rgba(59,130,246,0.5);color:#93c5fd}
.color-row{display:flex;gap:4px;flex-wrap:wrap}
.color-swatch{width:22px;height:22px;border-radius:5px;cursor:pointer;border:2px solid transparent;transition:all .15s}
.color-swatch:hover{transform:scale(1.15)}
.color-swatch.active{border-color:#fff;box-shadow:0 0 8px rgba(255,255,255,0.3)}
.tf-section{margin-bottom:8px}
.tf-label{font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:4px;font-weight:600}
.tf-row{display:flex;gap:4px;align-items:center;margin-bottom:4px}
.tf-row label{font-size:9px;color:rgba(255,255,255,0.35);min-width:14px}
.tf-row input[type=number]{width:52px;padding:3px 5px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#fff;font-size:10px;text-align:center;outline:none}
.tf-row input[type=number]:focus{border-color:rgba(59,130,246,0.5)}
.tf-btn{padding:5px 8px;background:rgba(59,130,246,0.25);border:1px solid rgba(59,130,246,0.4);color:#93c5fd;border-radius:5px;cursor:pointer;font-size:9px;font-weight:700;transition:all .2s;flex:1;text-align:center}
.tf-btn:hover{background:rgba(59,130,246,0.4)}
.tf-btn.red{background:rgba(239,68,68,0.2);border-color:rgba(239,68,68,0.4);color:#fca5a5}
.tf-btn.red:hover{background:rgba(239,68,68,0.35)}
.tf-btn.green{background:rgba(16,185,129,0.2);border-color:rgba(16,185,129,0.4);color:#6ee7b7}
.tf-btn.green:hover{background:rgba(16,185,129,0.35)}
#floating-toolbar{position:fixed;z-index:30;display:flex;gap:3px;padding:6px 8px;background:rgba(15,15,35,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:12px;backdrop-filter:blur(16px);box-shadow:0 8px 32px rgba(0,0,0,0.5);cursor:default}
#floating-toolbar .ft-grip{width:6px;display:flex;flex-direction:column;justify-content:center;gap:2px;cursor:grab;padding:0 3px 0 0;margin-right:2px}
#floating-toolbar .ft-grip span{display:block;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.2)}
#floating-toolbar .ft-grip:active{cursor:grabbing}
#floating-toolbar .ft-btn{padding:7px 12px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.6);border-radius:7px;cursor:pointer;font-size:10px;font-weight:700;transition:all .2s;white-space:nowrap}
#floating-toolbar .ft-btn:hover{background:rgba(255,255,255,0.12);color:#fff}
#floating-toolbar .ft-btn.active{background:rgba(59,130,246,0.3);border-color:rgba(59,130,246,0.5);color:#93c5fd;box-shadow:0 0 10px rgba(59,130,246,0.15)}
#floating-toolbar .ft-sep{width:1px;background:rgba(255,255,255,0.08);margin:2px 3px}
#floating-toolbar .ft-btn.red{color:rgba(255,140,140,0.7)}
#floating-toolbar .ft-btn.red:hover{background:rgba(239,68,68,0.2);color:#fca5a5}
#floating-toolbar .ft-btn.green{color:rgba(130,230,180,0.7)}
#floating-toolbar .ft-btn.green:hover{background:rgba(16,185,129,0.2);color:#6ee7b7}
#info-bar{position:fixed;bottom:0;left:220px;right:0;height:32px;background:rgba(15,15,35,0.9);border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;padding:0 12px;gap:16px;font-size:10px;color:rgba(255,255,255,0.4);z-index:20;backdrop-filter:blur(8px)}
#info-bar span.val{color:rgba(255,255,255,0.7);font-weight:600}
#canvas-wrap{position:fixed;top:48px;left:220px;right:0;bottom:32px}
#draw-hint{position:fixed;top:50%;left:calc(220px + (100% - 220px)/2);transform:translate(-50%,-50%);color:rgba(255,255,255,0.08);font-size:13px;pointer-events:none;z-index:5;text-align:center;line-height:1.8}
@media(max-width:700px){
  #ui{width:180px}
  #canvas-wrap{left:180px}
  #info-bar{left:180px}
  #draw-hint{left:calc(180px + (100% - 180px)/2)}
  .shape-bank{grid-template-columns:1fr 1fr}
  .bank-item canvas{width:36px;height:36px}
}
</style></head><body>
<!-- Floating toolbar on canvas -->
<div id="floating-toolbar">
  <div class="ft-grip" id="ft-grip"><span></span><span></span><span></span></div>
  <div class="ft-btn active" data-tool="select" onclick="setTool('select')">Select</div>
  <div class="ft-btn" data-tool="draw" onclick="setTool('draw')">Draw</div>
  <div class="ft-btn" data-tool="vertex" onclick="setTool('vertex')">Vertex</div>
  <div class="ft-sep"></div>
  <div class="ft-btn green" onclick="duplicateSelected()">Duplicate</div>
  <div class="ft-btn red" onclick="deleteSelected()">Delete</div>
</div>
<div id="ui">
  <!-- Colors -->
  <div class="panel">
    <div class="panel-title">Fill Color</div>
    <div class="color-row" id="colors"></div>
    <div style="margin-top:6px">
      <div class="tool-btn" onclick="setFill(null)" style="font-size:9px">No Fill</div>
    </div>
  </div>
  <div class="panel">
    <div class="panel-title">Stroke Color</div>
    <div class="color-row" id="stroke-colors"></div>
  </div>
  <!-- Shape Bank -->
  <div class="panel">
    <div class="panel-title">Triangles</div>
    <div class="shape-bank" id="bank-tri"></div>
  </div>
  <div class="panel">
    <div class="panel-title">Quadrilaterals</div>
    <div class="shape-bank" id="bank-quad"></div>
  </div>
  <div class="panel">
    <div class="panel-title">Polygons</div>
    <div class="shape-bank" id="bank-poly"></div>
  </div>
  <!-- Transforms -->
  <div class="panel">
    <div class="panel-title">Transformations</div>
    <div class="tf-section">
      <div class="tf-label">Translate</div>
      <div class="tf-row"><label>dx</label><input type="number" id="tr-dx" value="2" step="1"><label>dy</label><input type="number" id="tr-dy" value="0" step="1"></div>
      <div class="tf-btn" onclick="applyTranslate()">Translate</div>
    </div>
    <div class="tf-section">
      <div class="tf-label">Rotate</div>
      <div class="tf-row"><label>&deg;</label><input type="number" id="rot-angle" value="90" step="1"></div>
      <div class="tf-row"><label>cx</label><input type="number" id="rot-cx" value="0" step="1"><label>cy</label><input type="number" id="rot-cy" value="0" step="1"></div>
      <div class="tf-btn" onclick="applyRotate()">Rotate</div>
    </div>
    <div class="tf-section">
      <div class="tf-label">Reflect</div>
      <div class="tools" style="margin-bottom:4px">
        <div class="tool-btn" onclick="applyReflect('x')" style="font-size:9px">x-axis</div>
        <div class="tool-btn" onclick="applyReflect('y')" style="font-size:9px">y-axis</div>
      </div>
      <div class="tools" style="margin-bottom:4px">
        <div class="tool-btn" onclick="applyReflect('yx')" style="font-size:9px">y=x</div>
        <div class="tool-btn" onclick="applyReflect('y-x')" style="font-size:9px">y=&minus;x</div>
      </div>
      <div class="tf-row"><label>x=</label><input type="number" id="ref-x" value="0" step="1"><div class="tf-btn" onclick="applyReflect('vline')" style="flex:0 0 auto;padding:5px 10px">Reflect</div></div>
      <div class="tf-row"><label>y=</label><input type="number" id="ref-y" value="0" step="1"><div class="tf-btn" onclick="applyReflect('hline')" style="flex:0 0 auto;padding:5px 10px">Reflect</div></div>
    </div>
    <div class="tf-section">
      <div class="tf-label">Enlarge</div>
      <div class="tf-row"><label>k</label><input type="number" id="enl-k" value="2" step="0.5" min="-5" max="5"></div>
      <div class="tf-row"><label>cx</label><input type="number" id="enl-cx" value="0" step="1"><label>cy</label><input type="number" id="enl-cy" value="0" step="1"></div>
      <div class="tf-btn" onclick="applyEnlarge()">Enlarge</div>
    </div>
  </div>
</div>
<div id="canvas-wrap"><canvas id="c"></canvas></div>
<div id="info-bar">
  <span>Mouse: (<span class="val" id="mx">0</span>, <span class="val" id="my">0</span>)</span>
  <span>Shapes: <span class="val" id="sc">0</span></span>
  <span id="sel-info"></span>
  <span style="margin-left:auto;display:flex;align-items:center;gap:10px"><span style="opacity:0.5">Scroll to zoom &middot; Drag empty space to pan</span><button onclick="resetView()" style="padding:3px 10px;font-size:9px;font-weight:700;background:rgba(59,130,246,0.2);border:1px solid rgba(59,130,246,0.35);color:#93c5fd;border-radius:5px;cursor:pointer">Reset View</button></span>
</div>
<div id="draw-hint">Click on grid to draw shapes<br>or drag from the shape bank</div>
<script>
const C=document.getElementById('c'),ctx=C.getContext('2d'),wrap=document.getElementById('canvas-wrap');
// State
let W=800,H=600,cam={x:0,y:0,z:1},shapes=[],selIdx=-1,tool='select';
let drawPts=[],dragging=false,dragStart={x:0,y:0},dragType=null,dragVertIdx=-1;
let panStart=null,camStart=null;
let currentFill='rgba(59,130,246,0.25)',currentStroke='#3b82f6';
let dropShape=null,dropPos=null;
const GRID=1,SNAP=true;
const COLORS=['#3b82f6','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#6366f1','#f97316','#84cc16',
  'rgba(59,130,246,0.25)','rgba(139,92,246,0.25)','rgba(236,72,153,0.25)','rgba(239,68,68,0.25)','rgba(245,158,11,0.25)','rgba(16,185,129,0.25)'];
const STROKE_COLORS=['#3b82f6','#8b5cf6','#ec4899','#ef4444','#f59e0b','#10b981','#06b6d4','#fff','#94a3b8','#f97316'];

// Coordinate transforms
function s2w(sx,sy){return{x:(sx-W/2)/cam.z+cam.x,y:-(sy-H/2)/cam.z+cam.y}}
function w2s(wx,wy){return{x:(wx-cam.x)*cam.z+W/2,y:-(wy-cam.y)*cam.z+H/2}}
function snap(v){return SNAP?Math.round(v):v}

// Shape definitions for bank
const BANK_SHAPES={
  triangles:[
    {name:'Equilateral',pts:[[0,0],[4,0],[2,3]]},
    {name:'Right',pts:[[0,0],[4,0],[0,3]]},
    {name:'Isosceles',pts:[[0,0],[4,0],[2,5]]},
    {name:'Scalene',pts:[[0,0],[5,0],[2,3]]},
    {name:'Right Isos.',pts:[[0,0],[3,0],[0,3]]},
    {name:'Obtuse',pts:[[0,0],[6,0],[1,2]]},
  ],
  quads:[
    {name:'Square',pts:[[0,0],[3,0],[3,3],[0,3]]},
    {name:'Rectangle',pts:[[0,0],[5,0],[5,3],[0,3]]},
    {name:'Parallelogram',pts:[[1,0],[5,0],[4,3],[0,3]]},
    {name:'Rhombus',pts:[[2,0],[4,2],[2,4],[0,2]]},
    {name:'Trapezium',pts:[[1,0],[4,0],[5,3],[0,3]]},
    {name:'Kite',pts:[[2,0],[4,2],[2,5],[0,2]]},
    {name:'Arrowhead',pts:[[2,0],[4,3],[2,2],[0,3]]},
    {name:'Irregular',pts:[[0,0],[4,1],[5,4],[1,3]]},
  ],
  polys:[
    {name:'Pentagon',pts:regPoly(5,2)},
    {name:'Hexagon',pts:regPoly(6,2)},
    {name:'Heptagon',pts:regPoly(7,2)},
    {name:'Octagon',pts:regPoly(8,2)},
    {name:'Nonagon',pts:regPoly(9,2)},
    {name:'Decagon',pts:regPoly(10,2)},
  ]
};
function regPoly(n,r){const pts=[];for(let i=0;i<n;i++){const a=Math.PI/2+2*Math.PI*i/n;pts.push([Math.round(r*Math.cos(a)*100)/100,Math.round(r*Math.sin(a)*100)/100])}return pts}

// Init color swatches
function initColors(){
  const ce=document.getElementById('colors'),se=document.getElementById('stroke-colors');
  COLORS.forEach(c=>{const d=document.createElement('div');d.className='color-swatch'+(c===currentFill?' active':'');d.style.background=c;d.onclick=()=>{currentFill=c;document.querySelectorAll('#colors .color-swatch').forEach(s=>s.classList.remove('active'));d.classList.add('active');if(selIdx>=0){shapes[selIdx].fill=c;draw()}};ce.appendChild(d)});
  STROKE_COLORS.forEach(c=>{const d=document.createElement('div');d.className='color-swatch'+(c===currentStroke?' active':'');d.style.background=c;d.onclick=()=>{currentStroke=c;document.querySelectorAll('#stroke-colors .color-swatch').forEach(s=>s.classList.remove('active'));d.classList.add('active');if(selIdx>=0){shapes[selIdx].stroke=c;draw()}};se.appendChild(d)});
}
function setFill(c){currentFill=c;document.querySelectorAll('#colors .color-swatch').forEach(s=>s.classList.remove('active'));if(selIdx>=0){shapes[selIdx].fill=c;draw()}}

// Init shape bank
function initBank(){
  buildBank('bank-tri',BANK_SHAPES.triangles);
  buildBank('bank-quad',BANK_SHAPES.quads);
  buildBank('bank-poly',BANK_SHAPES.polys);
}
function buildBank(id,list){
  const el=document.getElementById(id);
  list.forEach(s=>{
    const item=document.createElement('div');item.className='bank-item';
    const cv=document.createElement('canvas');cv.width=96;cv.height=96;
    drawBankThumb(cv,s.pts);
    item.appendChild(cv);
    const lbl=document.createElement('span');lbl.textContent=s.name;item.appendChild(lbl);
    item.draggable=true;
    item.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',JSON.stringify(s.pts));e.dataTransfer.effectAllowed='copy'});
    item.addEventListener('touchstart',e=>{dropShape=s.pts;},{passive:true});
    item.addEventListener('click',()=>{placeShapeAtCenter(s.pts)});
    el.appendChild(item);
  });
}
function drawBankThumb(cv,pts){
  const c=cv.getContext('2d');
  let mnx=Infinity,mny=Infinity,mxx=-Infinity,mxy=-Infinity;
  pts.forEach(p=>{mnx=Math.min(mnx,p[0]);mny=Math.min(mny,p[1]);mxx=Math.max(mxx,p[0]);mxy=Math.max(mxy,p[1])});
  const w=mxx-mnx||1,h=mxy-mny||1,s=Math.min(70/w,70/h),ox=(96-w*s)/2,oy=(96-h*s)/2;
  c.fillStyle='rgba(59,130,246,0.15)';c.strokeStyle='#3b82f6';c.lineWidth=2;c.lineJoin='round';
  c.beginPath();pts.forEach((p,i)=>{const x=ox+(p[0]-mnx)*s,y=oy+(mxy-p[1])*s;i?c.lineTo(x,y):c.moveTo(x,y)});c.closePath();c.fill();c.stroke();
  // dots
  c.fillStyle='#60a5fa';pts.forEach(p=>{const x=ox+(p[0]-mnx)*s,y=oy+(mxy-p[1])*s;c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill()});
}
function placeShapeAtCenter(pts){
  let cx=0,cy=0;pts.forEach(p=>{cx+=p[0];cy+=p[1]});cx/=pts.length;cy/=pts.length;
  const verts=pts.map(p=>({x:snap(Math.round(p[0]-cx+cam.x)),y:snap(Math.round(p[1]-cy+cam.y))}));
  shapes.push({verts,fill:currentFill,stroke:currentStroke});
  selIdx=shapes.length-1;tool='select';updateToolUI();draw();
}

// Tool management
function setTool(t){tool=t;drawPts=[];updateToolUI();draw()}
function updateToolUI(){document.querySelectorAll('#floating-toolbar .ft-btn[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool))}

// Floating toolbar drag
(function(){
  const tb=document.getElementById('floating-toolbar'),grip=document.getElementById('ft-grip');
  let dx=0,dy=0,isDrag=false;
  // Initial position: top-center of canvas area
  function positionDefault(){tb.style.top='60px';tb.style.left='calc(220px + (100% - 220px)/2 - '+tb.offsetWidth/2+'px)'}
  setTimeout(positionDefault,0);
  grip.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();isDrag=true;const r=tb.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top;grip.setPointerCapture(e.pointerId)});
  grip.addEventListener('pointermove',e=>{if(!isDrag)return;e.preventDefault();tb.style.left=Math.max(0,e.clientX-dx)+'px';tb.style.top=Math.max(48,e.clientY-dy)+'px'});
  grip.addEventListener('pointerup',()=>{isDrag=false});
})();

// Drawing
function draw(){
  ctx.clearRect(0,0,W,H);
  // Grid
  drawGrid();
  // Shapes
  shapes.forEach((s,i)=>drawShape(s,i===selIdx));
  // Drawing points
  if(tool==='draw'&&drawPts.length>0){
    ctx.strokeStyle='rgba(16,185,129,0.6)';ctx.lineWidth=2;ctx.setLineDash([6,4]);
    ctx.beginPath();drawPts.forEach((p,i)=>{const sp=w2s(p.x,p.y);i?ctx.lineTo(sp.x,sp.y):ctx.moveTo(sp.x,sp.y)});
    if(drawPts.length>1)ctx.stroke();ctx.setLineDash([]);
    drawPts.forEach(p=>{const sp=w2s(p.x,p.y);ctx.fillStyle='#10b981';ctx.beginPath();ctx.arc(sp.x,sp.y,5,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.7)';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.fillText('('+p.x+','+p.y+')',sp.x,sp.y-10)});
  }
  // Drop preview
  if(dropShape&&dropPos){
    ctx.globalAlpha=0.4;ctx.strokeStyle='#3b82f6';ctx.lineWidth=2;ctx.setLineDash([4,4]);
    ctx.beginPath();dropShape.forEach((p,i)=>{const sp=w2s(p[0]+dropPos.x,p[1]+dropPos.y);i?ctx.lineTo(sp.x,sp.y):ctx.moveTo(sp.x,sp.y)});
    ctx.closePath();ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  }
  // Hint
  document.getElementById('draw-hint').style.opacity=shapes.length===0&&drawPts.length===0?'1':'0';
  document.getElementById('sc').textContent=shapes.length;
  updateSelInfo();
}
function drawGrid(){
  const step=GRID;
  const tl=s2w(0,0),br=s2w(W,H);
  const minX=Math.floor(Math.min(tl.x,br.x)/step)*step,maxX=Math.ceil(Math.max(tl.x,br.x)/step)*step;
  const minY=Math.floor(Math.min(tl.y,br.y)/step)*step,maxY=Math.ceil(Math.max(tl.y,br.y)/step)*step;
  // Determine grid density — skip lines if too dense
  const pxPerUnit=step*cam.z;
  let drawStep=step;
  if(pxPerUnit<8)drawStep=step*Math.ceil(8/pxPerUnit);
  // Minor grid
  ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.lineWidth=1;
  ctx.beginPath();
  for(let x=minX;x<=maxX;x+=drawStep){if(x===0)continue;const sx=w2s(x,0).x;ctx.moveTo(sx,0);ctx.lineTo(sx,H)}
  for(let y=minY;y<=maxY;y+=drawStep){if(y===0)continue;const sy=w2s(0,y).y;ctx.moveTo(0,sy);ctx.lineTo(W,sy)}
  ctx.stroke();
  // Axes
  const ox=w2s(0,0);
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(0,ox.y);ctx.lineTo(W,ox.y);ctx.moveTo(ox.x,0);ctx.lineTo(ox.x,H);ctx.stroke();
  // Labels
  if(pxPerUnit>=20){
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font='9px system-ui';ctx.textAlign='center';ctx.textBaseline='top';
    for(let x=minX;x<=maxX;x+=drawStep){if(x===0)continue;const sx=w2s(x,0);ctx.fillText(x,sx.x,ox.y+4)}
    ctx.textAlign='right';ctx.textBaseline='middle';
    for(let y=minY;y<=maxY;y+=drawStep){if(y===0)continue;const sy=w2s(0,y);ctx.fillText(y,ox.x-6,sy.y)}
    ctx.fillText('O',ox.x-6,ox.y+10);
  }
}
function drawShape(s,sel){
  if(s.verts.length<2)return;
  const pts=s.verts.map(v=>w2s(v.x,v.y));
  const isOrig=s.isOriginal;
  // Fill
  if(s.fill&&!isOrig){ctx.fillStyle=s.fill;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill()}
  // Stroke — originals are dashed and faded
  ctx.strokeStyle=s.stroke||'#3b82f6';ctx.lineWidth=sel?3:2;ctx.lineJoin='round';
  if(isOrig){ctx.setLineDash([6,4]);ctx.globalAlpha=0.4}
  if(sel&&!isOrig){ctx.shadowColor=s.stroke||'#3b82f6';ctx.shadowBlur=12}
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.stroke();
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.setLineDash([]);ctx.globalAlpha=1;
  // Vertices
  s.verts.forEach((v,i)=>{
    const p=w2s(v.x,v.y);
    ctx.globalAlpha=isOrig?0.4:1;
    ctx.fillStyle=sel?'#fff':'rgba(255,255,255,0.6)';ctx.beginPath();ctx.arc(p.x,p.y,sel?5:3.5,0,Math.PI*2);ctx.fill();
    if(sel||isOrig){ctx.fillStyle=isOrig?'rgba(255,255,255,0.35)':'rgba(255,255,255,0.65)';ctx.font='bold 9px system-ui';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.fillText('('+v.x+','+v.y+')',p.x,p.y-8)}
    ctx.globalAlpha=1;
  });
  // Side lengths (selected non-originals only)
  if(sel&&!isOrig){
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    for(let i=0;i<s.verts.length;i++){
      const a=s.verts[i],b=s.verts[(i+1)%s.verts.length];
      const len=Math.sqrt((b.x-a.x)**2+(b.y-a.y)**2);
      const mp=w2s((a.x+b.x)/2,(a.y+b.y)/2);
      const dx=b.x-a.x,dy=b.y-a.y;
      const nx=-dy/Math.sqrt(dx*dx+dy*dy)*12,ny=dx/Math.sqrt(dx*dx+dy*dy)*12;
      ctx.fillText(len.toFixed(2),mp.x+nx,mp.y-ny);
    }
  }
}
function updateSelInfo(){
  const el=document.getElementById('sel-info');
  if(selIdx<0||!shapes[selIdx]){el.textContent='';return}
  const s=shapes[selIdx],n=s.verts.length;
  const names={3:'Triangle',4:'Quadrilateral',5:'Pentagon',6:'Hexagon',7:'Heptagon',8:'Octagon',9:'Nonagon',10:'Decagon'};
  const name=names[n]||(n+'-gon');
  // area via shoelace
  let area=0;for(let i=0;i<n;i++){const j=(i+1)%n;area+=s.verts[i].x*s.verts[j].y-s.verts[j].x*s.verts[i].y}area=Math.abs(area)/2;
  // perimeter
  let peri=0;for(let i=0;i<n;i++){const j=(i+1)%n;peri+=Math.sqrt((s.verts[j].x-s.verts[i].x)**2+(s.verts[j].y-s.verts[i].y)**2)}
  el.innerHTML='<span class="val">'+name+'</span> &nbsp; Area: <span class="val">'+area.toFixed(1)+'</span> &nbsp; Perimeter: <span class="val">'+peri.toFixed(2)+'</span>';
}

// Hit testing
function hitShape(wx,wy){
  for(let i=shapes.length-1;i>=0;i--){if(pointInPoly(wx,wy,shapes[i].verts))return i}return-1;
}
function pointInPoly(x,y,verts){
  let inside=false;for(let i=0,j=verts.length-1;i<verts.length;j=i++){
    const xi=verts[i].x,yi=verts[i].y,xj=verts[j].x,yj=verts[j].y;
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;
  }return inside;
}
function nearVertex(wx,wy,shape){
  const thr=8/cam.z;
  for(let i=0;i<shape.verts.length;i++){const v=shape.verts[i];if(Math.abs(v.x-wx)<thr&&Math.abs(v.y-wy)<thr)return i}return-1;
}

// Pointer events
let lastPtr={x:0,y:0},ptrDown=false,isPanning=false;
C.addEventListener('pointerdown',e=>{
  e.preventDefault();const r=C.getBoundingClientRect();const sx=e.clientX-r.left,sy=e.clientY-r.top;
  const w=s2w(sx,sy),ws={x:snap(w.x),y:snap(w.y)};
  lastPtr={x:e.clientX,y:e.clientY};ptrDown=true;
  // Right click = pan
  if(e.button===2){isPanning=true;panStart={x:e.clientX,y:e.clientY};camStart={x:cam.x,y:cam.y};C.style.cursor='grabbing';return}
  if(tool==='draw'){
    if(drawPts.length>=3){
      const fp=w2s(drawPts[0].x,drawPts[0].y);
      if(Math.hypot(sx-fp.x,sy-fp.y)<15){
        shapes.push({verts:[...drawPts],fill:currentFill,stroke:currentStroke});
        selIdx=shapes.length-1;drawPts=[];draw();return;
      }
    }
    drawPts.push(ws);draw();return;
  }
  if(tool==='vertex'&&selIdx>=0){
    const vi=nearVertex(w.x,w.y,shapes[selIdx]);
    if(vi>=0){dragType='vertex';dragVertIdx=vi;dragging=true;return}
  }
  if(tool==='select'||tool==='vertex'){
    if(selIdx>=0){
      const vi=nearVertex(w.x,w.y,shapes[selIdx]);
      if(vi>=0&&tool==='vertex'){dragType='vertex';dragVertIdx=vi;dragging=true;return}
    }
    const hi=hitShape(w.x,w.y);
    if(hi>=0){selIdx=hi;dragType='move';dragging=true;dragStart={x:w.x,y:w.y};draw();return}
    // Click on empty space → pan with left mouse
    selIdx=-1;isPanning=true;panStart={x:e.clientX,y:e.clientY};camStart={x:cam.x,y:cam.y};C.style.cursor='grabbing';draw();
  }
});
C.addEventListener('pointermove',e=>{
  const r=C.getBoundingClientRect();const sx=e.clientX-r.left,sy=e.clientY-r.top;
  const w=s2w(sx,sy);
  document.getElementById('mx').textContent=snap(w.x);
  document.getElementById('my').textContent=snap(w.y);
  if(isPanning&&panStart){
    const dx=(e.clientX-panStart.x)/cam.z,dy=(e.clientY-panStart.y)/cam.z;
    cam.x=camStart.x-dx;cam.y=camStart.y+dy;draw();return;
  }
  if(!ptrDown||!dragging)return;
  const ws={x:snap(w.x),y:snap(w.y)};
  if(dragType==='vertex'&&selIdx>=0){
    shapes[selIdx].verts[dragVertIdx]={x:ws.x,y:ws.y};draw();
  }else if(dragType==='move'&&selIdx>=0){
    const dx=snap(w.x-dragStart.x),dy=snap(w.y-dragStart.y);
    if(dx!==0||dy!==0){
      shapes[selIdx].verts.forEach(v=>{v.x+=dx;v.y+=dy});
      dragStart={x:dragStart.x+dx,y:dragStart.y+dy};draw();
    }
  }
});
C.addEventListener('pointerup',()=>{ptrDown=false;dragging=false;dragType=null;isPanning=false;panStart=null;C.style.cursor=''});
C.addEventListener('pointerleave',()=>{ptrDown=false;dragging=false;isPanning=false;panStart=null});
C.addEventListener('contextmenu',e=>e.preventDefault());

// Zoom
C.addEventListener('wheel',e=>{
  e.preventDefault();
  const r=C.getBoundingClientRect();const sx=e.clientX-r.left,sy=e.clientY-r.top;
  const w0=s2w(sx,sy);
  const factor=e.deltaY<0?1.12:1/1.12;
  cam.z=Math.max(0.1,Math.min(200,cam.z*factor));
  const w1=s2w(sx,sy);
  cam.x-=w1.x-w0.x;cam.y-=w1.y-w0.y;
  draw();
},{passive:false});

// Touch pan (two-finger)
let touches=[];
C.addEventListener('touchstart',e=>{
  if(e.touches.length===2){e.preventDefault();touches=[...e.touches];panStart={x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2};camStart={x:cam.x,y:cam.y}}
},{passive:false});
C.addEventListener('touchmove',e=>{
  if(e.touches.length===2&&panStart){e.preventDefault();const mx=(e.touches[0].clientX+e.touches[1].clientX)/2,my=(e.touches[0].clientY+e.touches[1].clientY)/2;
    const dx=(mx-panStart.x)/cam.z,dy=(my-panStart.y)/cam.z;cam.x=camStart.x-dx;cam.y=camStart.y+dy;draw()}
},{passive:false});

// Drop from bank
wrap.addEventListener('dragover',e=>{e.preventDefault();e.dataTransfer.dropEffect='copy'});
wrap.addEventListener('drop',e=>{
  e.preventDefault();
  try{
    const pts=JSON.parse(e.dataTransfer.getData('text/plain'));
    const r=C.getBoundingClientRect();const sx=e.clientX-r.left,sy=e.clientY-r.top;
    const w=s2w(sx,sy);
    let cx=0,cy=0;pts.forEach(p=>{cx+=p[0];cy+=p[1]});cx/=pts.length;cy/=pts.length;
    const verts=pts.map(p=>({x:snap(Math.round(p[0]-cx+w.x)),y:snap(Math.round(p[1]-cy+w.y))}));
    shapes.push({verts,fill:currentFill,stroke:currentStroke});
    selIdx=shapes.length-1;tool='select';updateToolUI();draw();
  }catch(err){}
});

// Transformations — keep original, create transformed copy
function cloneShape(s){return{verts:s.verts.map(v=>({x:v.x,y:v.y})),fill:s.fill,stroke:s.stroke,isOriginal:false}}
function markOriginal(s){if(!s.isOriginal){s.isOriginal=true;s.origStroke=s.stroke;s.origFill=s.fill}}

function applyTranslate(){
  if(selIdx<0)return;
  const src=shapes[selIdx];markOriginal(src);
  const dx=parseInt(document.getElementById('tr-dx').value)||0,dy=parseInt(document.getElementById('tr-dy').value)||0;
  const ns=cloneShape(src);ns.verts.forEach(v=>{v.x+=dx;v.y+=dy});
  shapes.push(ns);selIdx=shapes.length-1;draw();
}
function applyRotate(){
  if(selIdx<0)return;
  const src=shapes[selIdx];markOriginal(src);
  const ang=(parseFloat(document.getElementById('rot-angle').value)||0)*Math.PI/180;
  const cx=parseFloat(document.getElementById('rot-cx').value)||0,cy=parseFloat(document.getElementById('rot-cy').value)||0;
  const ns=cloneShape(src);
  ns.verts.forEach(v=>{
    const dx=v.x-cx,dy=v.y-cy;
    v.x=Math.round(cx+dx*Math.cos(ang)-dy*Math.sin(ang));
    v.y=Math.round(cy+dx*Math.sin(ang)+dy*Math.cos(ang));
  });
  shapes.push(ns);selIdx=shapes.length-1;draw();
}
function applyReflect(type){
  if(selIdx<0)return;
  const src=shapes[selIdx];markOriginal(src);
  const ns=cloneShape(src);
  ns.verts.forEach(v=>{
    if(type==='x'){v.y=-v.y}
    else if(type==='y'){v.x=-v.x}
    else if(type==='yx'){const t=v.x;v.x=v.y;v.y=t}
    else if(type==='y-x'){const t=v.x;v.x=-v.y;v.y=-t}
    else if(type==='vline'){const lx=parseFloat(document.getElementById('ref-x').value)||0;v.x=2*lx-v.x}
    else if(type==='hline'){const ly=parseFloat(document.getElementById('ref-y').value)||0;v.y=2*ly-v.y}
  });
  shapes.push(ns);selIdx=shapes.length-1;draw();
}
function applyEnlarge(){
  if(selIdx<0)return;
  const src=shapes[selIdx];markOriginal(src);
  const k=parseFloat(document.getElementById('enl-k').value)||1;
  const cx=parseFloat(document.getElementById('enl-cx').value)||0,cy=parseFloat(document.getElementById('enl-cy').value)||0;
  const ns=cloneShape(src);
  ns.verts.forEach(v=>{
    v.x=Math.round(cx+k*(v.x-cx));
    v.y=Math.round(cy+k*(v.y-cy));
  });
  shapes.push(ns);selIdx=shapes.length-1;draw();
}
function deleteSelected(){if(selIdx>=0){shapes.splice(selIdx,1);selIdx=-1;draw()}}
function duplicateSelected(){
  if(selIdx<0)return;
  const s=shapes[selIdx];
  const ns={verts:s.verts.map(v=>({x:v.x+2,y:v.y+2})),fill:s.fill,stroke:s.stroke};
  shapes.push(ns);selIdx=shapes.length-1;draw();
}

// Keyboard
window.addEventListener('keydown',e=>{
  if(e.key==='Delete'||e.key==='Backspace'){deleteSelected()}
  if(e.key==='Escape'){if(tool==='draw'&&drawPts.length>0){drawPts=[];draw()}else{selIdx=-1;draw()}}
  if(e.ctrlKey&&e.key==='z'){/* todo: full undo */}
});

// Reset view to show -20 to 20 on both axes
function resetView(){
  cam.x=0;cam.y=0;
  cam.z=Math.min(W,H)/40;
  draw();
}

// Resize
function resize(){
  const r=wrap.getBoundingClientRect();W=r.width;H=r.height;
  C.width=W*devicePixelRatio;C.height=H*devicePixelRatio;C.style.width=W+'px';C.style.height=H+'px';
  ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);draw();
}
window.addEventListener('resize',resize);

// Init
initColors();initBank();resize();resetView();
/* Parent message handler */
addEventListener('message',e=>{
  if(!e.data||!e.data.type)return;
  if(e.data.type==='resetCanvas'){resetView();}
  if(e.data.type==='resetGraph'){shapes=[];selIdx=-1;resetView();}
  if(e.data.type==='selectAll'){selIdx=-1;draw();}
});
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
      {
        id: '2d-shapes',
        title: '2D Shapes Lab',
        description: 'Draw and transform every polygon — triangles, quadrilaterals, pentagons, hexagons and beyond. Integer grid, drag-and-drop shape bank, fill colours, vertex editing, translate, rotate, reflect, and enlarge.',
        icon: 'Pentagon',
        gradient: 'from-pink-500 to-rose-500',
        glowColor: 'rgba(236,72,153,0.35)',
        difficulty: 'Beginner',
        tags: ['Shapes', 'Polygons', 'Transformations', 'Geometry'],
        instructions: 'Use the left panel to pick a tool: Select (click shapes to select/move), Draw (click integer points to place vertices, click near the first point to close the shape), or Vertex (drag individual corners). Drag shapes from the shape bank onto the canvas or click them to place at centre. Fill and stroke colours can be changed from the panel. Select a shape then use the Transformations section to translate (dx, dy), rotate by any angle around any centre, reflect across axes or custom lines, or enlarge by any scale factor around any centre. Coordinates snap to integers. Scroll to zoom, right-drag to pan. Press Delete to remove a shape.',
        html_code: SHAPES_2D_HTML,
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
      {
        id: 'newtons-laws',
        title: "Newton's Laws of Motion",
        description: "Explore all three of Newton's laws with animated demonstrations — inertia, F=ma, and action-reaction.",
        icon: 'Zap',
        gradient: 'from-orange-500 to-red-500',
        glowColor: 'rgba(249,115,22,0.35)',
        difficulty: 'Beginner',
        tags: ['Forces', 'Motion', 'Inertia', 'F=ma'],
        instructions: "Select a law from the right panel. Law 1: watch a block on a frictionless surface maintain constant velocity. Law 2: adjust force, mass, and friction sliders to see F=ma in action with real-time acceleration and force arrows. Law 3: observe a rocket demonstrating action-reaction with animated exhaust particles.",
        html_code: NEWTON_HTML,
      },
      {
        id: 'projectile-motion',
        title: 'Projectile Motion',
        description: 'Launch projectiles at any angle and velocity — trace parabolic paths, measure range, height, and flight time.',
        icon: 'Activity',
        gradient: 'from-violet-500 to-indigo-500',
        glowColor: 'rgba(139,92,246,0.35)',
        difficulty: 'Intermediate',
        tags: ['Kinematics', 'Parabola', 'Gravity', 'Trajectory'],
        instructions: "Adjust the launch angle, initial velocity, gravity, and launch height using sliders. Click Launch to fire the projectile and trace its path. Toggle 'Show Trace' to keep previous trajectories visible. The theory panel shows the physics formulas and calculated values for range, max height, and flight time.",
        html_code: PROJECTILE_HTML,
      },
      {
        id: 'solar-system',
        title: 'Solar System Explorer',
        description: 'Watch all 8 planets orbit the Sun with correct relative periods — click any planet for real data on mass, distance, and temperature.',
        icon: 'Atom',
        gradient: 'from-blue-500 to-purple-600',
        glowColor: 'rgba(99,102,241,0.35)',
        difficulty: 'Beginner',
        tags: ['Planets', 'Orbits', 'Astronomy', 'Space'],
        instructions: "Watch the solar system animate. Click any planet name in the right panel or click directly on a planet to see its information — mass, distance from Sun, surface temperature, number of moons, and orbital period. Use the speed slider to slow down or speed up the simulation.",
        html_code: SOLAR_HTML,
      },
      {
        id: 'friction-inclined-plane',
        title: 'Friction & Inclined Plane',
        description: 'Place a block on an adjustable inclined plane — explore friction, normal force, and the conditions for sliding.',
        icon: 'TrendingUp',
        gradient: 'from-amber-500 to-yellow-500',
        glowColor: 'rgba(245,158,11,0.35)',
        difficulty: 'Intermediate',
        tags: ['Friction', 'Forces', 'Incline', 'Normal Force'],
        instructions: "Adjust the plane angle, block mass, friction coefficient (μ), and gravity. Click Start to release the block. Force arrows show weight, normal force, friction, and the component along the slope. The block slides when mg sin θ > μmg cos θ.",
        html_code: FRICTION_HTML,
      },
      {
        id: 'hookes-law',
        title: "Hooke's Law & Springs",
        description: "Stretch a spring, hang masses, and watch oscillations — see F = −kx, energy conservation, and simple harmonic motion.",
        icon: 'Activity',
        gradient: 'from-emerald-500 to-green-500',
        glowColor: 'rgba(16,185,129,0.35)',
        difficulty: 'Beginner',
        tags: ['Springs', 'SHM', 'Energy', 'Elasticity'],
        instructions: "Set the spring constant k, mass, damping, and initial stretch. Click 'Drop Mass' to release. Watch the spring oscillate and observe displacement, velocity, force, PE, KE, and total energy in real time. Toggle the displacement-time graph for visual analysis.",
        html_code: HOOKE_HTML,
      },
      {
        id: 'wave-motion',
        title: 'Wave Motion',
        description: 'Visualise transverse and longitudinal waves — adjust amplitude, wavelength, and frequency with particle motion.',
        icon: 'Activity',
        gradient: 'from-violet-500 to-purple-500',
        glowColor: 'rgba(139,92,246,0.35)',
        difficulty: 'Beginner',
        tags: ['Waves', 'Transverse', 'Longitudinal', 'v=fλ'],
        instructions: "Switch between Transverse and Longitudinal wave types. Adjust amplitude, wavelength, frequency, and particle count. Toggle particles to see individual oscillations. Toggle labels to see wavelength and amplitude measurements. v = fλ is calculated in real time.",
        html_code: WAVE_HTML,
      },
      {
        id: 'circuit-builder',
        title: 'Circuit Builder',
        description: 'Build series and parallel circuits with batteries, resistors, bulbs, and switches — see Ohm\'s Law in action with animated electrons.',
        icon: 'Zap',
        gradient: 'from-blue-500 to-cyan-500',
        glowColor: 'rgba(59,130,246,0.35)',
        difficulty: 'Intermediate',
        tags: ['Circuits', 'Ohm\'s Law', 'Resistance', 'Current'],
        instructions: "Select a component (battery, resistor, bulb, switch, wire) and click the canvas to place it. Use preset buttons for instant series or parallel circuits. Adjust battery voltage with the slider. Click a switch to toggle it. Drag components to rearrange. Watch electron flow animate through the circuit.",
        html_code: CIRCUIT_HTML,
      },
      {
        id: 'dc-motor',
        title: 'DC Motor',
        description: "See how a DC motor works — spinning coil, commutator, brushes, and Fleming's Left-Hand Rule with adjustable voltage and field strength.",
        icon: 'Hexagon',
        gradient: 'from-amber-500 to-orange-500',
        glowColor: 'rgba(245,158,11,0.35)',
        difficulty: 'Intermediate',
        tags: ['Motor', 'Electromagnetism', 'F=BIL', 'Commutator'],
        instructions: "Adjust voltage, magnetic field strength, and number of coil turns. Click Start to spin the motor. Reverse direction to see the coil spin the other way. Toggle labels to see force arrows and component names. Watch how the commutator reverses current every half turn.",
        html_code: MOTOR_HTML,
      },
      {
        id: 'electric-fields',
        title: 'Electric Fields',
        description: 'Place positive and negative charges and watch electric field lines, vector fields, and potential maps form in real time.',
        icon: 'Zap',
        gradient: 'from-purple-500 to-violet-500',
        glowColor: 'rgba(139,92,246,0.35)',
        difficulty: 'Advanced',
        tags: ['Coulomb\'s Law', 'E-field', 'Potential', 'Charges'],
        instructions: "Select + or − charge, then click the canvas to place. Drag charges to move them. Use presets for dipole, same-charge, or quadrupole configurations. Toggle field lines, vector field arrows, and potential heatmap. Field lines flow from + to − charges.",
        html_code: EFIELD_HTML,
      },
      {
        id: 'sound-waves',
        title: 'Sound Waves',
        description: 'Explore sound as a longitudinal pressure wave — adjust frequency, amplitude, and medium speed with optional audio playback.',
        icon: 'Activity',
        gradient: 'from-orange-500 to-amber-500',
        glowColor: 'rgba(249,115,22,0.35)',
        difficulty: 'Beginner',
        tags: ['Sound', 'Frequency', 'Wavelength', 'Longitudinal'],
        instructions: "Adjust frequency (20–2000 Hz), amplitude, and medium speed. Switch between Air, Water, and Steel to see how speed changes. Toggle between waveform and pressure bar views. Click Play Tone to hear the actual frequency through your speakers.",
        html_code: SOUND_HTML,
      },
      {
        id: 'doppler-effect',
        title: 'Doppler Effect',
        description: 'Watch wavefronts compress and stretch as a source moves — see pitch shift, Mach number, and sonic booms.',
        icon: 'Activity',
        gradient: 'from-pink-500 to-rose-500',
        glowColor: 'rgba(236,72,153,0.35)',
        difficulty: 'Intermediate',
        tags: ['Doppler', 'Sound', 'Frequency Shift', 'Mach'],
        instructions: "Set the source frequency, source speed, and observer speed. Watch the wavefronts compress ahead of the source (higher pitch) and stretch behind (lower pitch). Push source speed above 343 m/s to see a Mach cone (sonic boom).",
        html_code: DOPPLER_HTML,
      },
      {
        id: 'em-spectrum',
        title: 'EM Spectrum Explorer',
        description: 'Explore the full electromagnetic spectrum from radio waves to gamma rays — wavelengths, frequencies, uses, and dangers.',
        icon: 'Sparkles',
        gradient: 'from-purple-500 to-fuchsia-500',
        glowColor: 'rgba(168,85,247,0.35)',
        difficulty: 'Beginner',
        tags: ['EM Waves', 'Light', 'Radiation', 'Spectrum'],
        instructions: "Click any region of the spectrum in the right panel to highlight it. See wavelength range, frequency range, common uses, sources, and danger level. The animated wave at the bottom shows how the wave pattern changes across the spectrum.",
        html_code: EM_SPECTRUM_HTML,
      },
      {
        id: 'gas-laws',
        title: 'Gas Laws',
        description: "Boyle's, Charles's, and Pressure Laws with animated particles, adjustable temperature and volume, and live PV/VT/PT graphs.",
        icon: 'FlaskConical',
        gradient: 'from-emerald-500 to-teal-500',
        glowColor: 'rgba(16,185,129,0.35)',
        difficulty: 'Intermediate',
        tags: ['Boyle', 'Charles', 'Pressure', 'PV=nRT'],
        instructions: "Select a gas law (Boyle's, Charles's, or Pressure). Adjust temperature, volume, and particle count. Watch particles bounce faster at higher temperatures. The graph shows the relationship between the variables for the selected law.",
        html_code: GAS_LAWS_HTML,
      },
      {
        id: 'heat-transfer',
        title: 'Heat Transfer',
        description: 'Visualise conduction, convection, and radiation — animated particles, convection currents, and infrared waves.',
        icon: 'Activity',
        gradient: 'from-red-500 to-orange-500',
        glowColor: 'rgba(239,68,68,0.35)',
        difficulty: 'Beginner',
        tags: ['Conduction', 'Convection', 'Radiation', 'Thermal'],
        instructions: "Choose between Conduction (heat through a metal bar), Convection (heated fluid currents in a tank), and Radiation (infrared waves from a hot source). Adjust hot and cold temperatures to see how heat flows.",
        html_code: HEAT_HTML,
      },
      {
        id: 'radioactive-decay',
        title: 'Radioactive Decay',
        description: 'Watch atoms decay in real time — half-life curves, alpha/beta/gamma emission, and activity calculations.',
        icon: 'Atom',
        gradient: 'from-purple-500 to-violet-500',
        glowColor: 'rgba(168,85,247,0.35)',
        difficulty: 'Intermediate',
        tags: ['Half-life', 'Alpha', 'Beta', 'Gamma', 'Nuclear'],
        instructions: "Set the number of atoms and half-life. Choose decay type (alpha, beta, or gamma). Click Start to watch random decay events. The graph plots remaining atoms vs time alongside the theoretical N₀×(½)^(t/T½) curve. Half-life markers help identify each interval.",
        html_code: RADIOACTIVE_HTML,
      },
      {
        id: 'momentum-collisions',
        title: 'Momentum & Collisions',
        description: 'Simulate elastic and inelastic collisions — set mass and velocity for two objects, then watch momentum conservation in action.',
        icon: 'Zap',
        gradient: 'from-blue-500 to-indigo-500',
        glowColor: 'rgba(59,130,246,0.35)',
        difficulty: 'Intermediate',
        tags: ['Momentum', 'Collisions', 'Conservation', 'Kinetic Energy'],
        instructions: "Set mass and velocity for objects A and B. Choose elastic (KE conserved) or inelastic (objects stick). Click Launch to see the collision. Before/after readings show momentum is always conserved while KE may be lost in inelastic collisions.",
        html_code: MOMENTUM_HTML,
      },
      {
        id: 'circular-motion',
        title: 'Circular Motion',
        description: 'See centripetal force and acceleration vectors, adjust radius and speed, and release the object to see tangential motion.',
        icon: 'Activity',
        gradient: 'from-teal-500 to-cyan-500',
        glowColor: 'rgba(20,184,166,0.35)',
        difficulty: 'Intermediate',
        tags: ['Centripetal', 'Angular Velocity', 'Period', 'Tangent'],
        instructions: "Adjust radius, speed, and mass. Watch velocity (green, tangent) and acceleration (red, toward centre) vectors. Click Release to let the object fly off in a straight line — demonstrating Newton's 1st Law. Toggle trail to see the path.",
        html_code: CIRCULAR_HTML,
      },
      {
        id: 'simple-machines',
        title: 'Simple Machines',
        description: 'Explore levers, pulleys, and gears — see mechanical advantage, effort vs load, and how machines multiply force.',
        icon: 'Hexagon',
        gradient: 'from-amber-500 to-yellow-500',
        glowColor: 'rgba(245,158,11,0.35)',
        difficulty: 'Beginner',
        tags: ['Lever', 'Pulley', 'Gears', 'Mechanical Advantage'],
        instructions: "Switch between Lever, Pulley, and Gears. Adjust effort force, load, and ratio. For levers, see if moments balance. For pulleys, see how more pulleys reduce effort. For gears, watch how the gear ratio affects speed and torque.",
        html_code: MACHINES_HTML,
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
