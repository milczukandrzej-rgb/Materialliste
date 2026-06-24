/* ============================================================
   DWG support for SPT (Solar.Pro.Tool) exports via libredwg-web.
   Key insight: module/aura INSERTs are 3D entities on tilted roof
   planes. Their insertionPoint is in the entity's OCS (Object
   Coordinate System) defined by extrusionDirection. We must apply
   the Arbitrary Axis Algorithm (OCS->World) so modules land on the
   roof areas. RoofArea/Roofing polylines are already in world coords.
   Exposes:
     window.__readDWG(arrayBuffer) -> resolved entities [{layer,verts,name,modType}]
     window.__SPT_AURA  -> [{widthMM,heightMM,verts}]
     window.__SPT_ROOFS -> [{verts,pitch,ridge:[[x,y],[x,y]]}]  per roof face
   ============================================================ */
import { LibreDwg, Dwg_File_Type } from './dist-esm.js';

let _lib=null;
async function getLib(){ if(!_lib) _lib=await LibreDwg.create('./'); return _lib; }

/* ---- OCS (Arbitrary Axis Algorithm) ---- */
function ocsBasis(N){
  const nx=N.x, ny=N.y, nz=N.z;
  let Ax,Ay,Az;
  if(Math.abs(nx)<1/64 && Math.abs(ny)<1/64){
    // Wy x N, with Wy=(0,1,0): (0,1,0)x(nx,ny,nz) = (nz, 0, -nx)
    Ax=nz; Ay=0; Az=-nx;
  } else {
    // Wz x N, with Wz=(0,0,1): (0,0,1)x(nx,ny,nz) = (-ny, nx, 0)
    Ax=-ny; Ay=nx; Az=0;
  }
  const la=Math.hypot(Ax,Ay,Az)||1; Ax/=la; Ay/=la; Az/=la;
  // OCS Y = N x A
  const Bx=ny*Az-nz*Ay, By=nz*Ax-nx*Az, Bz=nx*Ay-ny*Ax;
  return {X:[Ax,Ay,Az], Y:[Bx,By,Bz], Z:[nx,ny,nz]};
}
function isWorldZ(N){ return !N || (Math.abs(N.x)<1e-9 && Math.abs(N.y)<1e-9 && Math.abs((N.z||0)-1)<1e-6); }
function ocsToWorld(pt,N){
  if(isWorldZ(N)) return [pt.x, pt.y, pt.z||0];
  const b=ocsBasis(N);
  return [
    pt.x*b.X[0]+pt.y*b.Y[0]+pt.z*b.Z[0],
    pt.x*b.X[1]+pt.y*b.Y[1]+pt.z*b.Z[1],
    pt.x*b.X[2]+pt.y*b.Y[2]+pt.z*b.Z[2]
  ];
}

/* ---- INSERT footprint in WORLD coords (meters), via OCS ---- */
function insertRectWorld(e, wmm, hmm){
  const ip=e.insertionPoint||{x:0,y:0,z:0};
  const rot=e.rotation||0, c=Math.cos(rot), s=Math.sin(rot);
  const N=e.extrusionDirection;
  // corners in OCS plane (block drawn from insertion corner)
  const cor=[[0,0],[wmm,0],[wmm,hmm],[0,hmm]];
  return cor.map(([x,y])=>{
    const ox=ip.x+(x*c - y*s), oy=ip.y+(x*s + y*c);
    const w=ocsToWorld({x:ox, y:oy, z:ip.z||0}, N);
    return [w[0]/1000, w[1]/1000];
  });
}

function polyVertsWorld(e){
  // RoofArea/Roofing/InterferenceFields are POLYLINE3D already in world coords
  if(e.vertices&&e.vertices.length) return e.vertices.map(v=>[v.x/1000, v.y/1000]);
  if(e.points&&e.points.length) return e.points.map(v=>[v.x/1000, v.y/1000]);
  if(e.startPoint&&e.endPoint) return [[e.startPoint.x/1000,e.startPoint.y/1000],[e.endPoint.x/1000,e.endPoint.y/1000]];
  return null;
}

