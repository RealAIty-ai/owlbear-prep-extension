import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mapOrigin,bubbles} from './scene.ts';
const map={type:'IMAGE',name:'Karte',rotation:0,position:{x:500,y:300},scale:{x:1,y:1},grid:{dpi:50,offset:{x:0,y:0}},image:{width:1000,height:800}};
test('origin is map position when offset is zero',()=>assert.deepEqual(mapOrigin(map,150),{x:500,y:300}));
test('offset is converted from image to scene pixels and scaled',()=>assert.deepEqual(mapOrigin({...map,grid:{dpi:50,offset:{x:10,y:20}},scale:{x:2,y:2}},150),{x:440,y:180}));
test('non-images and rotated maps rejected',()=>{assert.throws(()=>mapOrigin({...map,type:'SHAPE'},150));assert.throws(()=>mapOrigin({...map,rotation:90},150));});
test('stat bubbles use numeric fields and hide from players',()=>assert.deepEqual(bubbles(22,8),{health:22,'max health':22,'armor class':8,hide:true}));
