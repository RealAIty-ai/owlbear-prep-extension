// Gemeinsame Schlüssel/Typen für Popover (draft.ts) und Background (background.ts), ohne UI-Abhängigkeiten.
import type {Found} from './adventure';
export const DRAFT='de.soenke.owlbear-prep/draft',TOOL='de.soenke.owlbear-prep/mark-tool',MARK_NS='de.soenke.owlbear-prep/mark';
export type Point={u:number;v:number};
export type DArea={no:string;name:string;monsters:Found[];names:string[];points:Point[]};
export type Draft={dungeon:string;dmMap?:string;current?:number;areas:DArea[]};
