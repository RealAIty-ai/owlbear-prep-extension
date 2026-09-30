import OBR,{buildImageUpload} from '@owlbear-rodeo/sdk';
import type {ImageContent,ImageGrid} from '@owlbear-rodeo/sdk';
import {parseStats} from './stats';
// Monsterliste pro Raum: Name, HP/RK, zugeordnete Owlbear-Bilder. Lokale Dateien nur bis zum Upload im Speicher.
export type Asset={image:ImageContent;grid:ImageGrid};
export type Monster={name:string;hp?:number;ac?:number;size?:number;token?:Asset;stats?:Asset};
const KEY='de.soenke.owlbear-prep/roster',PREFIX='Prep ';
let roster:Monster[]=[],online=false;
const pending=new Map<string,{token?:File;stats?:File}>();
const norm=(s:string)=>s.trim().toLowerCase();
const assetName=(m:string,kind:'Token'|'Stats')=>`${PREFIX}${m} ${kind}`;
export const find=(name:string)=>roster.find(m=>norm(m.name)===norm(name));
let say:(s:string)=>void=()=>{};
async function save(){render();if(online)await OBR.room.setMetadata({[KEY]:roster});}
export function add(name:string){name=name.trim();if(!name||find(name))return false;roster.push({name});void save();return true;}
function remove(m:Monster){roster=roster.filter(x=>x!==m);pending.delete(norm(m.name));void save();}
// Kleine Statblock-Schrift: 2× hochskaliert in Graustufen liest Tesseract Ziffern deutlich zuverlässiger (z. B. „AC 8“ statt „ACS“).
async function prep(file:File){const b=await createImageBitmap(file),c=document.createElement('canvas');c.width=b.width*2;c.height=b.height*2;const g=c.getContext('2d')!;g.imageSmoothingQuality='high';g.filter='grayscale(1) contrast(1.4)';g.drawImage(b,0,0,c.width,c.height);return c;}
let ocr:Promise<{recognize:(i:HTMLCanvasElement)=>Promise<{data:{text:string}}>}>|undefined;
async function read(m:Monster,file:File){
  say(`Lese HP/RK von ${m.name} … (beim ersten Mal werden die OCR-Daten geladen)`);
  ocr??=import('tesseract.js').then(t=>t.createWorker('eng'));
  const r=parseStats((await (await ocr).recognize(await prep(file))).data.text);
  if(r.hp)m.hp=r.hp;if(r.ac)m.ac=r.ac;if(r.size)m.size=r.size;await save();
  say(r.hp&&r.ac?`${m.name}: HP ${r.hp}, RK ${r.ac}${r.size?`, Größe ${r.size}`:''} erkannt – bitte prüfen.`:`${m.name}: ${r.hp?'':'HP '}${r.ac?'':'RK '}nicht erkannt – bitte eintragen.`);
}
export function choose(m:Monster|string,kind:'token'|'stats',file:File){
  const x=typeof m==='string'?find(m):m;if(!x)throw Error(`Monster „${m}“ nicht in der Liste.`);
  const e=pending.get(norm(x.name))??{};e[kind]=file;pending.set(norm(x.name),e);render();
  if(kind==='stats')read(x,file).catch(e=>say(`OCR fehlgeschlagen: ${e instanceof Error?e.message:e}. Werte bitte eintragen.`));
}
function field(label:string,node:HTMLElement){const l=document.createElement('label');l.append(label,' ',node);return l;}
function slot(m:Monster,kind:'token'|'stats',label:string){
  const f=document.createElement('input');f.type='file';f.accept='image/png,image/jpeg,image/webp';
  const p=pending.get(norm(m.name))?.[kind],s=document.createElement('span');
  s.className=m[kind]&&!p?'ok':'warn';s.textContent=p?` ${p.name} (noch nicht hochgeladen)`:m[kind]?' in Owlbear ✓':' fehlt';
  f.onchange=()=>{const file=f.files?.[0];if(file)choose(m,kind,file);};
  const l=field(label,f);l.append(s);return l;
}
function num(m:Monster,k:'hp'|'ac'|'size',label:string){const i=document.createElement('input');i.type='number';i.min=k==='hp'?'1':k==='size'?'0.5':'0';if(k==='size')i.step='0.5';i.value=m[k]?.toString()??'';
  i.onchange=()=>{const v=Number(i.value);m[k]=i.value&&(k==='size'||Number.isInteger(v))&&v>=Number(i.min)?v:undefined;void save();};return field(label,i);}
export function render(){
  const box=document.getElementById('roster')!;box.replaceChildren();
  for(const m of roster){const fs=document.createElement('fieldset'),lg=document.createElement('legend'),rm=document.createElement('button'),row=document.createElement('div');
    lg.textContent=m.name;row.className='row';rm.textContent='Entfernen';rm.onclick=()=>remove(m);
    row.append(num(m,'hp','HP'),num(m,'ac','RK'),num(m,'size','Felder'),rm);fs.append(lg,slot(m,'token','Token'),slot(m,'stats','Statblock'),row);box.append(fs);}
  if(!roster.length)box.textContent='Noch keine Monster.';
}
// Ein Upload-Dialog für alle ausstehenden Bilder, danach Zuordnung über den Asset-Namen „Prep <Monster> Token|Stats“.
export async function upload(){
  const ups=[];for(const m of roster){const p=pending.get(norm(m.name));if(p?.token)ups.push(buildImageUpload(p.token).name(assetName(m.name,'Token')).build());if(p?.stats)ups.push(buildImageUpload(p.stats).name(assetName(m.name,'Stats')).build());}
  if(!ups.length)throw Error('Keine ausstehenden Bilder. Erst Token/Statblock-Dateien wählen.');
  await OBR.assets.uploadImages(ups,'CHARACTER');await link();
}
export async function link(){
  const got=await OBR.assets.downloadImages(true,PREFIX.trim(),'CHARACTER');let n=0;
  for(const g of got)for(const m of roster)for(const kind of ['token','stats'] as const)if(norm(g.name)===norm(assetName(m.name,kind==='token'?'Token':'Stats'))){m[kind]={image:g.image,grid:g.grid};const p=pending.get(norm(m.name));if(p)delete p[kind];n++;}
  await save();const miss=roster.filter(m=>!m.token||!m.stats).map(m=>m.name);
  say(`${n} Bilder zugeordnet.${miss.length?` Noch ohne Token/Statblock: ${miss.join(', ')}.`:''}`);
}
export async function load(status:(s:string)=>void){say=status;online=true;const v=(await OBR.room.getMetadata())[KEY];if(Array.isArray(v))roster=v as Monster[];render();}
export function init(status:(s:string)=>void){say=status;render();}
