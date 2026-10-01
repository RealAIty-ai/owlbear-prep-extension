import OBR from '@owlbear-rodeo/sdk';
import {parseAdventure,type Dungeon,type Found} from './adventure';
import {cells,mapRect,spread,type MapLike} from './scene';
import * as roster from './roster';
// Entwurf je Szene: Bereiche aus dem Abenteuertext. Positionen kommen aus den Markierungs-Items auf der Karte
// (gesetzt mit dem Werkzeug in background.ts, verschieb- und löschbar mit Owlbear-Mitteln).
import {DRAFT,TOOL,MARK_NS,MARK_LABEL,MARKING,type Draft,type Mark} from './draft-keys';
// current: gerade markierter Bereich – nur lokal (pro GM), damit parallel arbeitende GMs sich nicht in die Quere kommen.
let dungeons:Dungeon[]=[],draft:Draft|undefined,say:(s:string)=>void=()=>{},counts=new Map<string,number>(),current:number|undefined;
type Marked={area:string;i:number;x:number;y:number};
async function marks():Promise<Marked[]>{return (await OBR.scene.items.getItems(i=>!!i.metadata[MARK_NS])).map(i=>{const m=i.metadata[MARK_NS] as Mark;return {area:m.area,i:m.i,x:i.position.x+(m.dx??0),y:i.position.y+(m.dy??0)};}).sort((a,b)=>a.i-b.i);}
async function recount(){const before=counts;counts=new Map();for(const m of await marks())counts.set(m.area,(counts.get(m.area)??0)+1);render();void recountBuilt();
  const c=current!==undefined?draft?.areas[current]:undefined;if(c&&(counts.get(c.no)??0)>(before.get(c.no)??0))say(`Bereich ${c.no} (${c.name}): ${counts.get(c.no)} Markierung(en). Weiter klicken; Alt+Klick auf eine Markierung löscht sie.`);}
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
function h<T extends HTMLElement=HTMLElement>(tag:string,props:Record<string,unknown>={},...kids:(Node|string)[]):T{const e=Object.assign(document.createElement(tag),props) as T;e.append(...kids);return e;}
async function save(){render();await OBR.scene.setMetadata({[DRAFT]:draft});}
export async function load(status:(s:string)=>void){say=status;draft=(await OBR.scene.getMetadata())[DRAFT] as Draft|undefined;await recount();
  OBR.scene.onMetadataChange(m=>{draft=m[DRAFT] as Draft|undefined;render();});
  OBR.scene.items.onChange(items=>{const n=items.filter(i=>i.metadata[MARK_NS]).length,old=[...counts.values()].reduce((a,b)=>a+b,0);if(n!==old||n)void recount();else void recountBuilt();});
  OBR.scene.grid.onChange(()=>void recountBuilt());}
export function init(status:(s:string)=>void){say=status;
  $<HTMLInputElement>('advFile').onchange=async e=>{const f=(e.target as HTMLInputElement).files?.[0];if(!f)return;dungeons=parseAdventure(await f.text());
    const sel=$<HTMLSelectElement>('dungeon');sel.replaceChildren(new Option(`– ${dungeons.length} Dungeons gefunden –`,''),...dungeons.map((d,i)=>new Option(`${d.title} (${d.areas.length} Bereiche)`,String(i))));say(`${dungeons.length} Dungeons mit nummerierten Bereichen gefunden.`);};
  $<HTMLButtonElement>('takeDungeon').onclick=()=>{const d=dungeons[Number($<HTMLSelectElement>('dungeon').value)];if(!d)return say('Erst Abenteuertext laden und Dungeon wählen.');
    if(counts.size&&draft&&draft.dungeon!==d.title)return say(`Die Szene hat noch Markierungen für „${draft.dungeon}“. Erst dort „Punkte löschen“ oder die Markierungen in Owlbear entfernen.`);
    draft={dungeon:d.title,dmMap:draft?.dmMap,playerMap:draft?.playerMap,areas:d.areas.map(a=>({...a,monsters:a.monsters.map(m=>({...m})),notes:a.notes.map(n=>({...n}))}))};void save();say(`„${d.title}“ übernommen. Monster prüfen, dann in die Monsterliste übernehmen.`);};
  $<HTMLSelectElement>('dmSel').onchange=()=>{if(draft){draft.dmMap=$<HTMLSelectElement>('dmSel').value||undefined;void save();}};
  $<HTMLButtonElement>('toRoster').onclick=()=>{if(!draft)return;const n=syncRoster();say(`${n} Monster in die Monsterliste übernommen. Jetzt Token/Statblock je Monster wählen.`);};
  $<HTMLButtonElement>('makePlan').onclick=()=>makePlan().catch(e=>say(e instanceof Error?e.message:String(e)));
  $<HTMLButtonElement>('savePlan').onclick=()=>{const t=$<HTMLTextAreaElement>('plan').value,a=h<HTMLAnchorElement>('a',{href:URL.createObjectURL(new Blob([t],{type:'application/json'})),download:`${JSON.parse(t).id??'plan'}.json`});a.click();URL.revokeObjectURL(a.href);};
}
// Markieren auf der Spielerkarte (für Spieler unsichtbar); die DM-Karte dient nur zum Nachschlagen der Raumnummern, Klicks dort gehen aber auch.
export async function mark(i:number){if(!draft)return;draft.playerMap=$<HTMLSelectElement>('mapSel').value||draft.playerMap;draft.dmMap=$<HTMLSelectElement>('dmSel').value||draft.dmMap;
  if(!draft.playerMap)return say('Erst in Schritt 1 die Spielerkarte wählen.');current=i;await save();
  await OBR.player.setMetadata({[MARKING]:{area:draft.areas[i].no}});await OBR.tool.activateTool(TOOL);
  const [pm]=await OBR.scene.items.getItems([draft.playerMap]);if(pm){const b=mapRect(pm as unknown as MapLike,await OBR.scene.grid.getDpi());await OBR.viewport.animateToBounds({min:{x:b.x,y:b.y},max:{x:b.x+b.w,y:b.y+b.h},width:b.w,height:b.h,center:{x:b.x+b.w/2,y:b.y+b.h/2}});}
  say(`Bereich ${draft.areas[i].no} (${draft.areas[i].name}): auf der Spielerkarte jede Stelle einmal anklicken (Raumnummern siehst du auf der DM-Karte). Alt+Klick auf eine Markierung löscht sie; verschieben geht mit dem Bewegen-Werkzeug.`);}