function moduleTypeFromName(name){
  const m=(name||'').match(/Modul HC (XL|L|M)\b/i);
  return m? m[1].toUpperCase() : null;
}
function auraWidthFromName(name){
  let m=(name||'').match(/Aura[_]?(\d{3,4})x(\d{3})\b/i); if(m) return +m[1];
  m=(name||'').match(/Aura[_]?(\d{3,4})(\d{3})_/i);        if(m) return +m[1];
  m=(name||'').match(/Aura[_]?(\d{3,4})x?857/i);           return m? +m[1] : null;
}
function auraHeightFromName(name){
  let m=(name||'').match(/Aura[_]?\d{3,4}x(\d{3})\b/i); if(m) return +m[1];
  m=(name||'').match(/Aura[_]?\d{3,4}(\d{3})_/i);       return m? +m[1] : 857;
}

/* ---- per-roof-face pitch + ridge from 3D RoofArea ---- */
function roofFaceInfo(e){
  const v=e.vertices||[];
  if(v.length<3) return null;
  const zs=v.map(p=>p.z);
  const zmax=Math.max(...zs), zmin=Math.min(...zs), dz=zmax-zmin;
  // ridge = vertices at max z (top edge); eave = vertices at min z
  const hi=v.filter(p=>Math.abs(p.z-zmax)<50);
  const lo=v.filter(p=>Math.abs(p.z-zmin)<50);
  let run=0;
  hi.forEach(a=>lo.forEach(b=>{const d=Math.hypot(a.x-b.x,a.y-b.y);if(d>run)run=d;}));
  const pitch = run>10 ? Math.round(Math.atan(dz/run)*180/Math.PI) : 0;
  // ridge line endpoints (world m): the two extreme hi vertices
  let ridge=null;
  if(hi.length>=2){
    let best=0,a0=hi[0],b0=hi[0];
    for(let i=0;i<hi.length;i++)for(let j=i+1;j<hi.length;j++){const d=Math.hypot(hi[i].x-hi[j].x,hi[i].y-hi[j].y);if(d>best){best=d;a0=hi[i];b0=hi[j];}}
    ridge=[[a0.x/1000,a0.y/1000],[b0.x/1000,b0.y/1000]];
  }
  const verts=v.map(p=>[p.x/1000,p.y/1000]);
  return {verts, pitch, dz, ridge};
}

function mapSPT(entities){
  const out=[];
  const auraPlates=[];
  const roofs=[];
  for(const e of entities){
    const lay=e.layer;
    if(lay==='Modules' && e.type==='INSERT'){
      const t=moduleTypeFromName(e.name);
      if(t){
        const wmm=t==='XL'?1940:(t==='L'?1380:1010);
        out.push({layer:'MODULES', verts:insertRectWorld(e,wmm,857), name:e.name, modType:t});
      } else {
        const aw=auraWidthFromName(e.name);
        if(aw){ const ah=auraHeightFromName(e.name); auraPlates.push({widthMM:aw, heightMM:ah, verts:insertRectWorld(e,aw,ah)}); }
      }
      continue;
    }
    if(lay==='RoofArea'){
      const info=roofFaceInfo(e);
      // skip flat helper faces (pitch 0 with no dz)
      if(info && info.dz>100){ roofs.push(info); out.push({layer:'MODULECARRIERS', verts:info.verts}); }
      continue;
    }
    if(lay==='InterferenceFields'){
      const v=polyVertsWorld(e); if(v&&v.length>=2) out.push({layer:'BARREDAREAS', verts:v});
      continue;
    }
    if(lay==='SnowGuard' && e.type==='INSERT'){
      const w=ocsToWorld(e.insertionPoint||{x:0,y:0,z:0}, e.extrusionDirection);
      out.push({layer:'__SNOWGUARD__', verts:[[w[0]/1000,w[1]/1000],[w[0]/1000,w[1]/1000]], name:e.name});
      continue;
    }
  }
  return {resolved:out, auraPlates, roofs};
}

window.__readDWG = async function(arrayBuffer){
  const L=await getLib();
  const dwg=L.dwg_read_data(arrayBuffer, Dwg_File_Type.DWG);
  const db=L.convert(dwg);
  const ents=db.entities||[];
  const {resolved, auraPlates, roofs}=mapSPT(ents);
  window.__SPT_AURA = auraPlates;
  window.__SPT_ROOFS = roofs;
  return resolved;
};
window.__DWG_READY = true;
