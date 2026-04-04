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
canvas.drawing{cursor:crosshair}
canvas:active{cursor:grabbing}
#top-bar{position:fixed;top:0;left:0;right:0;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;z-index:20;background:linear-gradient(180deg,rgba(10,10,26,0.85),transparent);pointer-events:none}
#top-bar>*{pointer-events:auto}
#shape-name{color:#fff;font-size:15px;font-weight:700;letter-spacing:0.5px}
#measurements{color:rgba(255,255,255,0.5);font-size:11px;line-height:1.6}
#controls{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;z-index:20;flex-wrap:wrap;justify-content:center;max-width:95vw}
.cat-group{display:flex;gap:4px;padding:4px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px}
.cat-label{position:absolute;top:-14px;left:8px;font-size:8px;color:rgba(255,255,255,0.25);text-transform:uppercase;letter-spacing:1px;font-weight:700}
.cat-wrap{position:relative;padding-top:10px}
button{padding:6px 12px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.7);border-radius:7px;cursor:pointer;font-size:11px;font-weight:500;transition:all .2s;white-space:nowrap}
button:hover{background:rgba(255,255,255,0.12);color:#fff}
button.active{background:rgba(59,130,246,0.3);border-color:rgba(59,130,246,0.5);color:#93c5fd}
button.draw-active{background:rgba(16,185,129,0.3);border-color:rgba(16,185,129,0.5);color:#6ee7b7}
#draw-hint{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.15);font-size:14px;pointer-events:none;transition:opacity .3s;z-index:5}
</style></head><body>
<canvas id="c"></canvas>
<div id="top-bar">
  <div>
    <div id="shape-name">Cube</div>
    <div id="measurements"></div>
  </div>
  <div id="draw-status" style="font-size:11px;color:rgba(255,255,255,0.4)">Drag to rotate · Scroll to zoom</div>
</div>
<div id="draw-hint"></div>
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
    <button onclick="clearLines()" id="b-clear">Clear Lines</button>
  </div></div>
</div>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H,shape='cube',wire=false,drawMode=false,rotX=0.4,rotY=0.6,zoom=220,drag=false,lx,ly;
let userLines=[],selectedDot=-1,hoverDot=-1;
const PI=Math.PI,cos=Math.cos,sin=Math.sin;

function resize(){W=c.width=innerWidth;H=c.height=innerHeight}
resize();addEventListener('resize',resize);

function proj(x,y,z){
  const cx=cos(rotX),sx=sin(rotX),cy=cos(rotY),sy=sin(rotY);
  const y1=y*cx-z*sx,z1=y*sx+z*cx,x1=x*cy+z1*sy,z2=-x*sy+z1*cy;
  const s=zoom/(z2+5);
  return{x:x1*s+W/2,y:y1*s+H/2,z:z2,s};
}

/* ── Shape generators return {v:vertices, e:edges, f:faces} ── */
function mkCube(sx,sy,sz){
  sx=sx||1;sy=sy||1;sz=sz||1;
  const v=[[-sx,-sy,-sz],[-sx,-sy,sz],[-sx,sy,-sz],[-sx,sy,sz],[sx,-sy,-sz],[sx,-sy,sz],[sx,sy,-sz],[sx,sy,sz]];
  const e=[[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]];
  const f=[[0,1,3,2],[4,5,7,6],[0,1,5,4],[2,3,7,6],[0,2,6,4],[1,3,7,5]];
  return{v,e,f};
}
function mkSphere(r,n,m){r=r||1;n=n||20;m=m||14;const v=[];for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const t=PI*i/m,p=2*PI*j/n;v.push([r*sin(t)*cos(p),r*cos(t),r*sin(t)*sin(p)]);}const e=[];const w=n+1;for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const idx=i*w+j;if(j<n)e.push([idx,idx+1]);if(i<m)e.push([idx,idx+w]);}return{v,e,f:[]};}
function mkCone(r,h,n){r=r||1;h=h||2;n=n||24;const v=[[0,h/2,0]];for(let i=0;i<n;i++){const a=2*PI*i/n;v.push([r*cos(a),-h/2,r*sin(a)]);}const e=[];for(let i=1;i<=n;i++){e.push([0,i]);e.push([i,i%n+1]);}const f=[];for(let i=1;i<=n;i++)f.push([0,i,i%n+1]);return{v,e,f};}
function mkCylinder(r,h,n){r=r||0.8;h=h||2;n=n||24;const v=[];for(let i=0;i<n;i++){const a=2*PI*i/n;v.push([r*cos(a),h/2,r*sin(a)]);v.push([r*cos(a),-h/2,r*sin(a)]);}const e=[];for(let i=0;i<n;i++){const t=i*2,tn=((i+1)%n)*2;e.push([t,t+1]);e.push([t,tn]);e.push([t+1,tn+1]);}return{v,e,f:[]};}
function mkPyramid(){return{v:[[0,1.2,0],[-1,-0.8,-1],[1,-0.8,-1],[1,-0.8,1],[-1,-0.8,1]],e:[[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[4,1]],f:[[0,1,2],[0,2,3],[0,3,4],[0,4,1],[1,2,3,4]]};}
function mkTorus(R,r,n,m){R=R||1;r=r||0.35;n=n||28;m=m||14;const v=[];for(let i=0;i<n;i++)for(let j=0;j<m;j++){const t=2*PI*i/n,p=2*PI*j/m;v.push([(R+r*cos(p))*cos(t),(R+r*cos(p))*sin(t),r*sin(p)]);}const e=[];for(let i=0;i<n;i++)for(let j=0;j<m;j++){const idx=i*m+j;e.push([idx,i*m+(j+1)%m]);e.push([idx,((i+1)%n)*m+j]);}return{v,e,f:[]};}
function mkHemisphere(r,n,m){r=r||1;n=n||20;m=m||10;const v=[];for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const t=PI*0.5*i/m,p=2*PI*j/n;v.push([r*sin(t)*cos(p),r*cos(t),r*sin(t)*sin(p)]);}const e=[];const w=n+1;for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const idx=i*w+j;if(j<n)e.push([idx,idx+1]);if(i<m)e.push([idx,idx+w]);}for(let j=0;j<n;j++){const bi=m*w+j;e.push([bi,m*w+j+1]);}return{v,e,f:[]};}

