import OBR,{buildShape,buildImage,buildText,buildImageUpload,buildSceneUpload} from '@owlbear-rodeo/sdk';
import type {Item} from '@owlbear-rodeo/sdk';
import {Plan} from './plan';
import {BUBBLES,bubbles,mapOrigin,type MapLike} from './scene';
import * as roster from './roster';
import * as draft from './draft';
const NS='de.soenke.owlbear-prep/item';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const buttons=['upload','uploadAssets','linkAssets','build','undo'];
const input=el<HTMLTextAreaElement>('plan');
let connected=false,busy=false;
const status=(s:string)=>{el('status').textContent=s;};
const parse=()=>{if(!input.value.trim())throw Error('Noch kein Plan – in Schritt 4 „Plan erzeugen“ klicken oder einen Plan einfügen.');return Plan.parse(JSON.parse(input.value));};
const tag=(planId:string,kind:string,sourceId:string)=>({[NS]:{planId,kind,sourceId}});
const owned=(i:Item,id:string)=>(i.metadata[NS] as {planId?:string}|undefined)?.planId===id;
function setButtons(){for(const id of buttons)el<HTMLButtonElement>(id).disabled=!connected||busy;}
async function guard(scene=true){if(!connected)throw Error('Bitte in Owlbear öffnen.');if(await OBR.player.getRole()!=='GM')throw Error('Nur als GM verfügbar.');if(scene&&!await OBR.scene.isReady())throw Error('Zuerst eine Testszene öffnen.');}
async function run(action:()=>Promise<void>){if(busy)return;busy=true;setButtons();try{await action();}catch(e){status(e instanceof Error?e.message:String(e));}finally{busy=false;setButtons();}}
function validate(){const p=parse();el('summary').textContent=`Plan „${p.name}“: ${p.monsters.length} Monster, ${p.reveals.length} Sichtblöcke. Bild-Tokens bekommen Stat Bubbles, Monster ohne Bild einen Kreismarker.`;return p;}
el('validate').onclick=()=>{try{validate();status('Plan gültig.');}catch(e){status(String(e));}};
const addName=()=>{const i=el<HTMLInputElement>('newName');if(roster.add(i.value))i.value='';else status('Name leer oder schon vorhanden.');};
el('add').onclick=addName;el<HTMLInputElement>('newName').onkeydown=e=>{if(e.key==='Enter')addName();};
el('fromPlan').onclick=()=>{try{const n=[...new Set(parse().monsters.map(m=>m.type??m.name))].filter(roster.add).length;status(`${n} Monster aus dem Plan übernommen.`);}catch(e){status(String(e));}};
el('uploadAssets').onclick=()=>run(async()=>{await guard(false);await roster.upload();});
el('linkAssets').onclick=()=>run(async()=>{await guard(false);await roster.link();});
el('upload').onclick=()=>run(async()=>{await guard(false);const file=el<HTMLInputElement>('map').files?.[0];if(!file)throw Error('Bitte eine Kartendatei wählen.');const copy=new File([await file.arrayBuffer()],file.name,{type:file.type});await OBR.assets.uploadScenes([buildSceneUpload().name(file.name).baseMap(buildImageUpload(copy).build()).build()]);status('Upload-Dialog beendet. Kartenszene in Owlbear öffnen, Raster kalibrieren, dann Plan aufbauen.');});
el('build').onclick=()=>run(async()=>{
  await guard();if(!el<HTMLInputElement>('confirm').checked)throw Error('Bitte Testszene bestätigen.');const p=validate();
  const scene=await OBR.scene.items.getItems();if(scene.some(i=>owned(i,p.id)))throw Error('Dieser Plan ist bereits vorhanden. Erst gezielt entfernen oder eine neue Plan-ID verwenden.');
  const mapId=el<HTMLSelectElement>('mapSel').value;if(!mapId)throw Error('Bitte zuerst die Ursprungskarte wählen.');const dpi=await OBR.scene.grid.getDpi();const [map]=await OBR.scene.items.getItems([mapId]);if(!map)throw Error('Ursprungskarte nicht mehr in der Szene. Bitte neu wählen.');const o=mapOrigin(map as unknown as MapLike,dpi);const items:Item[]=[];
  const placed=new Set<string>(),count=new Map<string,number>();
  // Nummern je Monstertyp fortsetzen, auch über frühere Pläne hinweg; Nummer steht nur im Stat-Bubbles-Namen.
  for(const i of scene){const x=i.metadata[NS] as {kind?:string;type?:string;n?:number}|undefined;if(x?.kind==='monster'&&x.type&&x.n)count.set(x.type,Math.max(count.get(x.type)??0,x.n));}
  // Tokenmitte am Szenenraster einrasten: gerade Größen auf Kreuzungen, sonst auf Feldmitten (Karte darf gegenüber dem Raster verschoben sein).
  const snap=(v:number,s:number)=>(Number.isInteger(s)&&s%2===0?Math.round(v/dpi):Math.floor(v/dpi)+0.5)*dpi;
  for(const m of p.monsters){const position={x:snap(o.x+m.x*dpi,m.size),y:snap(o.y+m.y*dpi,m.size)},type=m.type??m.name,e=roster.find(type),hp=e?.hp??m.hp,ac=e?.ac??m.ac,asset=e?.token;
    if(!hp||ac===undefined)throw Error(`HP/RK fehlen für „${m.name}“ (Monsterliste „${type}“ oder Plan).`);
    if(e?.stats&&!placed.has(e.name)){placed.add(e.name);const w=e.stats.image.width;items.push(buildImage(e.stats.image,{dpi:w/6,offset:{x:0,y:0}}).position({x:position.x+(m.size/2+0.5)*dpi,y:position.y-m.size*dpi/2}).layer('PROP').name(`${e.name} Statblock`).visible(false).metadata(tag(p.id,'statblock',m.id)).build());}
    // Laufende Nummer steht im Token-Label (Owlbear-Kontextmenü „Name“), der Item-Name bleibt der Monstertyp.
    const n=(count.get(type)??0)+1;count.set(type,n);const label=m.type&&m.name!==type?m.name:`${type} ${n}`;
    const token=asset?buildImage(asset.image,{dpi:asset.image.width/m.size,offset:{x:asset.image.width/2,y:asset.image.height/2}}).plainText(label).position(position).layer('CHARACTER').name(type).visible(false).metadata(tag(p.id,'monster',m.id)).build():buildShape().shapeType('CIRCLE').width(m.size*dpi).height(m.size*dpi).position(position).layer('CHARACTER').fillColor('#a9c4b3').fillOpacity(1).name(type).visible(false).metadata(tag(p.id,'monster',m.id)).build();
    token.metadata[NS]={planId:p.id,kind:'monster',sourceId:m.id,type,n,hp,maxHp:hp,ac};items.push(token);
    if(asset){token.metadata[BUBBLES]=bubbles(hp,ac);}else items.push(buildText().textType('PLAIN').plainText(`${label}\nHP ${hp} | RK ${ac}`).position({x:position.x,y:position.y+m.size*dpi/2+12}).fontSize(20).layer('TEXT').visible(false).attachedTo(token.id).disableAttachmentBehavior(['VISIBLE']).metadata(tag(p.id,'stats',m.id)).build());
  }
  for(const r of p.reveals)items.push(buildShape().shapeType('RECTANGLE').width(r.width*dpi).height(r.height*dpi).position({x:o.x+r.x*dpi,y:o.y+r.y*dpi}).layer('FOG').fillColor('#000000').fillOpacity(1).strokeWidth(0).name(r.name).locked(true).metadata(tag(p.id,'reveal',r.id)).build());
  await OBR.scene.items.addItems(items);status(`${items.length} Elemente angelegt. Gegner verborgen. Positionen und Spielersicht prüfen.`);await refresh();
});
el('undo').onclick=()=>run(async()=>{await guard();if(!el<HTMLInputElement>('confirm').checked)throw Error('Bitte Testszene bestätigen.');const p=parse();const ids=(await OBR.scene.items.getItems()).filter(i=>owned(i,p.id)).map(i=>i.id);if(ids.length)await OBR.scene.items.deleteItems(ids);status(`${ids.length} Elemente dieses Plans entfernt. Karte und fremde Elemente bleiben erhalten.`);await refresh();});
async function listMaps(){const maps=(await OBR.scene.items.getItems(i=>i.layer==='MAP'&&i.type==='IMAGE')).sort((a,b)=>a.name.localeCompare(b.name));
  // Vorschlag bei mehreren Karten: Name mit „player/spieler“ = Spielerkarte, mit „dm“ = DM-Karte; bestehende Auswahl bleibt.
  const fill=(id:string,empty:string,guess:RegExp)=>{const sel=el<HTMLSelectElement>(id),keep=sel.value;sel.replaceChildren(new Option(maps.length?empty:'Keine Karte gefunden',''),...maps.map(m=>new Option(m.name,m.id)));sel.value=maps.some(m=>m.id===keep)?keep:(maps.find(m=>guess.test(m.name))??(id==='mapSel'&&maps.length===1?maps[0]:undefined))?.id??'';};
  fill('mapSel','– Spielerkarte wählen –',/player|spieler/i);fill('dmSel','– DM-Karte wählen –',/(^|[^a-z])dm([^a-z]|$)|master|spielleiter/i);}
