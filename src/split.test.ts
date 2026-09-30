import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bgColor,blocks,guess,clearBackground} from './split.ts';
// Synthetisches Bild 100×40: weißer Grund, links gefüllter „Statblock“ (beige), rechts „Monster“ (Kreis, dunkel, mit weißem Fleck innen).
function sample(){const w=100,h=40,d=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;let c=[255,255,255];
    if(x>=2&&x<=50&&y>=2&&y<=37)c=[240,225,190];
    const r=Math.hypot(x-78,y-20);if(r<=14)c=r<=2?[255,255,255]:[60,60,70];
    d.set([...c,255],i);}
  return {w,h,d};}
test('background is the border colour',()=>{const {w,h,d}=sample();assert.deepEqual(bgColor(d,w,h),[255,255,255]);});
test('side-by-side blocks are split and classified',()=>{const {w,h,d}=sample(),g=guess(blocks(d,w,h,[255,255,255]));assert.deepEqual(g.stats,{x:2,y:2,w:49,h:36});assert.deepEqual(g.art,{x:64,y:6,w:29,h:29});});
test('background is cleared from the border but not inside the subject',()=>{const {w,h,d}=sample();clearBackground(d,w,h,[255,255,255]);const a=(x:number,y:number)=>d[(y*w+x)*4+3];assert.equal(a(0,0),0);assert.equal(a(99,39),0);assert.equal(a(78,20),255);assert.equal(a(70,20),255);});
