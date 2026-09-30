import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseAdventure,singular} from './adventure.ts';
// Eigener Beispieltext im Exportformat, kein Abenteuertext.
const md=`# Chapter 9: Test
## Road Encounter
Nothing keyed here.
## The Test Crypt
Intro text with a **rat**.
### 1. Gate
The gate is empty.
### 2. Guard Rooms
Each of these keyed rooms holds a **skeleton** that rises when disturbed.
### 3. Shrine
Three **zombies** kneel here. A **skeleton** waits too.
The priest **Morvek** hides behind the altar with a **giant rat**.
#### Treasure
A **Morvek** ring.
### 4. Pits
The four guards have risen as **wights**. Some **specters** drift here.
At the bottom of each pit is a **gray ooze**.
## Next Section
### 1. Other
A **goblin**.`;
test('dungeons are sections with numbered areas',()=>assert.deepEqual(parseAdventure(md).map(d=>[d.title,d.areas.map(a=>a.no)]),[['The Test Crypt',['1','2','3','4']],['Next Section',['1']]]));
test('monsters with counts, plural and each',()=>{const [c]=parseAdventure(md);assert.deepEqual(c.areas[1].monsters,[{type:'Skeleton',count:1,each:true}]);assert.deepEqual(c.areas[2].monsters,[{type:'Zombie',count:3,each:false},{type:'Skeleton',count:1,each:false},{type:'Giant Rat',count:1,each:false}]);assert.deepEqual(c.areas[3].monsters,[{type:'Wight',count:4,each:false},{type:'Specter',count:1,each:false},{type:'Gray Ooze',count:1,each:true}]);});
test('capitalized bold text is a name, not a monster',()=>{const [c]=parseAdventure(md);assert.deepEqual(c.areas[2].names,['Morvek']);assert.deepEqual(c.areas[0].monsters,[]);});
test('singular forms',()=>assert.deepEqual(['oozes','zombies','boxes','bass','wolf'].map(singular),['ooze','zombie','box','bass','wolf']));
