/* ============================================================
   DWG support for SPT exports (libredwg-web) + SPT layer mapping
   Exposes window.__readDWG(arrayBuffer) -> resolved entities
   in the same shape parseDXF returns: [{layer, verts:[[x,y]...], name}]
   ============================================================ */
import { LibreDwg, Dwg_File_Type } from './dist-esm.js';

let _lib=null;
async function getLib(){ if(!_lib) _lib=await LibreDwg.create('./'); return _lib; }

// rotate+translate an INSERT's implicit unit box? No — for Modules/Aura we use
// the insertion point and a nominal footprint derived from the block name size.
// For polylines we use vertices directly.

function polyVerts(e){
  if(e.vertices&&e.vertices.length) return e.vertices.map(v=>[v.x,v.y]);
  if(e.points&&e.points.length) return e.points.map(v=>[v.x,v.y]);
  if(e.startPoint&&e.endPoint) return [[e.startPoint.x,e.startPoint.y],[e.endPoint.x,e.endPoint.y]];
  return null;
}

// Build a rectangle footprint (world coords, meters) for an INSERT given width/height mm
function insertRect(e, wmm, hmm){
  const ip=e.insertionPoint||{x:0,y:0};
  const rot=e.rotation||0; const c=Math.cos(rot), s=Math.sin(rot);
  const w=(wmm/1000), h=(hmm/1000);
  // local corners centered on insertion (SPT blocks are inserted at a corner; centering is approximate but fine for area/long-edge)
  const cor=[[0,0],[w,0],[w,h],[0,h]];
  return cor.map(([x,y])=>[ ip.x/1000 + (x*c - y*s), ip.y/1000 + (x*s + y*c) ]);
}

function moduleTypeFromName(name){
  const m=(name||'').match(/Modul HC (XL|L|M)\b/i);
  return m? m[1].toUpperCase() : null;
}
function auraWidthFromName(name){
  // "Sunskin Aura_1940857..." or "Aura1380x857..." or height-cut "Aura_932856"/"Aura_2370536"
  // Format: Aura[_]<width><height> where width=3-4 digits, height=3 digits, OR <width>x<height>
  let m=(name||'').match(/Aura[_]?(\d{3,4})x(\d{3})\b/i);            // explicit WxH
  if(m) return parseInt(m[1],10);
  m=(name||'').match(/Aura[_]?(\d{3,4})(\d{3})_/i);                  // concatenated WHHH_<id>
  if(m) return parseInt(m[1],10);
  m=(name||'').match(/Aura[_]?(\d{3,4})x?857/i);                     // standard height 857
  return m? parseInt(m[1],10) : null;
}
function auraHeightFromName(name){
  let m=(name||'').match(/Aura[_]?\d{3,4}x(\d{3})\b/i);
  if(m) return parseInt(m[1],10);
  m=(name||'').match(/Aura[_]?\d{3,4}(\d{3})_/i);
  return m? parseInt(m[1],10) : 857;
}

// Map SPT entities -> tool's resolved layer format.
// Standard PV*Sol layer names are emitted so the existing pipeline works unchanged:
//   MODULES (modules), and a parallel list of pre-placed AURA plates with widths,
//   MODULECARRIERS (RoofArea/Roofing), BARREDAREAS (InterferenceFields),
//   ENVIRONMENT, plus SPT-specific: SnowGuard inserts.
function mapSPT(entities){
  const out=[];
  const auraPlates=[]; // {widthMM, verts}
  for(const e of entities){
    const lay=e.layer;
    if(lay==='Modules' && e.type==='INSERT'){
      const t=moduleTypeFromName(e.name);
      if(t){
        const wmm = t==='XL'?1940:(t==='L'?1380:1010);
        out.push({layer:'MODULES', verts:insertRect(e,wmm,857), name:e.name, modType:t});
      } else {
        const aw=auraWidthFromName(e.name);
        if(aw){ const ah=auraHeightFromName(e.name); const v=insertRect(e,aw,ah); auraPlates.push({widthMM:aw, heightMM:ah, verts:v}); }
      }
      continue;
    }
    if(lay==='RoofArea' || lay==='Roofing' || lay==='RoofSubstructure'){
      const v=polyVerts(e); if(v&&v.length>=2) out.push({layer:'MODULECARRIERS', verts:v.map(p=>[p[0]/1000,p[1]/1000])});
      continue;
    }
    if(lay==='InterferenceFields'){
      const v=polyVerts(e); if(v&&v.length>=2) out.push({layer:'BARREDAREAS', verts:v.map(p=>[p[0]/1000,p[1]/1000])});
      continue;
    }
    if(lay==='SnowGuard' && e.type==='INSERT'){
      // name carries min/max module span; place a marker line from min->max if parseable
      const ip=e.insertionPoint||{x:0,y:0};
      out.push({layer:'__SNOWGUARD__', verts:[[ip.x/1000,ip.y/1000],[ip.x/1000,ip.y/1000]], name:e.name});
      continue;
    }
    // environment / outline
    if(lay==='RoofDimensioning'||lay==='0'){ /* skip noise */ continue; }
  }
  return {resolved:out, auraPlates};
}

window.__readDWG = async function(arrayBuffer){
  const L=await getLib();
  const dwg=L.dwg_read_data(arrayBuffer, Dwg_File_Type.DWG);
  const db=L.convert(dwg);
  const ents=db.entities||[];
  const {resolved, auraPlates}=mapSPT(ents);
  // expose pre-placed aura plates for the rule engine (SPT has them explicitly)
  window.__SPT_AURA = auraPlates;
  return resolved;
};
window.__DWG_READY = true;
