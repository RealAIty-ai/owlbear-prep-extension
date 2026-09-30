import {test} from 'node:test';
import assert from 'node:assert/strict';
import {contentBox,squareBox,transparentShare} from './token.ts';
function img(w:number,h:number,opaque:(x:number,y:number)=>boolean){const d=new Uint8ClampedArray(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++)d[(y*w+x)*4+3]=opaque(x,y)?255:0;return d;}
test('transparent border is trimmed',()=>assert.deepEqual(contentBox(img(10,8,(x,y)=>x>=2&&x<=7&&y>=1&&y<=5),10,8),{x:2,y:1,w:6,h:5}));
test('fully transparent image keeps full size',()=>assert.deepEqual(contentBox(img(4,4,()=>false),4,4),{x:0,y:0,w:4,h:4}));
test('square is centred on the content and fills it',()=>assert.deepEqual(squareBox({x:2,y:1,w:6,h:4},10,8),{x:3,y:1,w:4,h:4}));
test('square stays inside the image',()=>assert.deepEqual(squareBox({x:0,y:0,w:10,h:4},10,8),{x:3,y:0,w:4,h:4}));
test('fit keeps the whole subject (e.g. a tall figure)',()=>assert.deepEqual(squareBox({x:10,y:0,w:4,h:10},30,10,'fit'),{x:7,y:0,w:10,h:10}));
test('transparent share',()=>{assert.equal(transparentShare(img(10,10,x=>x<5)),0.5);assert.equal(transparentShare(img(2,2,()=>true)),0);});
