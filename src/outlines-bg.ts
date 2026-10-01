// Hintergrund (nur GM): Raumumrisse zeichnen (Rechteck aufziehen / Punkte klicken) und als lokale, nur für den GM sichtbare Vorschau anzeigen.
// Quelle der Wahrheit sind die Umrisse im Szenen-Entwurf (draft.areas[].outlines); die lokalen Items werden daraus neu erzeugt.
import OBR,{buildCurve,buildText,type Item,type Vector2} from '@owlbear-rodeo/sdk';
import {DRAFT,MARKING,TOOL,type Draft} from './draft-keys';
import {centroid,rectPoints,simplify,valid,type P} from './outline';
const LOCAL='de.soenke.owlbear-prep/outline-local',COLORS=['#4da3ff','#b8edb0','#f0c987','#ff9a8a','#c79bff','#7fe0d6'];
const sel=async()=>(await OBR.player.getMetadata())[MARKING] as {area?:string}|undefined;
async function draftAndArea(){const d=(await OBR.scene.getMetadata())[DRAFT] as Draft|undefined,s=await sel(),a=d?.areas.find(x=>x.no===s?.area);return {d,a};}
// Am Raster einrasten (Rasterkreuzungen) – selbst gerechnet; OBR.scene.grid.snapPosition kam im Test während des Ziehens nicht zurück.
let cell=150;const snap=(p:Vector2):P=>({x:Math.round(p.x/cell)*cell,y:Math.round(p.y/cell)*cell});
// Fertigen Umriss speichern (vereinfacht, mit Mindestgröße).
async function commit(pts:P[]){
  const {d,a}=await draftAndArea();if(!d||!a){await OBR.notification.show('Im Prep-Popover zuerst bei einem Raum „Umriss“ wählen.','WARNING');return;}
  const q=simplify(pts),dpi=await OBR.scene.grid.getDpi();if(!valid(q,dpi)){await OBR.notification.show('Umriss zu klein – mindestens drei Punkte und ein Viertel Rasterfeld.','WARNING');return;}
  a.outlines=[...(a.outlines??[]),q.map(p=>({x:Math.round(p.x),y:Math.round(p.y)}))];await OBR.scene.setMetadata({[DRAFT]:d});
  await OBR.notification.show(`Raum ${a.no}: Umriss ${a.outlines.length} gespeichert.`,'SUCCESS');
}
// Lokale Vorschau: halbtransparente Fläche + Raumnummer, nur auf diesem Rechner.
// Nacheinander ausführen: zwei gleichzeitige Läufe würden beide löschen und beide neu anlegen (doppelte Vorschau).
let rendering=Promise.resolve();
export function renderOutlines(){rendering=rendering.then(drawOutlines).catch(()=>{});return rendering;}
async function drawOutlines(){
  const d=(await OBR.scene.getMetadata())[DRAFT] as Draft|undefined,dpi=await OBR.scene.grid.getDpi(),items:Item[]=[];
  d?.areas.forEach((a,k)=>(a.outlines??[]).forEach((o,j)=>{const c=COLORS[k%COLORS.length],m=centroid(o);
    items.push(buildCurve().points(o).closed(true).tension(0).fillColor(c).fillOpacity(0.18).strokeColor(c).strokeOpacity(0.9).strokeWidth(Math.max(3,dpi/30)).strokeDash([dpi/6,dpi/10]).layer('DRAWING').locked(true).disableHit(true).name(`Umriss ${a.no}`).metadata({[LOCAL]:{area:a.no,j}}).build(),
      buildText().textType('PLAIN').plainText(a.no).fontSize(Math.round(dpi*0.5)).fontWeight(800).fillColor(c).strokeColor('#172128').strokeWidth(4).position({x:m.x-dpi*0.25,y:m.y-dpi*0.35}).layer('TEXT').locked(true).disableHit(true).metadata({[LOCAL]:{area:a.no,j,label:true}}).build());}));
  const old=(await OBR.scene.local.getItems(i=>!!i.metadata[LOCAL])).map(i=>i.id);if(old.length)await OBR.scene.local.deleteItems(old);if(items.length)await OBR.scene.local.addItems(items);
}
// Vorschau während des Zeichnens (Linie bis zum Mauszeiger) – lokal, ein einziges Item. Nur der neueste Stand wird gezeichnet;
// das Speichern wartet nie auf die Vorschau (eine hängende Owlbear-Antwort darf das Zeichnen nicht blockieren).
const PREVIEW='de.soenke.owlbear-prep/outline-preview';let want:P[]=[],busy=false;
function preview(pts:P[]){want=pts;if(!busy)void flush();}
async function flush(){busy=true;try{for(let n=0;n<50;n++){const pts=want,old=(await OBR.scene.local.getItems(i=>!!i.metadata[PREVIEW])).map(i=>i.id);
  if(old.length)await OBR.scene.local.deleteItems(old);
  if(pts.length>=2)await OBR.scene.local.addItems([buildCurve().points(pts).closed(false).tension(0).strokeColor('#ffffff').strokeWidth(4).strokeDash([20,12]).fillOpacity(0).layer('CONTROL').disableHit(true).metadata({[PREVIEW]:true}).build()]);
  if(want===pts)break;}}catch{/* Vorschau ist nur Hilfe */}finally{busy=false;}}