/* Compound shapes */
function mkPyrCube(){const c=mkCube(1,0.8,1);const py=[[0,1.8,0],[-1,0.8,-1],[1,0.8,-1],[1,0.8,1],[-1,0.8,1]];const off=c.v.length;const v=[...c.v,...py];const e=[...c.e,[off,off+1],[off,off+2],[off,off+3],[off,off+4],[off+1,off+2],[off+2,off+3],[off+3,off+4],[off+4,off+1]];return{v,e,f:[]};}
function mkConeCyl(){const cy=mkCylinder(0.8,1.4,24);const off=cy.v.length;const cv=[[0,1.4,0]];for(let i=0;i<24;i++){const a=2*PI*i/24;cv.push([0.8*cos(a),0.7,0.8*sin(a)]);}const v=[...cy.v,...cv];const e=[...cy.e];for(let i=1;i<=24;i++){e.push([off,off+i]);e.push([off+i,off+(i%24)+1]);}return{v,e,f:[]};}
function mkCylHemi(){const cy=mkCylinder(0.8,1.4,24);const off=cy.v.length;const hv=[];const n=20,m=8;for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const t=PI*0.5*i/m,p=2*PI*j/n;hv.push([0.8*sin(t)*cos(p),0.7+0.8*cos(t),0.8*sin(t)*sin(p)]);}const v=[...cy.v,...hv];const e=[...cy.e];const w=n+1;for(let i=0;i<=m;i++)for(let j=0;j<=n;j++){const idx=off+i*w+j;if(j<n)e.push([idx,idx+1]);if(i<m)e.push([idx,idx+w]);}return{v,e,f:[]};}

