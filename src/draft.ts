import OBR from '@owlbear-rodeo/sdk';
import {parseAdventure,type Dungeon,type Found} from './adventure';
import {mapRect,spread,type MapLike} from './scene';
import * as roster from './roster';
// Entwurf je Szene: Bereiche aus dem Abenteuertext. Positionen kommen aus den Markierungs-Items auf der Karte
// (gesetzt mit dem Werkzeug in background.ts, verschieb- und löschbar mit Owlbear-Mitteln).
import {DRAFT,TOOL,MARK_NS,type Draft,type Mark} from './draft-keys';
// current: gerade markierter Bereich – nur lokal (pro GM), damit parallel arbeitende GMs sich nicht in die Quere kommen.
let dungeons:Dungeon[]=[],draft:Draft|undefined,say:(s:string)=>void=()=>{},counts=new Map<string,number>(),current:number|undefined;
type Marked={area:string;i:number;x:number;y:number};
async function marks():Promise<Marked[]>{return (await OBR.scene.items.getItems(i=>!!i.metadata[MARK_NS])).map(i=>{const m=i.metadata[MARK_NS] as Mark;return {area:m.area,i:m.i,x:i.position.x+(m.dx??0),y:i.position.y+(m.dy??0)};}).sort((a,b)=>a.i-b.i);}
async function recount(){const before=counts;counts=new Map();for(const m of await marks())counts.set(m.area,(counts.get(m.area)??0)+1);render();
  const c=current!==undefined?draft?.areas[current]:undefined;if(c&&(counts.get(c.no)??0)>(before.get(c.no)??0))say(`Bereich ${c.no} (${c.name}): ${counts.get(c.no)} Markierung(en). Weiter klicken, Markierung anklicken zum Entfernen, oder nächsten Bereich markieren.`);}
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
function h<T extends HTMLElement=HTMLElement>(tag:string,props:Record<string,unknown>={},...kids:(Node|string)[]):T{const e=Object.assign(document.createElement(tag),props) as T;e.append(...kids);return e;}
async function save(){render();await OBR.scene.setMetadata({[DRAFT]:draft});}
export async function load(status:(s:string)=>void){say=status;draft=(await OBR.scene.getMetadata())[DRAFT] as Draft|undefined;await recount();
  OBR.scene.onMetadataChange(m=>{draft=m[DRAFT] as Draft|undefined;render();});
  OBR.scene.items.onChange(items=>{const n=items.filter(i=>i.metadata[MARK_NS]).length,old=[...counts.values()].reduce((a,b)=>a+b,0);if(n!==old||n)void recount();});}
export function init(status:(s:string)=>void){say=status;
  $<HTMLInputElement>('advFile').onchange=async e=>{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;dungeons=parseAdventure(await f.text());
    const sel=$<HTMLSelectElement>('dungeon');sel.replaceChildren(new Option(`– ${dungeons.length} Dungeons gefunden –`,''),...dungeons.map((d,i)=>new Option(`${d.title} (${d.areas.length} Bereiche)`,String(i))));say(`${dungeons.length} Dungeons mit nummerierten Bereichen gefunden.`);};
  $<HTMLButtonElement>('takeDungeon').onclick=()=>{const d=dungeons[Number($<HTMLSelectElement>('dungeon').value)];if(!d)return say('Erst Abenteuertext laden und Dungeon wählen.');
    if(counts.size&&draft&&draft.dungeon!==d.title)return say(`Die Szene hat noch Markierungen für „${draft.dungeon}“. Erst dort „Punkte löschen“ oder die Markierungen in Owlbear entfernen.`);
    draft={dungeon:d.title,dmMap:draft?.dmMap,playerMap:draft?.playerMap,areas:d.areas.map(a=>({...a,monsters:a.monsters.map(m=>({...m}))}))};void save();say(`„${d.title}“ übernommen. Monster prüfen, dann in die Monsterliste übernehmen.`);};
  $<HTMLSelectElement>('dmSel').onchange=()=>{if(draft){draft.dmMap=$<HTMLSelectElement>('dmSel').value||undefined;void save();}};
  $<HTMLButtonElement>('toRoster').onclick=()=>{if(!draft)return;const n=[...new Set(draft.areas.flatMap(a=>a.monsters.map(m=>m.type)))].filter(roster.add).length;say(`${n} Monster in die Monsterliste übernommen. Jetzt Token/Statblock je Monster wählen.`);};
  $<HTMLButtonElement>('makePlan').onclick=()=>makePlan().catch(e=>say(e instanceof Error?e.message:String(e)));
  $<HTMLButtonElement>('savePlan').onclick=()=>{const t=$<HTMLTextAreaElement>('plan').value,a=h<HTMLAnchorElement>('a',{href:URL.createObjectURL(new Blob([t],{type:'application/json'})),download:`${JSON.parse(t).id??'plan'}.json`});a.click();URL.revokeObjectURL(a.href);};
}
// Markieren auf der Spielerkarte (für Spieler unsichtbar); die DM-Karte dient nur zum Nachschlagen der Raumnummern, Klicks dort gehen aber auch.
export async function mark(i:number){if(!draft)return;draft.playerMap=$<HTMLSelectElement>('mapSel').value||draft.playerMap;draft.dmMap=$<HTMLSelectElement>('dmSel').value||draft.dmMap;
  if(!draft.playerMap)return say('Erst in Schritt 1 die Spielerkarte wählen.');current=i;await save();
  await OBR.tool.setMetadata(TOOL,{area:draft.areas[i].no,name:draft.areas[i].name});await OBR.tool.activateTool(TOOL);
  const [pm]=await OBR.scene.items.getItems([draft.playerMap]);if(pm){const b=mapRect(pm as unknown as MapLike,await OBR.scene.grid.getDpi());await OBR.viewport.animateToBounds({min:{x:b.x,y:b.y},max:{x:b.x+b.w,y:b.y+b.h},width:b.w,height:b.h,center:{x:b.x+b.w/2,y:b.y+b.h/2}});}
  say(`Bereich ${draft.areas[i].no} (${draft.areas[i].name}): auf der Spielerkarte jede Stelle einmal anklicken (Raumnummern siehst du auf der DM-Karte). Klick auf eine Markierung entfernt sie; verschieben geht mit dem Bewegen-Werkzeug.`);}
