// Tokenbild aufbereiten: transparenten Rand abschneiden, quadratisch zuschneiden, optional rund maskieren.
export type Box={x:number;y:number;w:number;h:number};
// Kleinstes Rechteck mit Deckkraft > threshold (RGBA-Daten); ganz transparent → ganzes Bild.
export function contentBox(rgba:Uint8ClampedArray,w:number,h:number,threshold=16):Box{
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rgba[(y*w+x)*4+3]>threshold){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  return x1<0?{x:0,y:0,w,h}:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
}
// Quadrat um die Motivmitte: Kantenlänge = kürzere Seite des Motivs, damit das Motiv das Token füllt; bleibt im Bild.
export function squareBox(b:Box,w:number,h:number):Box{
  const s=Math.min(b.w,b.h),cx=b.x+b.w/2,cy=b.y+b.h/2;
  return {x:Math.round(Math.min(Math.max(cx-s/2,0),w-s)),y:Math.round(Math.min(Math.max(cy-s/2,0),h-s)),w:s,h:s};
}
export type Shape='round'|'square';
// Nur im Browser: liefert ein 512×512-PNG.
export async function makeToken(file:File,shape:Shape,size=512):Promise<File>{
  const bmp=await createImageBitmap(file),src=new OffscreenCanvas(bmp.width,bmp.height),g=src.getContext('2d')!;g.drawImage(bmp,0,0);
  const sq=squareBox(contentBox(g.getImageData(0,0,bmp.width,bmp.height).data,bmp.width,bmp.height),bmp.width,bmp.height);
  const out=new OffscreenCanvas(size,size),o=out.getContext('2d')!;
  if(shape==='round'){o.beginPath();o.arc(size/2,size/2,size/2-6,0,Math.PI*2);o.closePath();o.save();o.clip();}
  o.drawImage(bmp,sq.x,sq.y,sq.w,sq.h,0,0,size,size);
  if(shape==='round'){o.restore();o.lineWidth=10;o.strokeStyle='#1d2327';o.beginPath();o.arc(size/2,size/2,size/2-6,0,Math.PI*2);o.stroke();}
  const blob=await out.convertToBlob({type:'image/png'});
  return new File([blob],file.name.replace(/\.[^.]+$/,'').replace(/-token$/i,'')+'-token.png',{type:'image/png'});
}
