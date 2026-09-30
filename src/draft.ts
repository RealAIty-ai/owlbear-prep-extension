import OBR from '@owlbear-rodeo/sdk';
import {parseAdventure,type Dungeon,type Found} from './adventure';
import {mapRect,spread,type MapLike} from './scene';
import * as roster from './roster';
// Entwurf je Szene: Bereiche aus dem Abenteuertext + auf der DM-Karte markierte Punkte (Anteile 0..1 der Karte).
// Das Markier-Werkzeug (background.ts) hängt Punkte an den Bereich `current` an.
import {DRAFT,TOOL,MARK_NS,type Draft} from './draft-keys';
let dungeons:Dungeon[]=[],draft:Draft|undefined,say:(s:string)=>void=()=>{};
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
function h<T extends HTMLElement=HTMLElement>(tag:string,props:Record<string,unknown>={},...kids:(Node|string)[]):T{const e=Object.assign(document.createElement(tag),props) as T;e.append(...kids);return e;}
async function save(){render();await OBR.scene.setMetadata({[DRAFT]:draft});}
export async function load(status:(s:string)=>void){say=status;const v=(await OBR.scene.getMetadata())[DRAFT] as Draft|undefined;draft=v;render();
  OBR.scene.onMetadataChange(m=>{draft=m[DRAFT] as Draft|undefined;render();});}
export function init(status:(s:string)=>void){say=status;
  $<HTMLInputElement>('advFile').onchange=async e=>{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;dungeons=parseAdventure(await f.text());
    const sel=$<HTMLSelectElement>('dungeon');sel.replaceChildren(new Option(`– ${dungeons.length} Dungeons gefunden –`,''),...dungeons.map((d,i)=>new Option(`${d.title} (${d.areas.length} Bereiche)`,String(i))));say(`${dungeons.length} Dungeons mit nummerierten Bereichen gefunden.`);};
  $<HTMLButtonElement>('takeDungeon').onclick=()=>{const d=dungeons[Number($<HTMLSelectElement>('dungeon').value)];if(!d)return say('Erst Abenteuertext laden und Dungeon wählen.');
    if(draft?.areas.some(a=>a.points.length)&&draft.dungeon!==d.title&&!$<HTMLInputElement>('confirm').checked)return say('Die Szene hat schon markierte Punkte für einen anderen Dungeon. Zum Ersetzen „Testszene“ bestätigen.');
    draft={dungeon:d.title,dmMap:draft?.dmMap,areas:d.areas.map(a=>({...a,monsters:a.monsters.map(m=>({...m})),points:[]}))};void save();say(`„${d.title}“ übernommen. Monster prüfen, dann in die Monsterliste übernehmen.`);};
  $<HTMLSelectElement>('dmSel').onchange=()=>{if(draft){draft.dmMap=$<HTMLSelectElement>('dmSel').value||undefined;void save();}};
  $<HTMLButtonElement>('toRoster').onclick=()=>{if(!draft)return;const n=[...new Set(draft.areas.flatMap(a=>a.monsters.map(m=>m.type)))].filter(roster.add).length;say(`${n} Monster in die Monsterliste übernommen. Jetzt Token/Statblock je Monster wählen.`);};
  $<HTMLButtonElement>('makePlan').onclick=()=>makePlan().catch(e=>say(e instanceof Error?e.message:String(e)));
  $<HTMLButtonElement>('savePlan').onclick=()=>{const t=$<HTMLTextAreaElement>('plan').value,a=h<HTMLAnchorElement>('a',{href:URL.createObjectURL(new Blob([t],{type:'application/json'})),download:`${JSON.parse(t).id??'plan'}.json`});a.click();URL.revokeObjectURL(a.href);};
}
export async function mark(i:number){if(!draft)return;draft.dmMap??=$<HTMLSelectElement>('dmSel').value||undefined;if(!draft.dmMap)return say('Erst die DM-Karte wählen.');draft.current=i;await save();await OBR.tool.activateTool(TOOL);
  const [dm]=await OBR.scene.items.getItems([draft.dmMap]);if(dm){const b=mapRect(dm as unknown as MapLike,await OBR.scene.grid.getDpi());await OBR.viewport.animateToBounds({min:{x:b.x,y:b.y},max:{x:b.x+b.w,y:b.y+b.h},width:b.w,height:b.h,center:{x:b.x+b.w/2,y:b.y+b.h/2}});}
  say(`Klicke auf der DM-Karte auf Bereich ${draft.areas[i].no} (${draft.areas[i].name}) – für jede Stelle einmal (z. B. jede „2“, jedes Grubenfeld).`);}
async function clearPoints(i:number){if(!draft)return;const a=draft.areas[i];a.points=[];await save();
  await OBR.scene.items.deleteItems((await OBR.scene.items.getItems(x=>(x.metadata[MARK_NS] as {area?:string}|undefined)?.area===a.no)).map(x=>x.id));}
