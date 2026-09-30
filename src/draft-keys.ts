// Gemeinsame Schlüssel/Typen für Popover (draft.ts) und Background (background.ts), ohne UI-Abhängigkeiten.
import type {Found} from './adventure';
export const DRAFT='de.soenke.owlbear-prep/draft',TOOL='de.soenke.owlbear-prep/mark-tool',MARK_NS='de.soenke.owlbear-prep/mark';
// Gerade markierter Bereich je GM (Spieler-Metadaten; Werkzeug-Metadaten kamen im Test nicht beim Klick an).
export const MARKING='de.soenke.owlbear-prep/marking';
export type Point={u:number;v:number};
// points: nur noch Altbestand; maßgeblich sind die Markierungs-Items auf der Karte (verschieb- und löschbar).
export type DArea={no:string;name:string;monsters:Found[];names:string[];points?:Point[]};
export type Draft={dungeon:string;dmMap?:string;playerMap?:string;areas:DArea[]};
// Markierung: verborgener Text; der markierte Punkt liegt bei Item-Position + (dx,dy).
export type Mark={area:string;i:number;n?:number;dx:number;dy:number};
export const MARK_LABEL='de.soenke.owlbear-prep/mark-label';