let start:P|undefined,poly:P[]=[],hover:P|undefined;
// Klicks über onToolDown: Auf nicht gesperrten Tokens/Notizen liefert Owlbear weder onToolClick noch onToolUp (nur onToolDown),
// weil es das Objekt auswählen bzw. ziehen will (live geprüft). Diese Modi brauchen kein Ziehen – das Drücken gilt als Klick.
let lastClick=0;
export async function outlineModes(icon:string){
  const dpi=async()=>{cell=await OBR.scene.grid.getDpi();};await dpi().catch(()=>{});OBR.scene.grid.onChange(g=>{cell=g.dpi;});
  // Rechteck: erste Ecke klicken, gegenüberliegende Ecke klicken (Ziehen ginge nicht über Tokens – Owlbear verschiebt dann das Token).
  const rectClick=async(at:Vector2)=>{const p=snap(at);if(!start){start=p;return;}const s=start;start=undefined;preview([]);await commit(rectPoints(s,p));};
  await OBR.tool.createMode({id:`${TOOL}/rect`,icons:[{icon,label:'Umriss: Rechteck (zwei Ecken klicken)',filter:{activeTools:[TOOL]}}],cursors:[{cursor:'crosshair'}],
    onToolDown:(_c,e)=>{void rectClick(e.pointerPosition);},
    onToolClick:()=>false,
    onToolMove:(_c,e)=>{if(start){const r=rectPoints(start,snap(e.pointerPosition));preview([...r,r[0]]);}},
    onKeyDown:(_c,e)=>{if(e.key==='Escape'){start=undefined;preview([]);}},
    onDeactivate:()=>{start=undefined;preview([]);}});
  // Punkte klicken (Höhlen, schräge Wände); Enter oder Doppelklick = fertig, Esc = abbrechen, Rücktaste = letzten Punkt entfernen
  const finish=async()=>{const p=poly;poly=[];preview([]);if(p.length)await commit(p);};
  await OBR.tool.createMode({id:`${TOOL}/poly`,icons:[{icon,label:'Umriss: Punkte klicken',filter:{activeTools:[TOOL]}}],cursors:[{cursor:'crosshair'}],
    onToolDown:(_c,e)=>{const now=Date.now(),dbl=now-lastClick<350;lastClick=now;
      if(dbl&&poly.length>=3){void finish();return;}poly.push(snap(e.pointerPosition));preview([...poly,...(hover?[hover]:[])]);},
    onToolClick:()=>false,onToolDoubleClick:()=>false,
    onToolMove:(_c,e)=>{if(!poly.length)return;hover=snap(e.pointerPosition);preview([...poly,hover,poly[0]]);},
    onKeyDown:async(_c,e)=>{if(e.key==='Enter')await finish();else if(e.key==='Escape'){poly=[];preview([]);}else if(e.key==='Backspace'){poly.pop();preview(poly);}},
    onDeactivate:()=>{poly=[];start=undefined;preview([]);}});
}
