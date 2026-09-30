// Screenshot mit Statblock + Monsterbild zerlegen (reine Pixel-Logik, ohne Browser-APIs testbar).
import type {Box} from './token';
export type RGB=[number,number,number];
const px=(d:Uint8ClampedArray,w:number,x:number,y:number):RGB=>{const i=(y*w+x)*4;return [d[i],d[i+1],d[i+2]];};
const near=(a:RGB,b:RGB,tol:number)=>Math.abs(a[0]-b[0])<=tol&&Math.abs(a[1]-b[1])<=tol&&Math.abs(a[2]-b[2])<=tol;
// Hintergrund = häufigste (gerundete) Farbe am Bildrand.
export function bgColor(d:Uint8ClampedArray,w:number,h:number):RGB{
  const c=new Map<string,number>(),add=(x:number,y:number)=>{const p=px(d,w,x,y).map(v=>Math.min(255,Math.round(v/8)*8)).join();c.set(p,(c.get(p)??0)+1);};
  for(let x=0;x<w;x++){add(x,0);add(x,h-1);}for(let y=0;y<h;y++){add(0,y);add(w-1,y);}
  return [...c.entries()].sort((a,b)=>b[1]-a[1])[0][0].split(',').map(Number) as RGB;
}
// Läufe entlang einer Achse mit Inhalt (Anteil Nicht-Hintergrund > min), getrennt durch Lücken ≥ gap.
function runs(profile:number[],min:number,gap:number):[number,number][]{
  const out:[number,number][]=[];let s=-1,last=-1;
  profile.forEach((v,i)=>{if(v>min){if(s<0)s=i;else if(i-last>gap){out.push([s,last]);s=i;}last=i;}});
  if(s>=0)out.push([s,last]);return out;
}
export type Block=Box&{fill:number};
// Inhaltsblöcke: erst nach Spalten trennen (nebeneinander), sonst nach Zeilen (untereinander); Block auf seinen Inhalt zugeschnitten.
export function blocks(d:Uint8ClampedArray,w:number,h:number,bg:RGB,tol=24):Block[]{
  const fg=(x:number,y:number)=>!near(px(d,w,x,y),bg,tol);
  const trim=(x0:number,x1:number,y0:number,y1:number):Block=>{let a=x1,b=y1,c=x0,e=y0,n=0;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)if(fg(x,y)){n++;if(x<a)a=x;if(x>c)c=x;if(y<b)b=y;if(y>e)e=y;}
    const bw=Math.max(1,c-a+1),bh=Math.max(1,e-b+1);return {x:a,y:b,w:bw,h:bh,fill:n/(bw*bh)};};
  const col=Array.from({length:w},(_,x)=>{let n=0;for(let y=0;y<h;y++)if(fg(x,y))n++;return n/h;});
  const byCol=runs(col,0.01,Math.max(4,Math.round(w*0.01)));
  if(byCol.length>=2)return byCol.map(([a,b])=>trim(a,b,0,h-1)).filter(b=>b.w*b.h>w*h*0.02);
  const row=Array.from({length:h},(_,y)=>{let n=0;for(let x=0;x<w;x++)if(fg(x,y))n++;return n/w;});
  return runs(row,0.01,Math.max(4,Math.round(h*0.01))).map(([a,b])=>trim(0,w-1,a,b)).filter(b=>b.w*b.h>w*h*0.02);
}
// Statblock = am stärksten gefüllter Block (Pergament), Bild = größter übrige Block (Silhouette mit Freiraum).
export function guess(bl:Block[]):{stats?:Box;art?:Box}{
  if(!bl.length)return {};const stats=[...bl].sort((a,b)=>b.fill-a.fill)[0],rest=bl.filter(b=>b!==stats).sort((a,b)=>b.w*b.h-a.w*a.h);
  const strip=({x,y,w,h}:Box)=>({x,y,w,h});return {stats:strip(stats),art:rest[0]&&strip(rest[0])};
}
// Hintergrund vom Rand her transparent machen (Flood-Fill), damit helle Stellen im Motiv erhalten bleiben.
export function clearBackground(d:Uint8ClampedArray,w:number,h:number,bg:RGB,tol=28){
  const seen=new Uint8Array(w*h),stack:number[]=[];
  const push=(x:number,y:number)=>{const i=y*w+x;if(!seen[i]&&near(px(d,w,x,y),bg,tol)){seen[i]=1;stack.push(i);}};
  for(let x=0;x<w;x++){push(x,0);push(x,h-1);}for(let y=0;y<h;y++){push(0,y);push(w-1,y);}
  while(stack.length){const i=stack.pop()!,x=i%w,y=(i-x)/w;d[i*4+3]=0;if(x>0)push(x-1,y);if(x<w-1)push(x+1,y);if(y>0)push(x,y-1);if(y<h-1)push(x,y+1);}
}