/* Nets (2D laid flat, z=0) */
function mkNetCube(){const s=1;const v=[];const e=[];const faces=[[0,0],[1,0],[2,0],[3,0],[1,-1],[1,1]];faces.forEach(([fx,fy])=>{const bx=fx*2*s,by=fy*2*s;const bi=v.length;v.push([bx-s,by-s,0],[bx+s,by-s,0],[bx+s,by+s,0],[bx-s,by+s,0]);e.push([bi,bi+1],[bi+1,bi+2],[bi+2,bi+3],[bi+3,bi]);});return{v,e,f:[]};}
function mkNetCyl(){const v=[];const e=[];const w=3,h=2;const bi=v.length;v.push([-w,-h,0],[w,-h,0],[w,h,0],[-w,h,0]);e.push([0,1],[1,2],[2,3],[3,0]);const n=24;for(let ci=0;ci<2;ci++){const cx=0,cy=ci===0?-h-1.2:h+1.2;const off=v.length;for(let i=0;i<=n;i++){const a=2*PI*i/n;v.push([cx+0.9*cos(a),cy+0.9*sin(a),0]);}for(let i=0;i<n;i++)e.push([off+i,off+i+1]);}return{v,e,f:[]};}
function mkNetCone(){const v=[];const e=[];const n=36;const R=2.5,off=v.length;v.push([0,0.5,0]);for(let i=0;i<=n;i++){const a=-PI*0.6+PI*1.2*i/n;v.push([R*cos(a),0.5+R*sin(a),0]);}for(let i=0;i<n;i++){e.push([0,off+1+i]);e.push([off+1+i,off+2+i]);}const boff=v.length;const cx=0,cy=-1.5;for(let i=0;i<=24;i++){const a=2*PI*i/24;v.push([cx+0.8*cos(a),cy+0.8*sin(a),0]);}for(let i=0;i<24;i++)e.push([boff+i,boff+i+1]);return{v,e,f:[]};}
function mkNetPyr(){const v=[];const e=[];const s=1;v.push([-s,-s,0],[s,-s,0],[s,s,0],[-s,s,0]);e.push([0,1],[1,2],[2,3],[3,0]);const tris=[[0,1,0,-2],[1,2,2,0],[2,3,0,2],[3,0,-2,0]];tris.forEach(([a,b,dx,dy])=>{const mx=(v[a][0]+v[b][0])/2+dx*0.8,my=(v[a][1]+v[b][1])/2+dy*0.8;const ti=v.length;v.push([mx,my,0]);e.push([a,ti],[b,ti]);});return{v,e,f:[]};}

const SHAPES={cube:()=>mkCube(),cuboid:()=>mkCube(1.5,0.8,0.6),sphere:()=>mkSphere(),cone:()=>mkCone(),cylinder:()=>mkCylinder(),pyramid:()=>mkPyramid(),torus:()=>mkTorus(),hemisphere:()=>mkHemisphere(),pyr_cube:mkPyrCube,cone_cyl:mkConeCyl,cyl_hemi:mkCylHemi,net_cube:mkNetCube,net_cyl:mkNetCyl,net_cone:mkNetCone,net_pyr:mkNetPyr};

const NAMES={cube:'Cube',cuboid:'Cuboid',sphere:'Sphere',cone:'Cone',cylinder:'Cylinder',pyramid:'Pyramid',torus:'Torus',hemisphere:'Hemisphere',pyr_cube:'Pyramid + Cube',cone_cyl:'Cone + Cylinder',cyl_hemi:'Cylinder + Hemisphere',net_cube:'Cube Net',net_cyl:'Cylinder Net',net_cone:'Cone Net',net_pyr:'Pyramid Net'};

const MEASURES={cube:'Side = 2 | V = 8 | SA = 24',cuboid:'3 x 1.6 x 1.2 | V = 5.76 | SA = 15.84',sphere:'r = 1 | V = 4.19 | SA = 12.57',cone:'r = 1, h = 2 | V = 2.09 | SA = 10.17',cylinder:'r = 0.8, h = 2 | V = 4.02 | SA = 14.07',pyramid:'Base 2x2, h = 2 | V = 2.67 | SA = 12.94',torus:'R = 1, r = 0.35 | V = 2.41 | SA = 13.79',hemisphere:'r = 1 | V = 2.09 | SA = 9.42',pyr_cube:'Compound shape',cone_cyl:'Compound shape',cyl_hemi:'Compound shape',net_cube:'Unfolded cube',net_cyl:'Unfolded cylinder',net_cone:'Unfolded cone',net_pyr:'Unfolded pyramid'};

