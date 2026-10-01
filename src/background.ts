import OBR,{buildShape,buildText,isImage,type Image,type Item} from '@owlbear-rodeo/sdk';
import {labelNumber,mapRect,renumber,type MapLike} from './scene';
import {DRAFT,MARK_LABEL,MARK_NS,MARKING,TOOL,type Draft,type Mark} from './draft-keys';
import {outlineModes,renderOutlines} from './outlines-bg';
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
// Markier-Werkzeug: Klick auf Spieler- oder DM-Karte setzt eine verborgene Markierung für den gewählten Bereich; Klick auf eine Markierung entfernt sie.
// Die Markierungen selbst sind die Positionsquelle für „Plan erzeugen“ und lassen sich mit Owlbear-Mitteln verschieben/löschen.
async function markClick(pos:{x:number;y:number},target:Item|undefined,alt:boolean){
  // Markierung = roter Punkt (auswählbar, verschiebbar) + angehängte Nummer. Alt+Klick auf eine Markierung löscht sie; normaler Klick darauf setzt nichts Neues.
  // Treffer selbst bestimmen: Owlbear liefert verborgene Items nicht zuverlässig als target. Umkreis = halbes Feld.
  const dpi0=await OBR.scene.grid.getDpi(),near=(await OBR.scene.items.getItems(i=>!!i.metadata[MARK_NS])).map(i=>({i,d:Math.hypot(i.position.x-pos.x,i.position.y-pos.y)})).filter(x=>x.d<dpi0*0.5).sort((a,b)=>a.d-b.d)[0]?.i;
  const hit=near??(target&&(target.metadata[MARK_NS]||target.metadata[MARK_LABEL])?target:undefined);
  if(hit){if(!alt){await OBR.notification.show('Hier liegt schon eine Markierung. Löschen: Alt+Klick, verschieben: Bewegen-Werkzeug.','INFO');return;}
    const root=hit.metadata[MARK_NS]?hit.id:hit.attachedTo;const ids=(await OBR.scene.items.getItems(i=>i.id===root||i.attachedTo===root)).map(i=>i.id);await OBR.scene.items.deleteItems(ids);await OBR.notification.show('Markierung entfernt.','INFO');return;}
  const d=(await OBR.scene.getMetadata())[DRAFT] as Draft|undefined;
  const sel=(await OBR.player.getMetadata())[MARKING] as {area?:string}|undefined,a=d?.areas.find(x=>x.no===sel?.area);if(!d||!a){await OBR.notification.show('Im Prep-Popover zuerst bei einem Bereich auf „Markieren“ klicken.','WARNING');return;}
  const dpi=await OBR.scene.grid.getDpi(),maps=await OBR.scene.items.getItems(i=>i.layer==='MAP'&&i.type==='IMAGE');
  if(!maps.some(m=>{const r=mapRect(m as unknown as MapLike,dpi);return pos.x>=r.x&&pos.x<=r.x+r.w&&pos.y>=r.y&&pos.y<=r.y+r.h;})){await OBR.notification.show('Bitte auf eine Karte klicken.','WARNING');return;}
  const k=Math.max(0,...(await OBR.scene.items.getItems(i=>(i.metadata[MARK_NS] as Mark|undefined)?.area===a.no)).map(i=>(i.metadata[MARK_NS] as Mark).n??0))+1,r=dpi*0.3;
  const dot=buildShape().shapeType('CIRCLE').width(r*2).height(r*2).position(pos).fillColor('#ff3b3b').fillOpacity(0.9).strokeColor('#ffffff').strokeWidth(4).layer('PROP').visible(false).name(`Bereich ${a.no}·${k} · ${a.name}`).metadata({[MARK_NS]:{area:a.no,i:Date.now(),n:k,dx:0,dy:0} satisfies Mark}).build();
  const label=buildText().textType('PLAIN').plainText(`${a.no}·${k}`).fontSize(Math.round(dpi*0.45)).fontWeight(800).fillColor('#ff3b3b').strokeColor('#ffffff').strokeWidth(3).position({x:pos.x+r+4,y:pos.y-r}).layer('TEXT').visible(false).locked(true).attachedTo(dot.id).name(`Bereich ${a.no}·${k}`).metadata({[MARK_LABEL]:true}).build();
  await OBR.scene.items.addItems([dot,label]);
  await OBR.notification.show(`Bereich ${a.no}: Markierung ${k} gesetzt.`,'SUCCESS');
}
async function tools(){
  const icon=new URL('/icon.svg',location.href).href;
  await OBR.tool.create({id:TOOL,icons:[{icon,label:'Prep: Bereiche markieren',filter:{roles:['GM']}}],defaultMode:`${TOOL}/click`});
  await OBR.tool.createMode({id:`${TOOL}/click`,icons:[{icon,label:'Bereich markieren',filter:{activeTools:[TOOL]}}],cursors:[{cursor:'crosshair'}],onToolClick:(_c,e)=>{void markClick(e.pointerPosition,e.target,e.altKey);return false;}});
  await outlineModes(icon);
}
OBR.onReady(async()=>{void tools();
  // Raum-Badge am Prep-Symbol nur, solange das Markier-/Umriss-Werkzeug aktiv ist.
  OBR.tool.onToolChange(id=>{if(id!==TOOL)void OBR.action.setBadgeText(undefined);});
  gm=await OBR.player.getRole()==='GM';OBR.player.onChange(p=>{gm=p.role==='GM';});
  // Umriss-Vorschau nur beim GM (lokale Items), neu aufbauen bei Szenenwechsel und Entwurfsänderung.
  const outlines=()=>{if(gm)void renderOutlines().catch(()=>{});};
  OBR.scene.onReadyChange(r=>{known=new Set();if(r){void sync();outlines();}});if(await OBR.scene.isReady()){await sync();outlines();}
  let last='';OBR.scene.onMetadataChange(m=>{const k=JSON.stringify((m[DRAFT] as Draft|undefined)?.areas.map(a=>a.outlines)??null);if(k!==last){last=k;outlines();}});
  OBR.scene.items.onChange(()=>void sync());
});
