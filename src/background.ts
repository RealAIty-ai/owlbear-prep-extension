import OBR,{isImage,type Image,type Item} from '@owlbear-rodeo/sdk';
import {labelNumber,renumber} from './scene';
// Läuft dauerhaft im Raum (auch ohne offenes Popover): Alt+Drag-Kopien eigener Monster bekommen die nächste freie Nummer im Token-Label („Name“ im Kontextmenü).
const NS='de.soenke.owlbear-prep/item';
type Meta={kind?:string;type?:string;n?:number};
let known=new Set<string>(),gm=false,running=false,again=false;
const meta=(i:Item)=>i.metadata[NS] as Meta|undefined;
// Nur Labels im Schema „<Typ>“ oder „<Typ> <Nr>“ (oder leer); vom DM frei umbenannte Tokens bleiben unangetastet.
const ours=(i:Item):i is Image=>{const t=meta(i)?.type;if(!isImage(i)||meta(i)?.kind!=='monster'||!t)return false;const l=i.text.plainText.trim();return !l||l.toLowerCase()===t.toLowerCase()||labelNumber(l,t)!==undefined;};
// Serialisiert: jeder Lauf liest den aktuellen Stand frisch, damit eigene Updates nicht erneut nummeriert werden.
async function sync(){
  if(!gm)return;if(running){again=true;return;}running=true;
  try{do{again=false;
    const list=(await OBR.scene.items.getItems(ours)).map(i=>({id:i.id,base:meta(i)!.type!,n:labelNumber(i.text.plainText,meta(i)!.type!)}));
    const up=renumber(list,known);known=new Set(list.map(l=>l.id));if(!up.length)continue;
    const by=new Map(up.map(u=>[u.id,u.n]));
    await OBR.scene.items.updateItems<Image>(up.map(u=>u.id),its=>{for(const it of its){const m=meta(it)!,n=by.get(it.id)!;it.metadata[NS]={...m,n};it.text.plainText=`${m.type} ${n}`;}});
  }while(again);}finally{running=false;}
}
OBR.onReady(async()=>{
  gm=await OBR.player.getRole()==='GM';OBR.player.onChange(p=>{gm=p.role==='GM';});
  OBR.scene.onReadyChange(r=>{known=new Set();if(r)void sync();});if(await OBR.scene.isReady())await sync();
  OBR.scene.items.onChange(()=>void sync());
});
