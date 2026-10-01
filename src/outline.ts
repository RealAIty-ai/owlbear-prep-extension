// Raumumrisse: reine Geometrie (ohne Owlbear testbar). Punkte in Szenenkoordinaten.
export type P={x:number;y:number};
// Rechteck aus zwei Ecken (beliebige Zugrichtung), im Uhrzeigersinn ab oben links.
export function rectPoints(a:P,b:P):P[]{const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y);return [{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}];}
// Doppelte und auf einer Geraden liegende Punkte entfernen (geschlossenes Polygon); weniger Punkte = sauberere Kanten, weniger Last.
export function simplify(pts:P[],eps=0.5):P[]{
  const q:P[]=[];for(const p of pts)if(!q.length||Math.hypot(p.x-q[q.length-1].x,p.y-q[q.length-1].y)>eps)q.push(p);
  if(q.length>1&&Math.hypot(q[0].x-q[q.length-1].x,q[0].y-q[q.length-1].y)<=eps)q.pop();
  let changed=true;while(changed&&q.length>3){changed=false;for(let i=0;i<q.length;i++){const a=q[(i+q.length-1)%q.length],b=q[i],c=q[(i+1)%q.length];
    if(Math.abs((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x))<=eps*Math.hypot(c.x-a.x,c.y-a.y)){q.splice(i,1);changed=true;break;}}}
  return q;
}
export const area=(pts:P[])=>Math.abs(pts.reduce((s,p,i)=>{const n=pts[(i+1)%pts.length];return s+p.x*n.y-n.x*p.y;},0))/2;
// Schwerpunkt der Fläche (für Beschriftung und als Monster-Standort, wenn der Raum keine Markierung hat).
export function centroid(pts:P[]):P{
  const a=pts.reduce((s,p,i)=>{const n=pts[(i+1)%pts.length];return s+p.x*n.y-n.x*p.y;},0)/2;
  if(Math.abs(a)<1e-9)return {x:pts.reduce((s,p)=>s+p.x,0)/pts.length,y:pts.reduce((s,p)=>s+p.y,0)/pts.length};
  let cx=0,cy=0;pts.forEach((p,i)=>{const n=pts[(i+1)%pts.length],f=p.x*n.y-n.x*p.y;cx+=(p.x+n.x)*f;cy+=(p.y+n.y)*f;});return {x:cx/(6*a),y:cy/(6*a)};
}
// Gültiger Umriss: mindestens 3 Punkte und eine Fläche von wenigstens einem Viertel Rasterfeld.
export const valid=(pts:P[],dpi:number)=>pts.length>=3&&area(pts)>=dpi*dpi/4;
