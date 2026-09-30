// Liest HP/RK und Größe aus OCR-Text eines Statblocks (englisch/deutsch, 2014/2024-Layout). Ergebnis immer vom DM bestätigen lassen.
const num=(s:string)=>Number(s.replace(/[oO]/g,'0'));
const AC=/\b(?:armou?r\s*class|r\S{1,3}stungsklasse|AC|RK)\s*[:.]?\s*([0-9oO]{1,2})\b/i;
const HP=/\b(?:hit\s*points|trefferpunkte|HP|TP)\s*[:.]?\s*([0-9oO]{1,4})\b/i;
// Größe in Rasterfeldern (Kantenlänge), erste Nennung im Statblock, z. B. „Huge Ooze“ → 3.
const SIZES:Record<string,number>={tiny:0.5,small:1,medium:1,large:2,huge:3,gargantuan:4,winzig:0.5,klein:1,mittelgroß:1,groß:2,riesig:3,gigantisch:4};
const SIZE=/(?<![a-zäöüß])(tiny|small|medium|large|huge|gargantuan|winzig|klein|mittelgroß|groß|riesig|gigantisch)(?![a-zäöüß])/i;
export function parseStats(text:string):{hp?:number;ac?:number;size?:number}{
  const t=text.replace(/\s+/g,' '),a=AC.exec(t),h=HP.exec(t),z=SIZE.exec(t),r:{hp?:number;ac?:number;size?:number}={};
  if(a&&num(a[1])>0)r.ac=num(a[1]);if(h&&num(h[1])>0)r.hp=num(h[1]);if(z)r.size=SIZES[z[1].toLowerCase()];return r;
}
