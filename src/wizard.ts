// Schritt-für-Schritt-Führung: immer nur ein Abschnitt sichtbar, Schrittleiste oben, „Zurück“/„Weiter“ unten.
// Welcher Schritt erledigt ist, meldet draft.progress() über window.prepSteps.
let step=1,done=[false,false,false,false,false],chosen=false;
const $=(id:string)=>document.getElementById(id)!;
let onEnter:(n:number)=>void=()=>{};
export function go(n:number){
  step=Math.min(5,Math.max(1,n));chosen=true;
  document.querySelectorAll<HTMLElement>('.step').forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===step));
  paint();onEnter(step);scrollTo({top:0});
}
function paint(){
  document.querySelectorAll<HTMLButtonElement>('#stepper button').forEach(b=>{const n=Number(b.dataset.go);b.className=n===step?'now':done[n-1]?'done':'';});
  ($('prev') as HTMLButtonElement).disabled=step===1;const nx=$('nextBtn') as HTMLButtonElement;nx.hidden=step===5;
  nx.textContent=done[step-1]?'Weiter ›':'Überspringen ›';nx.className=done[step-1]?'':'secondary';
}
// Aufruf aus draft.progress(): Zustand übernehmen; beim ersten Mal zum gespeicherten bzw. ersten offenen Schritt springen.
export function update(d:boolean[]){done=d;paint();}
// Nach dem Laden der Szenendaten: ersten offenen Schritt öffnen (fertiger Aufbau → Schritt 5).
export function start(){if(!chosen)go(done.findIndex(x=>!x)+1||5);}
export function init(enter:(n:number)=>void){
  onEnter=enter;(window as {prepSteps?:(d:boolean[])=>void}).prepSteps=update;
  document.querySelectorAll<HTMLButtonElement>('#stepper button').forEach(b=>b.onclick=()=>go(Number(b.dataset.go)));
  $('prev').onclick=()=>go(step-1);$('nextBtn').onclick=()=>go(step+1);
  document.querySelectorAll<HTMLElement>('.step').forEach(s=>s.classList.toggle('active',Number(s.dataset.step)===step));paint();
}
export const current=()=>step;
