// Reine Hilfsfunktionen ohne OBR-Laufzeit, damit sie per node --test prüfbar sind.
export type Vec={x:number;y:number};
export type MapLike={type:string;name:string;rotation:number;position:Vec;scale:Vec;grid?:{dpi:number;offset:Vec};image?:{width:number;height:number}};
// Stat Bubbles for D&D: Schlüssel/Felder aus dem Quellcode verifiziert (SeamusFinlayson/Bubbles-for-Owlbear-Rodeo@1b83833, v1.9.13).
// Wirkt nur auf Bild-Items im Layer CHARACTER oder MOUNT.
export const BUBBLES='com.owlbear-rodeo-bubbles-extension/metadata';
export const bubbles=(hp:number,ac:number)=>({health:hp,'max health':hp,'armor class':ac,hide:true});
// Obere linke Kartenecke in Szenenkoordinaten. Plan-Koordinaten zählen Rasterfelder ab dort.
export function mapOrigin(m:MapLike,sceneDpi:number):Vec{
  if(m.type!=='IMAGE'||!m.grid||!m.image)throw Error(`„${m.name}“ ist kein Kartenbild.`);
  if(m.rotation%360!==0)throw Error(`Karte „${m.name}“ ist gedreht; nur unrotierte Karten werden unterstützt.`);
  const s=sceneDpi/m.grid.dpi;
  return {x:m.position.x-m.grid.offset.x*s*m.scale.x,y:m.position.y-m.grid.offset.y*s*m.scale.y};
}
// Laufende Nummer am Ende des Token-Labels, z. B. „Gray Ooze 3“ → 3.
export const labelNumber=(label:string,base:string)=>{const l=label.trim(),rest=l.slice(base.length).trim();return l.toLowerCase().startsWith(base.toLowerCase())&&/^\d+$/.test(rest)?Number(rest):undefined;};
export type Numbered={id:string;base:string;n?:number};
// Vergibt eindeutige Nummern je Monstertyp. Bekannte Items behalten ihre Nummer; neue (z. B. Alt+Drag-Kopien) mit belegter/fehlender Nummer bekommen die nächste freie.
export function renumber(items:Numbered[],known:Set<string>):{id:string;n:number}[]{
  const used=new Map<string,Set<number>>(),out:{id:string;n:number}[]=[];
  for(const i of [...items.filter(i=>known.has(i.id)),...items.filter(i=>!known.has(i.id))]){
    const u=used.get(i.base)??new Set<number>();used.set(i.base,u);
    if(i.n&&!u.has(i.n)){u.add(i.n);continue;}
    const n=Math.max(0,...u)+1;u.add(n);out.push({id:i.id,n});
  }
  return out;
}
// Kartenrechteck in Szenenkoordinaten; Punkte werden als Anteil (0..1) der Karte gespeichert, damit DM- und Spielerkarte austauschbar sind.
export function mapRect(m:MapLike,sceneDpi:number){const o=mapOrigin(m,sceneDpi),s=sceneDpi/m.grid!.dpi;return {x:o.x,y:o.y,w:m.image!.width*s*m.scale.x,h:m.image!.height*s*m.scale.y};}
// Versatz in Rasterfeldern für n Monster der Größe size rund um einen Punkt (Spirale: Mitte, Nachbarn, Diagonalen, …).
export function spread(n:number,size:number):Vec[]{
  const out:Vec[]=[{x:0,y:0}];
  for(let r=1;out.length<n;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===r)out.push({x:dx,y:dy});
  return out.slice(0,n).sort((a,b)=>Math.abs(a.x)+Math.abs(a.y)-Math.abs(b.x)-Math.abs(b.y)).map(v=>({x:v.x*size,y:v.y*size}));
}
