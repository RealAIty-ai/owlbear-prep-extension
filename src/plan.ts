import { z } from 'zod';
const coordinate = z.number().finite().min(-1000).max(1000);
const key = z.string().regex(/^[a-z0-9-]{1,60}$/);
export const Plan = z.object({
  version:z.literal(1), id:key, name:z.string().min(1).max(100),
  // type: Monstername aus der Monsterliste (Token, Statblock, HP/RK). Ohne type wird name verwendet; HP/RK im Plan sind Rückfallwerte.
  monsters:z.array(z.object({id:key,name:z.string().min(1).max(80),type:z.string().min(1).max(80).optional(),x:coordinate,y:coordinate,size:z.number().min(0.5).max(20),hp:z.number().int().min(1).max(9999).optional(),ac:z.number().int().min(0).max(99).optional()}).strict()).max(100),
  // Notizen (Schatz/Falle): verborgener Zettel, x/y = obere linke Ecke in Rasterfeldern ab Kartenecke.
  notes:z.array(z.object({id:key,name:z.string().min(1).max(120),kind:z.enum(['Schatz','Falle']),x:coordinate,y:coordinate,text:z.string().min(1).max(4000)}).strict()).max(100).optional(),
  reveals:z.array(z.object({id:key,name:z.string().min(1).max(80),x:coordinate,y:coordinate,width:z.number().positive().max(100),height:z.number().positive().max(100)}).strict()).max(100)
}).strict().superRefine((p,ctx)=>{const ids=[...p.monsters,...p.reveals,...(p.notes??[])].map(v=>v.id);if(new Set(ids).size!==ids.length)ctx.addIssue({code:'custom',message:'Item-IDs müssen eindeutig sein.'});});
export type ScenePlan=z.infer<typeof Plan>;
export const demo:ScenePlan={version:1,id:'prep-demo-01',name:'Technischer Test',monsters:[{id:'m1',name:'Testgegner 1',x:2,y:2,size:1,hp:20,ac:12},{id:'m2',name:'Testgegner 2',x:4,y:2,size:1,hp:30,ac:13},{id:'m3',name:'Testgegner 3',x:6,y:2,size:2,hp:40,ac:14}],reveals:[{id:'r1',name:'Testkammer',x:1,y:1,width:7,height:4}]};
