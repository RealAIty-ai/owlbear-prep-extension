import OBR,{buildText,isImage,type Image,type Item} from '@owlbear-rodeo/sdk';
import {labelNumber,mapRect,renumber,type MapLike} from './scene';
import {DRAFT,MARK_NS,TOOL,type Draft} from './draft-keys';
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
// Markier-Werkzeug: Klick auf die DM-Karte hängt einen Punkt (Anteil der Karte) an den gewählten Bereich und setzt eine verborgene Nummer als Rückmeldung.
async function markClick(pos:{x:number;y:number}){
  const d=(await OBR.scene.getMetadata())[DRAFT] as Draft|undefined;if(!d||d.current===undefined||!d.dmMap)return;
  const [dm]=await OBR.scene.items.getItems([d.dmMap]);if(!dm)return;const dpi=await OBR.scene.grid.getDpi(),r=mapRect(dm as unknown as MapLike,dpi);
  const u=(pos.x-r.x)/r.w,v=(pos.y-r.y)/r.h;if(u<0||u>1||v<0||v>1){await OBR.notification.show('Außerhalb der DM-Karte geklickt.','WARNING');return;}
  const a=d.areas[d.current];a.points.push({u,v});await OBR.scene.setMetadata({[DRAFT]:d});
  await OBR.notification.show(`Bereich ${a.no}: Punkt ${a.points.length} gesetzt. Weiter klicken oder im Popover den nächsten Bereich markieren.`,'SUCCESS');
  await OBR.scene.items.addItems([buildText().textType('PLAIN').plainText(`${a.no}·${a.points.length}`).fontSize(Math.round(dpi*0.8)).fontWeight(800).fillColor('#ff3b3b').strokeColor('#ffffff').strokeWidth(4).position({x:pos.x-dpi*0.4,y:pos.y-dpi*0.55}).layer('TEXT').visible(false).locked(true).name(`Bereich ${a.no}`).metadata({[MARK_NS]:{area:a.no,i:a.points.length}}).build()]);
}
async function tools(){
  const icon=new URL('/icon.svg',location.href).href;
  await OBR.tool.create({id:TOOL,icons:[{icon,label:'Prep: Bereiche markieren',filter:{roles:['GM']}}],defaultMode:`${TOOL}/click`});
  await OBR.tool.createMode({id:`${TOOL}/click`,icons:[{icon,label:'Bereich markieren',filter:{activeTools:[TOOL]}}],cursors:[{cursor:'crosshair'}],onToolClick:(_c,e)=>{void markClick(e.pointerPosition);return false;}});
}
OBR.onReady(async()=>{void tools();
  gm=await OBR.player.getRole()==='GM';OBR.player.onChange(p=>{gm=p.role==='GM';});
  OBR.scene.onReadyChange(r=>{known=new Set();if(r)void sync();});if(await OBR.scene.isReady())await sync();
  OBR.scene.items.onChange(()=>void sync());
});
