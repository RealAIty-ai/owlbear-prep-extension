import OBR,{buildShape,buildImage,buildText,buildImageUpload,buildSceneUpload} from '@owlbear-rodeo/sdk';
import type {Item} from '@owlbear-rodeo/sdk';
import {Plan,demo} from './plan';
import {BUBBLES,BUBBLES_NAME,bubbles,mapOrigin,type MapLike} from './scene';
import * as roster from './roster';
const NS='de.soenke.owlbear-prep/item';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const buttons=['upload','uploadAssets','linkAssets','build','undo'];
const input=el<HTMLTextAreaElement>('plan');input.value=JSON.stringify(demo,null,2);
let connected=false,busy=false;
const status=(s:string)=>{el('status').textContent=s;};
const parse=()=>Plan.parse(JSON.parse(input.value));
const tag=(planId:string,kind:string,sourceId:string)=>({[NS]:{planId,kind,sourceId}});
const owned=(i:Item,id:string)=>(i.metadata[NS] as {planId?:string}|undefined)?.planId===id;
function setButtons(){for(const id of buttons)el<HTMLButtonElement>(id).disabled=!connected||busy;}
async function guard(scene=true){if(!connected)throw Error('Bitte in Owlbear öffnen.');if(await OBR.player.getRole()!=='GM')throw Error('Nur als GM verfügbar.');if(scene&&!await OBR.scene.isReady())throw Error('Zuerst eine Testszene öffnen.');}
async function run(action:()=>Promise<void>){if(busy)return;busy=true;setButtons();try{await action();}catch(e){status(e instanceof Error?e.message:String(e));}finally{busy=false;setButtons();}}
function validate(){const p=parse();el('summary').textContent=`${p.name}: ${p.monsters.length} Gegner, ${p.reveals.length} Sichtblöcke. HP/RK aus der Monsterliste (sonst aus dem Plan); Bild-Tokens bekommen Stat Bubbles (für Spieler verborgen), Kreismarker eine verborgene Beschriftung.`;return p;}
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
  for(const m of p.monsters){const position={x:o.x+m.x*dpi,y:o.y+m.y*dpi},type=m.type??m.name,e=roster.find(type),hp=e?.hp??m.hp,ac=e?.ac??m.ac,asset=e?.token;
    if(!hp||ac===undefined)throw Error(`HP/RK fehlen für „${m.name}“ (Monsterliste „${type}“ oder Plan).`);
    if(e?.stats&&!placed.has(e.name)){placed.add(e.name);const w=e.stats.image.width;items.push(buildImage(e.stats.image,{dpi:w/6,offset:{x:0,y:0}}).position({x:position.x+(m.size/2+0.5)*dpi,y:position.y-m.size*dpi/2}).layer('PROP').name(`${e.name} Statblock`).visible(false).metadata(tag(p.id,'statblock',m.id)).build());}
    const token=asset?buildImage(asset.image,{dpi:asset.image.width/m.size,offset:{x:asset.image.width/2,y:asset.image.height/2}}).position(position).layer('CHARACTER').name(type).visible(false).metadata(tag(p.id,'monster',m.id)).build():buildShape().shapeType('CIRCLE').width(m.size*dpi).height(m.size*dpi).position(position).layer('CHARACTER').fillColor('#a9c4b3').fillOpacity(1).name(type).visible(false).metadata(tag(p.id,'monster',m.id)).build();
    const n=(count.get(type)??0)+1;count.set(type,n);token.metadata[NS]={planId:p.id,kind:'monster',sourceId:m.id,type,n,hp,maxHp:hp,ac};items.push(token);
    if(asset){token.metadata[BUBBLES]=bubbles(hp,ac);token.metadata[BUBBLES_NAME]=`${type} ${n}`;}else items.push(buildText().textType('PLAIN').plainText(`${type} ${n}\nHP ${hp} | RK ${ac}`).position({x:position.x,y:position.y+m.size*dpi/2+12}).fontSize(20).layer('TEXT').visible(false).attachedTo(token.id).disableAttachmentBehavior(['VISIBLE']).metadata(tag(p.id,'stats',m.id)).build());
  }
  for(const r of p.reveals)items.push(buildShape().shapeType('RECTANGLE').width(r.width*dpi).height(r.height*dpi).position({x:o.x+r.x*dpi,y:o.y+r.y*dpi}).layer('FOG').fillColor('#000000').fillOpacity(1).strokeWidth(0).name(r.name).locked(true).metadata(tag(p.id,'reveal',r.id)).build());
  await OBR.scene.items.addItems(items);status(`${items.length} Elemente angelegt. Gegner verborgen. Positionen und Spielersicht prüfen.`);await refresh();
});
el('undo').onclick=()=>run(async()=>{await guard();if(!el<HTMLInputElement>('confirm').checked)throw Error('Bitte Testszene bestätigen.');const p=parse();const ids=(await OBR.scene.items.getItems()).filter(i=>owned(i,p.id)).map(i=>i.id);if(ids.length)await OBR.scene.items.deleteItems(ids);status(`${ids.length} Elemente dieses Plans entfernt. Karte und fremde Elemente bleiben erhalten.`);await refresh();});
async function listMaps(){const sel=el<HTMLSelectElement>('mapSel'),keep=sel.value;const maps=(await OBR.scene.items.getItems(i=>i.layer==='MAP'&&i.type==='IMAGE')).sort((a,b)=>a.name.localeCompare(b.name));sel.replaceChildren(...(maps.length?maps:[{id:'',name:'Keine Karte gefunden'}]).map(m=>new Option(m.name,m.id)));if(maps.some(m=>m.id===keep))sel.value=keep;}
async function refresh(){const area=el('reveals');area.replaceChildren();if(!await OBR.scene.isReady())return;await listMaps();let id:string;try{id=parse().id;}catch{return;}for(const item of (await OBR.scene.items.getItems()).filter(i=>owned(i,id)&&(i.metadata[NS] as {kind:string}).kind==='reveal')){const b=document.createElement('button');b.textContent=`${item.visible?'Aufdecken':'Verdecken'}: ${item.name}`;b.onclick=()=>run(async()=>{await guard();await OBR.scene.items.updateItems([item.id],items=>{for(const i of items)i.visible=!i.visible;});await refresh();});area.append(b);}}
validate();roster.init(status);
// Nur Dev-Server: Browser-Automatisierung kann Dateifelder im fremden iframe nicht bedienen und reicht Testdateien per postMessage herein.
if(import.meta.env.DEV)addEventListener('message',e=>{const c=e.data?.prepTestClick;if(typeof c==='string'){if(c==='confirm')el<HTMLInputElement>('confirm').checked=true;else el(c)?.click();}});
if(import.meta.env.DEV)addEventListener('message',e=>{const t=e.data?.prepTestPlan;if(typeof t==='string'){input.value=t;try{validate();status('Plan gültig (Test).');}catch(x){status(String(x));}void refresh();}});
if(import.meta.env.DEV)addEventListener('message',async e=>{const d=e.data?.prepTestFile as {monster:string;kind:'token'|'stats';name:string;dataUrl:string}|undefined;if(!d)return;
  const b=await (await fetch(d.dataUrl)).blob();try{roster.choose(d.monster,d.kind,new File([b],d.name,{type:b.type}));}catch(x){status(String(x));}});
if(OBR.isAvailable)OBR.onReady(async()=>{connected=true;setButtons();status('Mit Owlbear verbunden.');await run(async()=>{await guard(false);await refresh();await roster.load(status);});OBR.scene.onReadyChange(async ready=>{el<HTMLInputElement>('confirm').checked=false;el('reveals').replaceChildren();if(ready)await refresh();});});