let geo=SHAPES.cube();
function set(s){shape=s;geo=SHAPES[s]();userLines=[];selectedDot=-1;
document.querySelectorAll('#controls button').forEach(b=>b.classList.remove('active'));
const el=document.getElementById('b-'+s);if(el)el.classList.add('active');
if(wire)document.getElementById('b-wire').classList.add('active');
if(drawMode)document.getElementById('b-draw').classList.add('draw-active');
document.getElementById('shape-name').textContent=NAMES[s]||s;
document.getElementById('measurements').textContent=MEASURES[s]||'';}

function toggleWire(){wire=!wire;document.getElementById('b-wire').classList.toggle('active',wire);}
function toggleDraw(){drawMode=!drawMode;
document.getElementById('b-draw').classList.toggle('draw-active',drawMode);
c.classList.toggle('drawing',drawMode);
document.getElementById('draw-status').textContent=drawMode?'Click dots to connect them':'Drag to rotate \\u00b7 Scroll to zoom';
document.getElementById('draw-hint').textContent=drawMode?'Click any vertex dot to start drawing a line':'';
document.getElementById('draw-hint').style.opacity=drawMode?'1':'0';
selectedDot=-1;}
function clearLines(){userLines=[];selectedDot=-1;}

/* ── Projected vertices cache ── */
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
  const g=geo;
  projVerts=g.v.map(v=>proj(v[0],v[1],v[2]));
  const pv=projVerts;

  /* Faces (filled, painter's algo) */
  if(!wire&&g.f&&g.f.length>0){
    const sorted=g.f.map(f=>{const cz=f.reduce((s,i)=>s+pv[i].z,0)/f.length;return{f,z:cz};}).sort((a,b)=>a.z-b.z);
    sorted.forEach(({f})=>{
      ctx.beginPath();ctx.moveTo(pv[f[0]].x,pv[f[0]].y);
      for(let i=1;i<f.length;i++)ctx.lineTo(pv[f[i]].x,pv[f[i]].y);
      ctx.closePath();
      ctx.fillStyle='rgba(59,130,246,0.12)';ctx.fill();
      ctx.strokeStyle='rgba(59,130,246,0.4)';ctx.lineWidth=1;ctx.stroke();
    });
  }

  /* Edges */
  ctx.strokeStyle=wire?'rgba(59,130,246,0.5)':'rgba(59,130,246,0.35)';
  ctx.lineWidth=wire?0.8:0.6;
  g.e.forEach(([a,b])=>{if(a<pv.length&&b<pv.length){ctx.beginPath();ctx.moveTo(pv[a].x,pv[a].y);ctx.lineTo(pv[b].x,pv[b].y);ctx.stroke();}});

  /* User-drawn lines */
  if(userLines.length>0){
    ctx.strokeStyle='rgba(16,185,129,0.8)';ctx.lineWidth=2;
    userLines.forEach(([a,b])=>{
      if(a<pv.length&&b<pv.length){ctx.beginPath();ctx.moveTo(pv[a].x,pv[a].y);ctx.lineTo(pv[b].x,pv[b].y);ctx.stroke();}
    });
  }

  /* In-progress line from selected dot to cursor */
  if(drawMode&&selectedDot>=0&&selectedDot<pv.length){
    ctx.setLineDash([4,4]);ctx.strokeStyle='rgba(16,185,129,0.5)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(pv[selectedDot].x,pv[selectedDot].y);ctx.lineTo(mousePos.x,mousePos.y);ctx.stroke();
    ctx.setLineDash([]);
  }

  /* Dots */
  for(let i=0;i<pv.length;i++){
    const isSelected=drawMode&&i===selectedDot;
    const isHover=drawMode&&i===hoverDot;
    const r=isSelected?5:isHover?4:2;
    const col=isSelected?'rgba(16,185,129,1)':isHover?'rgba(16,185,129,0.7)':'rgba(147,197,253,0.7)';
    ctx.beginPath();ctx.arc(pv[i].x,pv[i].y,r,0,PI*2);ctx.fillStyle=col;ctx.fill();
    if(isSelected||isHover){ctx.strokeStyle=col;ctx.lineWidth=1;ctx.beginPath();ctx.arc(pv[i].x,pv[i].y,r+3,0,PI*2);ctx.stroke();}
  }

  if(!drag&&!drawMode){rotY+=0.003;rotX+=0.001;}
  requestAnimationFrame(draw);
}

