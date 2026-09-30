// Dialog im Popover: Screenshot mit Statblock + Monsterbild zerlegen, Rahmen prüfen/neu ziehen, dann als Statblock und Token übernehmen.
import {bgColor,blocks,guess,clearBackground,type RGB} from './split';
import type {Box} from './token';
type Kind='stats'|'art';
const COL:Record<Kind,string>={stats:'#4da3ff',art:'#b8edb0'};
async function crop(src:ImageBitmap,b:Box,bg?:RGB):Promise<File>{
  const c=new OffscreenCanvas(b.w,b.h),g=c.getContext('2d')!;g.drawImage(src,b.x,b.y,b.w,b.h,0,0,b.w,b.h);
  if(bg){const im=g.getImageData(0,0,b.w,b.h);clearBackground(im.data,b.w,b.h,bg);g.putImageData(im,0,0);}
  return new File([await c.convertToBlob({type:'image/png'})],bg?'screenshot-token.png':'screenshot-stats.png',{type:'image/png'});
}
export async function openSplitter(file:File,name:string,apply:(stats:File|undefined,token:File|undefined)=>Promise<void>){
  const bmp=await createImageBitmap(file),full=new OffscreenCanvas(bmp.width,bmp.height),fg=full.getContext('2d')!;fg.drawImage(bmp,0,0);
  const data=fg.getImageData(0,0,bmp.width,bmp.height).data,bg=bgColor(data,bmp.width,bmp.height),box:Partial<Record<Kind,Box>>=guess(blocks(data,bmp.width,bmp.height,bg));
  const wrap=document.createElement('div');wrap.className='splitter';
  const scale=Math.min(1,(document.body.clientWidth-40)/bmp.width),cv=document.createElement('canvas');cv.width=Math.round(bmp.width*scale);cv.height=Math.round(bmp.height*scale);
  const g=cv.getContext('2d')!,draw=()=>{g.drawImage(bmp,0,0,cv.width,cv.height);for(const k of ['stats','art'] as Kind[]){const b=box[k];if(!b)continue;g.lineWidth=3;g.strokeStyle=COL[k];g.strokeRect(b.x*scale,b.y*scale,b.w*scale,b.h*scale);g.fillStyle=COL[k];g.font='bold 13px system-ui';g.fillText(k==='stats'?'Statblock':'Token',b.x*scale+4,b.y*scale+15);}};
  let mode:Kind|undefined,start:{x:number;y:number}|undefined;
  const hint=document.createElement('p');hint.className='hint';
  const btn=(t:string,cls='secondary')=>Object.assign(document.createElement('button'),{textContent:t,className:cls});
  const bs=btn('Statblock-Rahmen neu ziehen'),ba=btn('Token-Rahmen neu ziehen'),ok=btn('Übernehmen',''),no=btn('Abbrechen');ok.id='splitOk';
  const say=()=>{hint.textContent=mode?`Im Bild ziehen: ${mode==='stats'?'Statblock':'Token'}-Bereich.`:`Blau = Statblock, grün = Token. Stimmt ein Rahmen nicht, neu ziehen.${!box.art?' Kein Bild erkannt – Token-Rahmen ziehen.':''}`;};
  bs.onclick=()=>{mode='stats';say();};ba.onclick=()=>{mode='art';say();};no.onclick=()=>wrap.remove();
  const at=(e:MouseEvent)=>{const r=cv.getBoundingClientRect();return {x:Math.round((e.clientX-r.left)/scale),y:Math.round((e.clientY-r.top)/scale)};};
  cv.onmousedown=e=>{if(mode)start=at(e);};
  cv.onmousemove=e=>{if(!mode||!start)return;const p=at(e);box[mode]={x:Math.min(p.x,start.x),y:Math.min(p.y,start.y),w:Math.max(8,Math.abs(p.x-start.x)),h:Math.max(8,Math.abs(p.y-start.y))};draw();};
  cv.onmouseup=()=>{start=undefined;mode=undefined;say();};
  ok.onclick=async()=>{ok.disabled=true;try{await apply(box.stats&&await crop(bmp,box.stats),box.art&&await crop(bmp,box.art,bg));wrap.remove();}finally{ok.disabled=false;}};
  const row=document.createElement('div');row.className='row';row.append(bs,ba,ok,no);
  wrap.append(Object.assign(document.createElement('h2'),{textContent:`Screenshot zerlegen: ${name}`}),hint,cv,row);say();draw();
  document.body.append(wrap);wrap.scrollIntoView({block:'start'});
  return box;
}