export function render(){
  const box=$('areas');box.replaceChildren();if(!draft){box.append(h('p',{className:'hint'},'Noch kein Dungeon übernommen.'));return;}
  if(draft.dmMap)$<HTMLSelectElement>('dmSel').value=draft.dmMap;
  box.append(h('p',{},'Dungeon: ',h('b',{},draft.dungeon)));
  draft.areas.forEach((a,i)=>{
    const rows=a.monsters.map((m,k)=>{const t=h<HTMLInputElement>('input',{value:m.type,maxLength:80}),c=h<HTMLInputElement>('input',{type:'number',min:'1',value:String(m.count)}),e=h<HTMLInputElement>('input',{type:'checkbox',checked:m.each}),x=h('button',{textContent:'×',title:'Monster entfernen',className:'secondary'});
      t.onchange=()=>{m.type=t.value.trim()||m.type;void save();};c.onchange=()=>{m.count=Math.max(1,Math.floor(Number(c.value))||1);void save();};e.onchange=()=>{m.each=e.checked;void save();};x.onclick=()=>{a.monsters.splice(k,1);void save();};
      return h('div',{className:'row'},c,'×',t,h('label',{},e,' je Punkt'),x);});
    const add=h('button',{textContent:'+ Monster',className:'secondary'});add.onclick=()=>{a.monsters.push({type:'Monster',count:1,each:false});void save();};
    const mk=h('button',{textContent:'Markieren'}),cl=h('button',{textContent:'Punkte löschen',className:'secondary'});mk.onclick=()=>void mark(i);cl.onclick=()=>void clearPoints(i);
    box.append(h('fieldset',{},h('legend',{},`${a.no}. ${a.name}`),
      ...(a.names.length?[h('p',{className:'warn'},`Namen im Text: ${a.names.join(', ')}`)]:[]),...rows,
      h('div',{className:'row'},add,mk,cl,h('span',{className:a.points.length?'ok':'warn'},` ${a.points.length} Punkt(e)`))));
  });
}
// Tokenmitte: gerade Größen (2, 4) auf Rasterkreuzungen, sonst auf Feldmitten.
const snap=(v:number,size:number)=>Number.isInteger(size)&&size%2===0?Math.round(v):Math.floor(v)+0.5;
// Erzeugt einen normalen Plan (v1): Monster je Punkt, umgerechnet von der DM-Karte auf die Spielerkarte (gleiche Geometrie vorausgesetzt).
async function makePlan(){
  if(!draft)throw Error('Erst einen Dungeon übernehmen.');
  const player=$<HTMLSelectElement>('mapSel').value;if(!player)throw Error('Erst die Spielerkarte (Ursprungskarte) wählen.');
  const dpi=await OBR.scene.grid.getDpi(),[pm]=await OBR.scene.items.getItems([player]);if(!pm)throw Error('Spielerkarte nicht gefunden.');
  const r=mapRect(pm as unknown as MapLike,dpi),monsters:{id:string;name:string;type:string;x:number;y:number;size:number}[]=[],missing:string[]=[];
  // Bereiche ohne Punkt landen in einer Ablage unter der Spielerkarte (eine Zeile je Bereich), damit kein Monster aus dem Text fehlt.
  let shelf=r.h/dpi+2;
  for(const a of draft.areas){if(!a.monsters.length)continue;
    const named=a.names.length===1&&a.monsters.length===1&&a.monsters[0].count===1?a.names[0]:undefined;
    const pts=a.points.length?a.points:[undefined];if(!a.points.length)missing.push(a.no);
    pts.forEach((p,pi)=>{const here=a.monsters.flatMap(m=>m.each||pi===0?Array.from({length:m.count},()=>m.type):[]);if(!here.length)return;
      const size=Math.max(...here.map(t=>roster.find(t)?.size??1)),off=spread(here.length,size);let sx=1;
      here.forEach((t,k)=>{const s=roster.find(t)?.size??1,x=p?p.u*r.w/dpi+off[k].x:(sx+=s+1)-s-1+s/2,y=p?p.v*r.h/dpi+off[k].y:shelf+size/2;
        monsters.push({id:`a${a.no}-${pi+1}-${k+1}`.toLowerCase().replace(/[^a-z0-9-]/g,''),name:named??t,type:t,x:p?snap(x,s):x,y:p?snap(y,s):y,size:s});});
      if(!p)shelf+=size+1;});}
  const id=draft.dungeon.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'dungeon';
  $<HTMLTextAreaElement>('plan').value=JSON.stringify({version:1,id,name:draft.dungeon,monsters,reveals:[]},null,2);
  say(`Plan mit ${monsters.length} Monstern erzeugt.${missing.length?` Noch nicht markiert (liegen in der Ablage unter der Karte): Bereich ${missing.join(', ')}.`:''} Prüfen, dann aufbauen.`);
}