const mousePos={x:-999,y:-999};

c.addEventListener('mousedown',e=>{
  if(drawMode){
    const dot=findClosestDot(e.clientX,e.clientY,20);
    if(dot>=0){
      if(selectedDot>=0&&selectedDot!==dot){
        userLines.push([selectedDot,dot]);
        selectedDot=-1;
        document.getElementById('draw-hint').style.opacity='0';
      }else{
        selectedDot=dot;
        document.getElementById('draw-hint').textContent='Now click another dot to connect';
      }
    }else{selectedDot=-1;document.getElementById('draw-hint').textContent='Click any vertex dot to start drawing a line';}
    return;
  }
  drag=true;lx=e.clientX;ly=e.clientY;
});
addEventListener('mouseup',()=>{drag=false;});
addEventListener('mousemove',e=>{
  mousePos.x=e.clientX;mousePos.y=e.clientY;
  if(drawMode){hoverDot=findClosestDot(e.clientX,e.clientY,20);return;}
  if(!drag)return;
  rotY+=(e.clientX-lx)*0.008;rotX+=(e.clientY-ly)*0.008;lx=e.clientX;ly=e.clientY;
});
c.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(60,Math.min(800,zoom-e.deltaY*0.5));},{passive:false});

/* Touch */
c.addEventListener('touchstart',e=>{
  if(drawMode&&e.touches.length===1){
    const t=e.touches[0];const dot=findClosestDot(t.clientX,t.clientY,30);
    if(dot>=0){if(selectedDot>=0&&selectedDot!==dot){userLines.push([selectedDot,dot]);selectedDot=-1;}else{selectedDot=dot;}}
    return;
  }
  if(e.touches.length===1){drag=true;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}
},{passive:true});
addEventListener('touchend',()=>{drag=false;});
addEventListener('touchmove',e=>{
  if(!drag||e.touches.length!==1)return;
  const t=e.touches[0];rotY+=(t.clientX-lx)*0.008;rotX+=(t.clientY-ly)*0.008;lx=t.clientX;ly=t.clientY;
},{passive:true});