export async function clearPoints(i:number){if(!draft)return;const a=draft.areas[i];
  const roots=(await OBR.scene.items.getItems(x=>(x.metadata[MARK_NS] as Mark|undefined)?.area===a.no)).map(x=>x.id);
  await OBR.scene.items.deleteItems((await OBR.scene.items.getItems(x=>roots.includes(x.id)||(!!x.metadata[MARK_LABEL]&&roots.includes(x.attachedTo??'')))).map(x=>x.id));}
// Checkliste oben im Popover: zeigt erledigte Schritte und hebt den nächsten hervor.
// Zustand für Schrittleiste und Zusammenfassung (Schritt 5). built = Anzahl Elemente des aktuellen Plans in der Szene.
let built=0,scaleText='';
export const planId=()=>draft?draft.dungeon.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'dungeon':'';
async function recountBuilt(){const id=planId();built=id?(await OBR.scene.items.getItems(i=>(i.metadata['de.soenke.owlbear-prep/item'] as {planId?:string}|undefined)?.planId===id)).length:0;
  const sc=await OBR.scene.grid.getScale();scaleText=`${sc.parsed.multiplier} ${sc.parsed.unit} je Feld`;progress();}
// Monster aus dem Entwurf in die Monsterliste übernehmen (beim Betreten von Schritt 4 automatisch).
export function syncRoster(){if(!draft)return 0;return [...new Set(draft.areas.flatMap(a=>a.monsters.map(m=>m.type)))].filter(roster.add).length;}
export function progress(){
  const types=[...new Set(draft?.areas.flatMap(a=>a.monsters.map(m=>m.type))??[])],r=(t:string)=>roster.find(t);
  const unmarked=draft?.areas.filter(a=>a.monsters.length&&!counts.get(a.no)).map(a=>a.no)??[];
  const noVal=types.filter(t=>!r(t)?.hp||r(t)?.ac===undefined),noTok=types.filter(t=>!r(t)?.token),noStat=types.filter(t=>!r(t)?.stats&&!r(t)?.noStats);
  const map=$<HTMLSelectElement>('mapSel'),mapName=map.selectedOptions[0]?.value?map.selectedOptions[0].text:'';
  const done=[!!mapName,!!draft,!!draft&&!unmarked.length,!!draft&&types.length>0&&!noVal.length&&!noTok.length,built>0];
  (window as {prepSteps?:(d:boolean[])=>void}).prepSteps?.(done);
  $('dungeonName').textContent=draft?.dungeon??'kein Dungeon';$('scaleInfo').textContent=scaleText?`Raster der Szene: ${scaleText}. Steht auf der Karte z. B. „ONE SQUARE = 10 FEET“, die Rasterskala in Owlbear passend einstellen.`:'';
  const monsters=draft?.areas.reduce((n,a)=>n+a.monsters.reduce((k,m)=>k+m.count*(m.each?Math.max(1,counts.get(a.no)??0):1),0),0)??0,notes=draft?.areas.reduce((n,a)=>n+(a.notes?.filter(x=>x.text).length??0),0)??0;
  const li=(cls:string,t:string)=>h('li',{className:cls},t);
  const rv=$('review');rv.replaceChildren(
    li(mapName?'ok':'bad',mapName?`✓ Spielerkarte: ${mapName}`:'✗ Keine Spielerkarte gewählt (Schritt 1)'),
    ...(scaleText?[li('',`Raster: ${scaleText}`)]:[]),
    li(draft?'ok':'bad',draft?`✓ ${draft.dungeon}: ${monsters} Monster, ${notes} Notiz${notes===1?'':'en'}`:'✗ Kein Dungeon übernommen (Schritt 2)'),
    ...(unmarked.length?[li('warn',`⚠ Nicht markiert: Raum ${unmarked.join(', ')} – diese Monster landen in einer Ablage unter der Karte`)]:draft?[li('ok','✓ Alle Räume mit Monstern markiert')]:[]),
    ...(noVal.length?[li('bad',`✗ Ohne HP/RK: ${noVal.join(', ')} – Aufbau nicht möglich (Schritt 4)`)]:[]),
    ...(noTok.length?[li('warn',`⚠ Ohne Tokenbild (wird Kreis): ${noTok.join(', ')}`)]:[]),
    ...(noStat.length?[li('warn',`⚠ Ohne Statblock-Bild: ${noStat.join(', ')}`)]:[]),
    ...(built?[li('',`Bestehender Aufbau: ${built} Elemente – wird ersetzt`)]:[]));
  $<HTMLButtonElement>('build').textContent=built?'Neu aufbauen':'Aufbauen';
}
export function render(){
  progress();
  const box=$('areas');box.replaceChildren();if(!draft){box.append(h('p',{className:'hint'},'Noch kein Dungeon übernommen (Schritt 2).'));return;}
  if(draft.dmMap)$<HTMLSelectElement>('dmSel').value=draft.dmMap;
  draft.areas.forEach((a,i)=>{
    const rows=a.monsters.map((m,k)=>{const t=h<HTMLInputElement>('input',{value:m.type,maxLength:80,style:'flex:1;min-width:110px;width:auto'}),c=h<HTMLInputElement>('input',{type:'number',min:'1',value:String(m.count)}),e=h<HTMLInputElement>('input',{type:'checkbox',checked:m.each}),x=h('button',{textContent:'×',title:'Monster entfernen',className:'secondary small'});
      t.onchange=()=>{m.type=t.value.trim()||m.type;void save();};c.onchange=()=>{m.count=Math.max(1,Math.floor(Number(c.value))||1);void save();};e.onchange=()=>{m.each=e.checked;void save();};x.onclick=()=>{a.monsters.splice(k,1);void save();};
      return h('div',{className:'row'},c,'×',t,h('label',{style:'margin:0'},e,' je Punkt'),x);});
    const add=h('button',{textContent:'+ Monster',className:'secondary small'});add.onclick=()=>{a.monsters.push({type:'Monster',count:1,each:false});void save();};
    const cl=h('button',{textContent:'Punkte löschen',className:'secondary small'});cl.onclick=()=>void clearPoints(i);
    const n=counts.get(a.no)??0,has=a.monsters.length>0,dot=current===i?'now':!has?'':n?'ok':'warn';
    const who=has?a.monsters.map(m=>`${m.count}${m.each?' je Punkt':''}× ${m.type}`).join(', '):'keine Monster';
    const extra=[...(a.notes??[]).filter(x=>x.text).map(x=>x.kind==='Schatz'?'💰':'⚠️'),...(a.names.length?[`„${a.names.join(', ')}“`]:[])].join(' ');
    const mk=h('button',{textContent:current===i?'markiert …':'Markieren',className:has?'small':'secondary small'});mk.onclick=e=>{e.preventDefault();void mark(i);};
    box.append(h('details',{className:'item'},
      h('summary',{},h('span',{className:`dot ${dot}`}),h('span',{className:'name'},`${a.no} · ${a.name}`,h('small',{},`${who} · ${n} Punkt${n===1?'':'e'} ${extra}`)),mk),
      h('div',{className:'body'},...rows,...(a.notes??[]).map(x=>{const t=h<HTMLTextAreaElement>('textarea',{value:x.text,rows:4});t.onchange=()=>{x.text=t.value.trim();void save();};return h('details',{},h('summary',{},`${x.kind==='Schatz'?'💰 Schatz':'⚠️ Falle'} – verborgene Notiz`),t);}),
        h('div',{className:'row'},add,cl))));
  });
}
// Erzeugt einen normalen Plan (v1): Monster je Markierung. Markierungen auf der Spielerkarte gelten direkt; auf der DM-Karte werden sie
// über den Kartenanteil übertragen (gleiche Geometrie vorausgesetzt).
export const has=()=>!!draft;
export async function makePlan(){
  if(!draft)throw Error('Erst einen Dungeon übernehmen.');
  const player=$<HTMLSelectElement>('mapSel').value;if(!player)throw Error('Erst die Spielerkarte (Ursprungskarte) wählen.');
  const dpi=await OBR.scene.grid.getDpi(),scale=await OBR.scene.grid.getScale(),[pm]=await OBR.scene.items.getItems([player]);if(!pm)throw Error('Spielerkarte nicht gefunden.');
  const r=mapRect(pm as unknown as MapLike,dpi),monsters:{id:string;name:string;type:string;x:number;y:number;size:number}[]=[],notes:{id:string;name:string;kind:'Schatz'|'Falle';x:number;y:number;text:string}[]=[],missing:string[]=[];
  // Bereiche ohne Punkt landen in einer Ablage unter der Spielerkarte (eine Zeile je Bereich), damit kein Monster aus dem Text fehlt.
  let shelf=r.h/dpi+2,off=0;
  const others=(await OBR.scene.items.getItems(i=>i.layer==='MAP'&&i.type==='IMAGE'&&i.id!==player)).map(i=>mapRect(i as unknown as MapLike,dpi)),inside=(b:{x:number;y:number;w:number;h:number},p:{x:number;y:number})=>p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h;
  const pointsOf=new Map<string,{u:number;v:number}[]>();
  for(const m of await marks()){const dr=inside(r,m)?r:others.find(b=>inside(b,m)),p=dr?{u:(m.x-dr.x)/dr.w,v:(m.y-dr.y)/dr.h}:undefined;if(!p){off++;continue;}pointsOf.set(m.area,[...(pointsOf.get(m.area)??[]),p]);}
  for(const a of draft.areas){if(!a.monsters.length)continue;
    const named=a.names.length===1&&a.monsters.length===1&&a.monsters[0].count===1?a.names[0]:undefined;
    const got=pointsOf.get(a.no)??[],pts=got.length?got:[undefined];if(!got.length)missing.push(a.no);
    pts.forEach((p,pi)=>{const here=a.monsters.flatMap(m=>m.each||pi===0?Array.from({length:m.count},()=>m.type):[]);if(!here.length)return;
      // Größe aus dem Statblock (5-ft-Felder) in Rasterfelder dieser Szene umrechnen (z. B. 10 ft je Feld).
      const sz=(t:string)=>cells(roster.find(t)?.size??1,scale.parsed),size=Math.max(...here.map(sz)),off=spread(here.length,size);let sx=1;
      here.forEach((t,k)=>{const s=sz(t),x=p?p.u*r.w/dpi+off[k].x:(sx+=s+1)-s-1+s/2,y=p?p.v*r.h/dpi+off[k].y:shelf+size/2;
        monsters.push({id:`a${a.no}-${pi+1}-${k+1}`.toLowerCase().replace(/[^a-z0-9-]/g,''),name:named??t,type:t,x:+x.toFixed(2),y:+y.toFixed(2),size:s});});
      if(!p)shelf+=size+1;});}
  // Notizen: neben der ersten Markierung des Bereichs (untereinander), sonst in einer Ablage unter der Karte (rechte Hälfte).
  let noteShelf=r.h/dpi+2;
  for(const a of draft.areas)(a.notes??[]).filter(n=>n.text).forEach((n,k)=>{const p=pointsOf.get(a.no)?.[0];
    notes.push({id:`n${a.no}-${k+1}`.toLowerCase().replace(/[^a-z0-9-]/g,''),name:`${n.kind} – Bereich ${a.no} ${a.name}`.slice(0,120),kind:n.kind,x:+(p?p.u*r.w/dpi+1:r.w/dpi/2).toFixed(2),y:+(p?p.v*r.h/dpi-0.5+k*4:noteShelf).toFixed(2),text:n.text.slice(0,4000)});if(!p)noteShelf+=5;});
  const id=draft.dungeon.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,50)||'dungeon';
  $<HTMLTextAreaElement>('plan').value=JSON.stringify({version:1,id,name:draft.dungeon,monsters,notes,reveals:[]},null,2);progress();
  say(`Plan mit ${monsters.length} Monstern und ${notes.length} Notizen erzeugt.${missing.length?` Noch nicht markiert (liegen in der Ablage unter der Karte): Bereich ${missing.join(', ')}.`:''}${off?` ${off} Markierung(en) liegen außerhalb beider Karten und wurden ignoriert.`:''} Prüfen, dann aufbauen.`);
}