export async function clearPoints(i:number){if(!draft)return;const a=draft.areas[i];
  await OBR.scene.items.deleteItems((await OBR.scene.items.getItems(x=>(x.metadata[MARK_NS] as Mark|undefined)?.area===a.no)).map(x=>x.id));}
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
      h('div',{className:'row'},add,mk,cl,h('span',{className:counts.get(a.no)?'ok':'warn'},` ${counts.get(a.no)??0} Markierung(en)`))));
  });
}
// Erzeugt einen normalen Plan (v1): Monster je Markierung. Markierungen auf der Spielerkarte gelten direkt; auf der DM-Karte werden sie
// über den Kartenanteil übertragen (gleiche Geometrie vorausgesetzt).
async function makePlan(){
  if(!draft)throw Error('Erst einen Dungeon übernehmen.');
  const player=$<HTMLSelectElement>('mapSel').value;if(!player)throw Error('Erst die Spielerkarte (Ursprungskarte) wählen.');
  const dpi=await OBR.scene.grid.getDpi(),[pm]=await OBR.scene.items.getItems([player]);if(!pm)throw Error('Spielerkarte nicht gefunden.');
  const r=mapRect(pm as unknown as MapLike,dpi),monsters:{id:string;name:string;type:string;x:number;y:number;size:number}[]=[],missing:string[]=[];
  // Bereiche ohne Punkt landen in einer Ablage unter der Spielerkarte (eine Zeile je Bereich), damit kein Monster aus dem Text fehlt.
  let shelf=r.h/dpi+2,off=0;
  const [dmItem]=draft.dmMap?await OBR.scene.items.getItems([draft.dmMap]):[],dr=dmItem?mapRect(dmItem as unknown as MapLike,dpi):undefined,inside=(b:{x:number;y:number;w:number;h:number},p:{x:number;y:number})=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;
  const pointsOf=new Map<string,{u:number;v:number}[]>();
  for(const m of await marks()){const p=inside(r,m)?{u:(m.x-r.x)/r.w,v:(m.y-r.y)/r.h}:dr&&inside(dr,m)?{u:(m.x-dr.x)/dr.w,v:(m.y-dr.y)/dr.h}:undefined;if(!p){off++;continue;}pointsOf.set(m.area,[...(pointsOf.get(m.area)??[]),p]);}
  for(const a of draft.areas){if(!a.monsters.length)continue;
    const named=a.names.length===1&&a.monsters.length===1&&a.monsters[0].count===1?a.names[0]:undefined;
    const got=pointsOf.get(a.no)??[],pts=got.length?got:[undefined];if(!got.length)missing.push(a.no);
    pts.forEach((p,pi)=>{const here=a.monsters.flatMap(m=>m.each||pi===0?Array.from({length:m.count},()=>m.type):[]);if(!here.length)return;
      const size=Math.max(...here.map(t=>roster.find(t)?.size??1)),off=spread(here.length,size);let sx=1;
      here.forEach((t,k)=>{const s=roster.find(t)?.size??1,x=p?p.u*r.w/dpi+off[k].x:(sx+=s+1)-s-1+s/2,y=p?p.v*r.h/dpi+off[k].y:shelf+size/2;
        monsters.push({id:`a${a.no}-${pi+1}-${k+1}`.toLowerCase().replace(/[^a-z0-9-]/g,''),name:named??t,type:t,x:+x.toFixed(2),y:+y.toFixed(2),size:s});});
      if(!p)shelf+=size+1;});}
  const id=draft.dungeon.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'dungeon';
  $<HTMLTextAreaElement>('plan').value=JSON.stringify({version:1,id,name:draft.dungeon,monsters,reveals:[]},null,2);
  say(`Plan mit ${monsters.length} Monstern erzeugt.${missing.length?` Noch nicht markiert (liegen in der Ablage unter der Karte): Bereich ${missing.join(', ')}.`:''}${off?` ${off} Markierung(en) liegen außerhalb beider Karten und wurden ignoriert.`:''} Prüfen, dann aufbauen.`);
}
