import OBR,{buildShape,buildImage,buildText,buildImageUpload,buildSceneUpload} from '@owlbear-rodeo/sdk';
import type {ImageDownload} from '@owlbear-rodeo/sdk/lib/types/Assets';
import type {Item} from '@owlbear-rodeo/sdk';
import {Plan,demo} from './plan';
const NS='de.soenke.owlbear-prep/item';
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const buttons=['upload','asset','build','undo'];
const input=el<HTMLTextAreaElement>('plan');input.value=JSON.stringify(demo,null,2);
let connected=false,busy=false,asset:ImageDownload|undefined;
const status=(s:string)=>{el('status').textContent=s;};
const parse=()=>Plan.parse(JSON.parse(input.value));
const tag=(planId:string,kind:string,sourceId:string)=>({[NS]:{planId,kind,sourceId}});
const owned=(i:Item,id:string)=>(i.metadata[NS] as {planId?:string}|undefined)?.planId===id;
function setButtons(){for(const id of buttons)el<HTMLButtonElement>(id).disabled=!connected||busy;}
async function guard(scene=true){if(!connected)throw Error('Bitte in Owlbear öffnen.');if(await OBR.player.getRole()!=='GM')throw Error('Nur als GM verfügbar.');if(scene&&!await OBR.scene.isReady())throw Error('Zuerst eine Testszene öffnen.');}
async function run(action:()=>Promise<void>){if(busy)return;busy=true;setButtons();try{await action();}catch(e){status(e instanceof Error?e.message:String(e));}finally{busy=false;setButtons();}}
function validate(){const p=parse();el('summary').textContent=`${p.name}: ${p.monsters.length} Gegner, ${p.reveals.length} Sichtblöcke. HP/RK in eigenen Metadaten und verborgenen Beschriftungen; keine Stat-Bubbles-Anbindung.`;return p;}
el('validate').onclick=()=>{try{validate();status('Plan gültig.');}catch(e){status(String(e));}};
el('asset').onclick=()=>run(async()=>{await guard(false);const selected=await OBR.assets.downloadImages(false,undefined,'CHARACTER');if(selected[0]){asset=selected[0];el('assetName').textContent=asset.name;}});
el('upload').onclick=()=>run(async()=>{await guard(false);const file=el<HTMLInputElement>('map').files?.[0];if(!file)throw Error('Bitte eine Kartendatei wählen.');const copy=new File([await file.arrayBuffer()],file.name,{type:file.type});await OBR.assets.uploadScenes([buildSceneUpload().name(file.name).baseMap(buildImageUpload(copy).build()).build()]);status('Upload-Dialog beendet. Kartenszene in Owlbear öffnen, Raster kalibrieren, dann Plan aufbauen.');});
el('build').onclick=()=>run(async()=>{
  await guard();if(!el<HTMLInputElement>('confirm').checked)throw Error('Bitte Testszene bestätigen.');const p=validate();
  if((await OBR.scene.items.getItems()).some(i=>owned(i,p.id)))throw Error('Dieser Plan ist bereits vorhanden. Erst gezielt entfernen oder eine neue Plan-ID verwenden.');
  const dpi=await OBR.scene.grid.getDpi();const items:Item[]=[];
  for(const m of p.monsters){const position={x:m.x*dpi,y:m.y*dpi};
    const token=asset?buildImage(asset.image,{dpi:asset.image.width/m.size,offset:{x:asset.image.width/2,y:asset.image.height/2}}).position(position).layer('CHARACTER').name(m.name).visible(false).metadata(tag(p.id,'monster',m.id)).build():buildShape().shapeType('CIRCLE').width(m.size*dpi).height(m.size*dpi).position(position).layer('CHARACTER').fillColor('#a9c4b3').fillOpacity(1).name(m.name).visible(false).metadata(tag(p.id,'monster',m.id)).build();
    token.metadata[NS]={planId:p.id,kind:'monster',sourceId:m.id,hp:m.hp,maxHp:m.hp,ac:m.ac};items.push(token);
    items.push(buildText().plainText(`${m.name}\nHP ${m.hp} | RK ${m.ac}`).position({x:position.x,y:position.y+m.size*dpi/2+12}).fontSize(20).layer('TEXT').visible(false).attachedTo(token.id).disableAttachmentBehavior(['VISIBLE']).metadata(tag(p.id,'stats',m.id)).build());
  }
  for(const r of p.reveals)items.push(buildShape().shapeType('RECTANGLE').width(r.width*dpi).height(r.height*dpi).position({x:r.x*dpi,y:r.y*dpi}).layer('FOG').fillColor('#000000').fillOpacity(1).strokeWidth(0).name(r.name).locked(true).metadata(tag(p.id,'reveal',r.id)).build());
  await OBR.scene.items.addItems(items);status(`${items.length} Elemente angelegt. Gegner verborgen. Positionen und Spielersicht prüfen.`);await refresh();
});
el('undo').onclick=()=>run(async()=>{await guard();if(!el<HTMLInputElement>('confirm').checked)throw Error('Bitte Testszene bestätigen.');const p=parse();const ids=(await OBR.scene.items.getItems()).filter(i=>owned(i,p.id)).map(i=>i.id);if(ids.length)await OBR.scene.items.deleteItems(ids);status(`${ids.length} Elemente dieses Plans entfernt. Karte und fremde Elemente bleiben erhalten.`);await refresh();});
async function refresh(){const area=el('reveals');area.replaceChildren();if(!await OBR.scene.isReady())return;let id:string;try{id=parse().id;}catch{return;}for(const item of (await OBR.scene.items.getItems()).filter(i=>owned(i,id)&&(i.metadata[NS] as {kind:string}).kind==='reveal')){const b=document.createElement('button');b.textContent=`${item.visible?'Aufdecken':'Verdecken'}: ${item.name}`;b.onclick=()=>run(async()=>{await guard();await OBR.scene.items.updateItems([item.id],items=>{for(const i of items)i.visible=!i.visible;});await refresh();});area.append(b);}}
validate();
if(OBR.isAvailable)OBR.onReady(async()=>{connected=true;setButtons();status('Mit Owlbear verbunden.');await run(async()=>{await guard(false);await refresh();});OBR.scene.onReadyChange(()=>{el<HTMLInputElement>('confirm').checked=false;el('reveals').replaceChildren();});});
