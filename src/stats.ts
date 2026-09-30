// Liest HP/RK aus OCR-Text eines Statblocks (englisch/deutsch, 2014/2024-Layout). Ergebnis immer vom DM bestätigen lassen.
const num=(s:string)=>Number(s.replace(/[oO]/g,'0'));
const AC=/\b(?:armou?r\s*class|r\S{1,3}stungsklasse|AC|RK)\s*[:.]?\s*([0-9oO]{1,2})\b/i;
const HP=/\b(?:hit\s*points|trefferpunkte|HP|TP)\s*[:.]?\s*([0-9oO]{1,4})\b/i;
export function parseStats(text:string):{hp?:number;ac?:number}{
  const t=text.replace(/\s+/g,' '),a=AC.exec(t),h=HP.exec(t),r:{hp?:number;ac?:number}={};
  if(a&&num(a[1])>0)r.ac=num(a[1]);if(h&&num(h[1])>0)r.hp=num(h[1]);return r;
}
