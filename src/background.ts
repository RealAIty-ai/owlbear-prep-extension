import OBR,{type Item} from '@owlbear-rodeo/sdk';
import {BUBBLES_NAME,renumber} from './scene';
// Läuft dauerhaft im Raum (auch ohne offenes Popover): Alt+Drag-Kopien eigener Monster bekommen die nächste freie Nummer im Stat-Bubbles-Namen.
const NS='de.soenke.owlbear-prep/item';
type Meta={kind?:string;type?:string;n?:number};
let known=new Set<string>(),gm=false,running=false,again=false;
const meta=(i:Item)=>i.metadata[NS] as Meta|undefined;
// Serialisiert: jeder Lauf liest den aktuellen Stand frisch, damit eigene Updates nicht erneut nummeriert werden.
async function sync(){
  if(!gm)return;if(running){again=true;return;}running=true;
  try{do{again=false;
    const list=(await OBR.scene.items.getItems(i=>meta(i)?.kind==='monster'&&!!meta(i)?.type)).map(i=>({id:i.id,base:meta(i)!.type!,n:meta(i)!.n}));
    const up=renumber(list,known);known=new Set(list.map(l=>l.id));if(!up.length)continue;
    const by=new Map(up.map(u=>[u.id,u.n]));
    await OBR.scene.items.updateItems(up.map(u=>u.id),its=>{for(const it of its){const m=meta(it)!,n=by.get(it.id)!;it.metadata[NS]={...m,n};it.metadata[BUBBLES_NAME]=`${m.type} ${n}`;}});
  }while(again);}finally{running=false;}
}
OBR.onReady(async()=>{
  gm=await OBR.player.getRole()==='GM';OBR.player.onChange(p=>{gm=p.role==='GM';});
  OBR.scene.onReadyChange(r=>{known=new Set();if(r)void sync();});if(await OBR.scene.isReady())await sync();
  OBR.scene.items.onChange(()=>void sync());
});
