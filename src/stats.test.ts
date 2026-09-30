import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseStats} from './stats.ts';
// Nur Layout-Muster mit Platzhalterzahlen, keine echten Monsterwerte.
test('2014 english layout',()=>assert.deepEqual(parseStats('Medium ooze\nArmor Class 11 (natural armor)\nHit Points 33 (6d8 + 6)\nSpeed 30 ft.'),{ac:11,hp:33,size:1}));
test('2024 english layout',()=>assert.deepEqual(parseStats('AC 15 Initiative +2 (12)\nHP 44 (8d8 + 8)\nSpeed 20 ft.'),{ac:15,hp:44}));
test('german layout',()=>assert.deepEqual(parseStats('Rüstungsklasse 12\nTrefferpunkte 27 (5W8 + 5)'),{ac:12,hp:27}));
test('german short layout and OCR umlaut noise',()=>{assert.deepEqual(parseStats('RK 9 TP 18 (4W8)'),{ac:9,hp:18});assert.deepEqual(parseStats('Riistungsklasse 13'),{ac:13});});
test('OCR letter O read as zero',()=>assert.deepEqual(parseStats('AC 1O HP 2O'),{ac:10,hp:20}));
test('OCR drops the space after the abbreviation',()=>assert.deepEqual(parseStats('Huge Ooze, Unaligned\nAC8 Initiative -2 (8)\nHP152 (16d12 + 48)'),{ac:8,hp:152,size:3}));
test('missing values stay undefined',()=>assert.deepEqual(parseStats('Actions Pseudopod. Melee Attack'),{}));