async function refresh(){const area=el('reveals');area.replaceChildren();if(!await OBR.scene.isReady())return;await listMaps();let id:string;try{id=parse().id;}catch{return;}for(const item of (await OBR.scene.items.getItems()).filter(i=>owned(i,id)&&(i.metadata[NS] as {kind:string}).kind==='reveal')){const b=document.createElement('button');b.textContent=`${item.visible?'Aufdecken':'Verdecken'}: ${item.name}`;b.onclick=()=>run(async()=>{await guard();await OBR.scene.items.updateItems([item.id],items=>{for(const i of items)i.visible=!i.visible;});await refresh();});area.append(b);}}
el('summary').textContent='Noch kein Plan erzeugt.';roster.init(status);draft.init(status);
// Dateiknöpfe: gewählten Dateinamen neben dem Knopf anzeigen.
document.querySelectorAll<HTMLInputElement>('label.file input[type=file]').forEach(i=>i.addEventListener('change',()=>{const n=i.parentElement?.querySelector('.fname');if(n)n.textContent=i.files?.[0]?.name??'keine Datei';}));
// Nur Dev-Server: Browser-Automatisierung kann Dateifelder im fremden iframe nicht bedienen und reicht Testdateien per postMessage herein.
if(import.meta.env.DEV)addEventListener('message',async e=>{const d=e.data?.prepTestInput as {id:string;url:string;name:string}|undefined,v=e.data?.prepTestValue as {id:string;value:string}|undefined;
  if(e.data?.prepTestDump&&e.source){const items=await OBR.scene.items.getItems(),own=items.filter(i=>i.metadata[NS]||Object.keys(i.metadata).some(k=>k.startsWith('de.soenke.owlbear-prep/')));
    (e.source as Window).postMessage({prepDump:{draft:(await OBR.scene.getMetadata())['de.soenke.owlbear-prep/draft'],dpi:await OBR.scene.grid.getDpi(),
      maps:items.filter(i=>i.layer==='MAP').map(i=>({id:i.id,name:i.name,visible:i.visible,position:i.position,scale:i.scale,rotation:i.rotation,grid:(i as {grid?:unknown}).grid,image:(i as unknown as {image?:{width:number;height:number}}).image})),
      own:own.map(i=>({name:i.name,layer:i.layer,visible:i.visible,label:(i as {text?:{plainText:string}}).text?.plainText,meta:i.metadata[NS]??i.metadata['de.soenke.owlbear-prep/mark']})),
      roster:(await OBR.room.getMetadata())['de.soenke.owlbear-prep/roster'],plan:input.value,status:el('status').textContent,marking:(await OBR.player.getMetadata())['de.soenke.owlbear-prep/marking'],activeTool:await OBR.tool.getActiveTool()}},'*');}
  if(typeof e.data?.prepTestMark==='number')await draft.mark(e.data.prepTestMark);
  if(typeof e.data?.prepTestClear==='number')await draft.clearPoints(e.data.prepTestClear);
  if(v){const x=el<HTMLSelectElement>(v.id);x.value=v.value;x.dispatchEvent(new Event('change'));}
  if(d){const b=await (await fetch(d.url)).blob(),dt=new DataTransfer();dt.items.add(new File([b],d.name,{type:b.type}));const x=el<HTMLInputElement>(d.id);x.files=dt.files;x.dispatchEvent(new Event('change'));}});
if(import.meta.env.DEV)addEventListener('message',e=>{const c=e.data?.prepTestClick;if(typeof c==='string'){if(c==='confirm')el<HTMLInputElement>('confirm').checked=true;else el(c)?.click();}});
if(import.meta.env.DEV)addEventListener('message',e=>{const t=e.data?.prepTestPlan;if(typeof t==='string'){input.value=t;try{validate();status('Plan gültig (Test).');}catch(x){status(String(x));}void refresh();}});
if(import.meta.env.DEV)addEventListener('message',async e=>{const d=e.data?.prepTestFile as {monster:string;kind:'token'|'stats';name:string;dataUrl:string}|undefined;if(!d)return;
  const b=await (await fetch(d.dataUrl)).blob();roster.choose(d.monster,d.kind,new File([b],d.name,{type:b.type})).catch(x=>status(String(x)));});
if(OBR.isAvailable)OBR.onReady(async()=>{connected=true;setButtons();status('Mit Owlbear verbunden.');await run(async()=>{await guard(false);await refresh();await roster.load(status);await draft.load(status);});OBR.scene.onReadyChange(async ready=>{el<HTMLInputElement>('confirm').checked=false;el('reveals').replaceChildren();if(ready)await refresh();});});
