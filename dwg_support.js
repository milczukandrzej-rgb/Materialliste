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

/* ---- INSERT footprint in WORLD coords (meters), via OCS ----
   `origin` is the block geometry's min-corner offset {ox,oy} read from the real block (in block
   units). The block geometry spans origin..origin+(w,h). Passing the true origin makes centered
   blocks (origin=-w/2) and corner blocks (origin=0) both line up exactly with the DWG. If origin
   is omitted we fall back to corner (0,0). */
function insertRectWorld(e, wmm, hmm, origin){
  const ip=e.insertionPoint||{x:0,y:0,z:0};
  const rot=e.rotation||0, c=Math.cos(rot), s=Math.sin(rot);
  const N=e.extrusionDirection;
  const ox = origin? origin.ox : 0, oy = origin? origin.oy : 0;
  const cor=[[ox,oy],[ox+wmm,oy],[ox+wmm,oy+hmm],[ox,oy+hmm]];
  return cor.map(([x,y])=>{
    const wx=ip.x+(x*c - y*s), wy=ip.y+(x*s + y*c);
    const w=ocsToWorld({x:wx, y:wy, z:ip.z||0}, N);
    return [w[0]/1000, w[1]/1000];
  });
}

/* ---- INSERT footprint TRUE-SIZE in the face's own OCS plane (mm->m) ----
   The block is drawn native-size in OCS; insertionPoint is already OCS. So OCS
   (x,y) IS the un-distorted true-size 2D layout of the tilted face. We keep these
   per-face and later translate each face to its world position for a combined plan. */
function insertRectOCS(e, wmm, hmm){
  const ip=e.insertionPoint||{x:0,y:0,z:0};
  const rot=e.rotation||0, c=Math.cos(rot), s=Math.sin(rot);
  const cor=[[0,0],[wmm,0],[wmm,hmm],[0,hmm]];
  return cor.map(([x,y])=>[(ip.x+(x*c-y*s))/1000, (ip.y+(x*s+y*c))/1000]);
}
// world point -> OCS xy (for RoofArea verts), true-size
function worldToOCSxy(p,N){
  const b=ocsBasis(N);
  return [(p.x*b.X[0]+p.y*b.X[1]+p.z*b.X[2])/1000, (p.x*b.Y[0]+p.y*b.Y[1]+p.z*b.Y[2])/1000];
}
function faceKey(N){ return N? `${N.x.toFixed(3)},${N.y.toFixed(3)},${N.z.toFixed(3)}` : '0,0,1'; }

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

function mapSPT(entities, blockOrigin){
  blockOrigin = blockOrigin||{};
  const out=[];
  const auraPlates=[];
  const roofs=[];
  for(const e of entities){
    const lay=e.layer;
    if(lay==='Modules' && e.type==='INSERT'){
      const t=moduleTypeFromName(e.name);
      const org=blockOrigin[e.name];
      if(t){
        const wmm=t==='XL'?1940:(t==='L'?1380:1010);
        out.push({layer:'MODULES', verts:insertRectWorld(e,wmm,857,org), name:e.name, modType:t});
      } else {
        const aw=auraWidthFromName(e.name);
        if(aw){ const ah=auraHeightFromName(e.name); auraPlates.push({widthMM:aw, heightMM:ah, verts:insertRectWorld(e,aw,ah,org)}); }
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
      const nm=e.name||'';
      // SnowGuardModuleSize entries are the (reduced-height) Aura plates under the snow-guard
      // supports at the eaves. Their real size+origin come from the block geometry (same as
      // normal aura), NOT from the name's Min/max (which are in a different coordinate frame).
      if(/SnowGuardModuleSize/i.test(nm)){
        const org=blockOrigin[nm];
        if(org && org.w>=200 && org.h>=200){
          const verts=insertRectWorld(e,org.w,org.h,org);
          let cx=0,cy=0;verts.forEach(p=>{cx+=p[0];cy+=p[1];});cx/=verts.length;cy/=verts.length;
          const dup=auraPlates.some(a=>{let ax=0,ay=0;a.verts.forEach(p=>{ax+=p[0];ay+=p[1];});ax/=a.verts.length;ay/=a.verts.length;return Math.hypot(ax-cx,ay-cy)<0.30;});
          if(!dup) auraPlates.push({widthMM:Math.round(org.w), heightMM:Math.round(org.h), verts, snowGuard:true});
        }
      } else if(/SchneeHalter/i.test(nm)) {
        const w=ocsToWorld(e.insertionPoint||{x:0,y:0,z:0}, e.extrusionDirection);
        out.push({layer:'__SNOWGUARD__', verts:[[w[0]/1000,w[1]/1000],[w[0]/1000,w[1]/1000]], name:nm});
      }
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
  // Map each block name to the offset of its geometry's min-corner from the insertion origin.
  // SPT draws some blocks centered (geometry runs -w/2..+w/2) and some corner-based (0..w);
  // reading the real block geometry lets the plan line up exactly with the DWG either way.
  const blockOrigin={};
  try{
    const recs=(db.tables&&db.tables.BLOCK_RECORD&&db.tables.BLOCK_RECORD.entries)||[];
    recs.forEach(b=>{
      const poly=(b.entities||[]).find(e=>/POLYLINE|LWPOLYLINE/.test(e.type)&&e.vertices&&e.vertices.length>=3);
      if(poly){let mnx=1e9,mny=1e9,mxx=-1e9,mxy=-1e9;poly.vertices.forEach(p=>{mnx=Math.min(mnx,p.x);mny=Math.min(mny,p.y);mxx=Math.max(mxx,p.x);mxy=Math.max(mxy,p.y);});
        blockOrigin[b.name]={ox:mnx, oy:mny, w:mxx-mnx, h:mxy-mny};}
    });
  }catch(e){}
  const {resolved, auraPlates, roofs}=mapSPT(ents, blockOrigin);
  window.__SPT_AURA = auraPlates;
  window.__SPT_ROOFS = roofs;
  return resolved;
};
window.__DWG_READY = true;
