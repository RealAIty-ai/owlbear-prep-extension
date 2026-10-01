import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rectPoints,simplify,area,centroid,valid} from './outline.ts';
test('rectangle from any drag direction',()=>assert.deepEqual(rectPoints({x:10,y:8},{x:2,y:3}),[{x:2,y:3},{x:10,y:3},{x:10,y:8},{x:2,y:8}]));
test('simplify drops duplicates, closing point and collinear points',()=>assert.deepEqual(simplify([{x:0,y:0},{x:0,y:0},{x:5,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10},{x:0,y:0}]),[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}]));
test('area and centroid of an L-shaped room',()=>{const L=[{x:0,y:0},{x:4,y:0},{x:4,y:2},{x:2,y:2},{x:2,y:4},{x:0,y:4}];assert.equal(area(L),12);const c=centroid(L);assert.ok(Math.abs(c.x-5/3)<1e-9&&Math.abs(c.y-5/3)<1e-9);});
test('valid needs three points and a quarter cell',()=>{assert.equal(valid([{x:0,y:0},{x:10,y:0}],150),false);assert.equal(valid(rectPoints({x:0,y:0},{x:50,y:50}),150),false);assert.equal(valid(rectPoints({x:0,y:0},{x:150,y:150}),150),true);});
