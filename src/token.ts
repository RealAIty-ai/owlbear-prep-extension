// Tokenbild aufbereiten: transparenten Rand abschneiden, quadratisch zuschneiden, optional rund maskieren.
export type Box={x:number;y:number;w:number;h:number};
// Kleinstes Rechteck mit Deckkraft > threshold (RGBA-Daten); ganz transparent → ganzes Bild.
export function contentBox(rgba:Uint8ClampedArray,w:number,h:number,threshold=16):Box{
  let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rgba[(y*w+x)*4+3]>threshold){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  return x1<0?{x:0,y:0,w,h}:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
}
// Quadrat um die Motivmitte. fill: kürzere Seite (Motiv füllt das Token, bleibt im Bild) – für rechteckige Artworks.
// fit: längere Seite (ganzes Motiv passt hinein, Rand bleibt transparent) – für freigestellte Figuren, damit z. B. der Kopf nicht abgeschnitten wird.
export function squareBox(b:Box,w:number,h:number,mode:'fill'|'fit'='fill'):Box{
  const cx=b.x+b.w/2,cy=b.y+b.h/2;
  if(mode==='fit'){const s=Math.max(b.w,b.h);return {x:Math.round(cx-s/2),y:Math.round(cy-s/2),w:s,h:s};}
  const s=Math.min(b.w,b.h);return {x:Math.round(Math.min(Math.max(cx-s/2,0),w-s)),y:Math.round(Math.min(Math.max(cy-s/2,0),h-s)),w:s,h:s};
}
// Anteil (fast) transparenter Pixel: > 5 % gilt als freigestellte Figur.
export function transparentShare(rgba:Uint8ClampedArray){let n=0;for(let i=3;i<rgba.length;i+=4)if(rgba[i]<16)n++;return n/(rgba.length/4);}
export type Shape='round'|'square';
// Nur im Browser: liefert ein 512×512-PNG.
export async function makeToken(file:File,shape:Shape,size=512):Promise<File>{
  const bmp=await createImageBitmap(file),src=new OffscreenCanvas(bmp.width,bmp.height),g=src.getContext('2d')!;g.drawImage(bmp,0,0);
  const data=g.getImageData(0,0,bmp.width,bmp.height).data,cb=contentBox(data,bmp.width,bmp.height),cut=transparentShare(data)>0.05;
  const sq=squareBox(cb,bmp.width,bmp.height,cut?'fit':'fill');
  const out=new OffscreenCanvas(size,size),o=out.getContext('2d')!;
  if(shape==='round'){o.beginPath();o.arc(size/2,size/2,size/2-6,0,Math.PI*2);o.closePath();o.save();o.clip();}
  o.drawImage(bmp,sq.x,sq.y,sq.w,sq.h,0,0,size,size);
  if(shape==='round'){o.restore();o.lineWidth=10;o.strokeStyle='#1d2327';o.beginPath();o.arc(size/2,size/2,size/2-6,0,Math.PI*2);o.stroke();}
  const blob=await out.convertToBlob({type:'image/png'});
  return new File([blob],file.name.replace(/\.[^.]+$/,'').replace(/-token$/i,'')+'-token.png',{type:'image/png'});
}
