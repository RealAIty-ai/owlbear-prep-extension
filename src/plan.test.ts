import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Plan,demo} from './plan.ts';
test('demo and serialisation are valid',()=>assert.deepEqual(Plan.parse(JSON.parse(JSON.stringify(demo))),demo));
test('duplicate item IDs rejected',()=>assert.equal(Plan.safeParse({...demo,reveals:[{...demo.reveals[0],id:'m1'}]}).success,false));
test('negative HP and unbounded coordinates rejected',()=>{for(const patch of [{hp:-1},{x:Infinity},{size:0}])assert.equal(Plan.safeParse({...demo,monsters:[{...demo.monsters[0],...patch}]}).success,false);});
test('unknown operations rejected',()=>assert.equal(Plan.safeParse({...demo,deleteAll:true}).success,false));
test('notes are optional and validated',()=>{assert.equal(Plan.safeParse({...demo,notes:[{id:'n1',name:'Schatz – Bereich 1',kind:'Schatz',x:1,y:1,text:'12 gp'}]}).success,true);assert.equal(Plan.safeParse({...demo,notes:[{id:'n1',name:'x',kind:'Beute',x:1,y:1,text:'a'}]}).success,false);assert.equal(Plan.safeParse({...demo,notes:[{id:'m1',name:'x',kind:'Falle',x:1,y:1,text:'a'}]}).success,false);});