document.getElementById('measurements').textContent=MEASURES.cube;
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
body{background:#0a0a1a;overflow:hidden;font-family:system-ui,sans-serif}
canvas{display:block}
#controls{position:fixed;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10;flex-wrap:wrap;justify-content:center}
button{padding:7px 16px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);color:#fff;border-radius:8px;cursor:pointer;font-size:12px;backdrop-filter:blur(8px);transition:all .2s}
button:hover{background:rgba(255,255,255,0.15)}
button.active{background:rgba(16,185,129,0.3);border-color:rgba(16,185,129,0.6)}
#info{position:fixed;top:16px;right:16px;color:rgba(255,255,255,0.5);font-size:12px;text-align:right;line-height:1.8}
</style></head><body>
<canvas id="c"></canvas>
<div id="controls">
  <button onclick="setFn('sin')" id="btn-sin" class="active">sin(x)</button>
  <button onclick="setFn('x2')" id="btn-x2">x&sup2;</button>
  <button onclick="setFn('x3')" id="btn-x3">x&sup3;</button>
  <button onclick="setFn('exp')" id="btn-exp">e^x</button>
  <button onclick="toggleDeriv()" id="btn-d">Derivative</button>
  <button onclick="toggleInteg()" id="btn-i">Integral</button>
</div>
<div id="info">Drag to pan &middot; Scroll to zoom</div>
<script>
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W,H,fn='sin',showDeriv=false,showInteg=false,oX=0,oY=0,scaleX=60,scaleY=60,dragging=false,lastX,lastY;
function resize(){W=c.width=innerWidth;H=c.height=innerHeight;oX=W/2;oY=H/2;}
resize();addEventListener('resize',resize);

const fns={sin:x=>Math.sin(x),x2:x=>x*x,x3:x=>x*x*x,exp:x=>Math.exp(x)};
const derivs={sin:x=>Math.cos(x),x2:x=>2*x,x3:x=>3*x*x,exp:x=>Math.exp(x)};

function setFn(f){fn=f;document.querySelectorAll('#controls button').forEach(b=>{if(b.id.startsWith('btn-')&&b.id!=='btn-d'&&b.id!=='btn-i')b.classList.toggle('active',b.id==='btn-'+f);});}
function toggleDeriv(){showDeriv=!showDeriv;document.getElementById('btn-d').classList.toggle('active',showDeriv);}
function toggleInteg(){showInteg=!showInteg;document.getElementById('btn-i').classList.toggle('active',showInteg);}

function draw(){
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='rgba(255,255,255,0.06)';ctx.lineWidth=0.5;
  const sx=scaleX,sy=scaleY;
  for(let x=Math.floor(-oX/sx)*sx;x<W;x+=sx){const px=oX+x;ctx.beginPath();ctx.moveTo(px,0);ctx.lineTo(px,H);ctx.stroke();}
  for(let y=Math.floor(-oY/sy)*sy;y<H;y+=sy){const py=oY+y;ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(W,py);ctx.stroke();}
  // Axes
  ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,oY);ctx.lineTo(W,oY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(oX,0);ctx.lineTo(oX,H);ctx.stroke();

  function plotFn(f,color,width){
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;
    let first=true;
    for(let px=0;px<W;px+=1){
      const x=(px-oX)/sx;const y=f(x);const py=oY-y*sy;
      if(first){ctx.moveTo(px,py);first=false;}else ctx.lineTo(px,py);
    }ctx.stroke();
  }

  // Integral fill
  if(showInteg){
    ctx.beginPath();const f=fns[fn];
    const x0=-2,x1=2;const px0=oX+x0*sx,px1=oX+x1*sx;
    ctx.moveTo(px0,oY);
    for(let px=px0;px<=px1;px++){const x=(px-oX)/sx;ctx.lineTo(px,oY-f(x)*sy);}
    ctx.lineTo(px1,oY);ctx.closePath();
    ctx.fillStyle='rgba(16,185,129,0.12)';ctx.fill();
  }

  plotFn(fns[fn],'#10b981',2.5);
  if(showDeriv)plotFn(derivs[fn],'#f59e0b',1.8);

  requestAnimationFrame(draw);
}

c.addEventListener('mousedown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY});
addEventListener('mouseup',()=>dragging=false);
addEventListener('mousemove',e=>{if(!dragging)return;oX+=e.clientX-lastX;oY+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;});
c.addEventListener('wheel',e=>{e.preventDefault();const f=e.deltaY>0?0.9:1.1;scaleX*=f;scaleY*=f;scaleX=Math.max(10,Math.min(300,scaleX));scaleY=Math.max(10,Math.min(300,scaleY));},{passive:false});

draw();
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
        title: '3D Calculus Visualiser',
        description: 'Plot functions, visualise derivatives and integrals, and explore limits on interactive graphs.',
        icon: 'TrendingUp',
        gradient: 'from-emerald-500 to-teal-500',
        glowColor: 'rgba(16,185,129,0.35)',
        difficulty: 'Advanced',
        tags: ['Differentiation', 'Integration', 'Limits'],
        instructions: 'Select a function from the bottom bar. Toggle "Derivative" to overlay the derivative curve in amber. Toggle "Integral" to shade the area under the curve between x = -2 and x = 2. Drag to pan the graph. Scroll to zoom.',
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
