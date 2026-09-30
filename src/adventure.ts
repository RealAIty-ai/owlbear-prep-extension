// Liest Dungeons aus Abenteuer-Markdown im D&D-Beyond-Exportformat: „## Dungeon“, Bereiche „### 2. Name“, Kreaturen **fett**.
// Kleingeschriebene Fettungen gelten als Monsterart, großgeschriebene als Eigenname (NPC). Alles ist ein Vorschlag für den DM.
export type Found={type:string;count:number;each:boolean};
// Notizen aus Unterabschnitten „#### Treasure“ / „#### Trap(s)“ / „#### Hazard(s)“ des Bereichs.
export type Note={kind:'Schatz'|'Falle';text:string};
export type Area={no:string;name:string;monsters:Found[];names:string[];notes:Note[]};
const plain=(s:string)=>s.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g,'$1').replace(/^>+\s?/,'').trim();
export type Dungeon={title:string;areas:Area[]};
const WORDS:Record<string,number>={a:1,an:1,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
const title=(s:string)=>s.replace(/\b\w/g,c=>c.toUpperCase());
export function singular(s:string){return /(?:x|ch|sh|ss|zz)es$/i.test(s)?s.slice(0,-2):/[^s]s$/i.test(s)?s.slice(0,-1):s;}
function scan(text:string,area:Area){
  for(const sentence of text.split(/(?<=[.!?])\s+/))for(const m of sentence.matchAll(/(?:\b([a-z]+|\d+)\s+)?\*\*([^*]+)\*\*/gi)){
    const raw=m[2].trim().replace(/[.,;:]$/,''),word=m[1]?.toLowerCase();
    if(/^[A-Z]/.test(raw)){if(!area.names.includes(raw))area.names.push(raw);continue;}
    // Anzahl: Zahlwort direkt davor, sonst bei Plural das letzte Zahlwort im Satz davor („four servants … as **specters**“).
    const plural=/[^s]s$/i.test(raw)&&!/(ss|us|is)$/i.test(raw),before=sentence.slice(0,m.index).toLowerCase().match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/g)?.pop();
    const direct=word&&/^\d+$/.test(word)?Number(word):word?WORDS[word]:undefined,n=direct??(plural&&before?(/^\d+$/.test(before)?Number(before):WORDS[before]):undefined),type=title(plural||(n&&n>1)?singular(raw):raw);
    if(area.monsters.some(f=>f.type===type))continue;
    area.monsters.push({type,count:n??1,each:/\beach\b/i.test(sentence)});
  }
}
export function parseAdventure(md:string):Dungeon[]{
  const out:Dungeon[]=[];let d:Dungeon|undefined,a:Area|undefined,note:Note|undefined;
  for(const line of md.split(/\r?\n/)){
    const h2=/^## (?!#)(.+)/.exec(line),h3=/^### (\d+[a-z]?)\. (.+)/i.exec(line);
    if(h2){d={title:h2[1].trim(),areas:[]};out.push(d);a=undefined;note=undefined;continue;}
    const h4=/^####\s+(Treasure|Traps?|Hazards?)\b/i.exec(line);
    if(a&&h4){const kind:Note['kind']=/^treasure/i.test(h4[1])?'Schatz':'Falle';note={kind,text:''};a.notes.push(note);continue;}
    if(/^####/.test(line)){note=undefined;continue;}
    if(/^#{1,2} /.test(line)){d=undefined;a=undefined;note=undefined;continue;}
    if(h3&&d){a={no:h3[1],name:h3[2].trim(),monsters:[],names:[],notes:[]};d.areas.push(a);note=undefined;continue;}
    if(/^### /.test(line)){a=undefined;note=undefined;continue;}
    if(a)scan(line,a);
    if(note&&line.trim())note.text+=(note.text?'\n':'')+plain(line);
  }
  return out.filter(x=>x.areas.length>0);
}
