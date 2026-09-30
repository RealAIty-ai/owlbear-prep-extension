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
