import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Plan,demo} from './plan.ts';
test('demo and serialisation are valid',()=>assert.deepEqual(Plan.parse(JSON.parse(JSON.stringify(demo))),demo));
test('duplicate item IDs rejected',()=>assert.equal(Plan.safeParse({...demo,reveals:[{...demo.reveals[0],id:'m1'}]}).success,false));
test('negative HP and unbounded coordinates rejected',()=>{for(const patch of [{hp:-1},{x:Infinity},{size:0}])assert.equal(Plan.safeParse({...demo,monsters:[{...demo.monsters[0],...patch}]}).success,false);});
test('unknown operations rejected',()=>assert.equal(Plan.safeParse({...demo,deleteAll:true}).success,false));
