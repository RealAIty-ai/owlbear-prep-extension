# CLAUDE.md

Owlbear-Rodeo-Extension (Popover) zur D&D-Szenenvorbereitung. Prototyp, Dokumentation auf Deutsch (README zusätzlich Englisch).

Zuerst lesen: `PROJECT_BRIEF.md` (Ziel, Reihenfolge der Ausbauschritte), `AGENTS.md` (Arbeitsregeln – gelten auch hier), `README.md` (Live-Testablauf), `VERIFICATION.md` (was bewiesen ist und was nicht).

## Befehle

```sh
npm ci
npm run dev     # Vite auf 127.0.0.1:5173 (strictPort)
npm run build   # tsc --noEmit + vite build
npm test        # node --experimental-strip-types --test src/*.test.ts
```

Einzeltest: `node --experimental-strip-types --test --test-name-pattern "<name>" src/*.test.ts`. Node 22.12+ nötig (lokal: Node 24).

In Owlbear installieren: `http://localhost:5173/manifest.json` (Profil → Extensions → Add Extension).

## Architektur

- `src/plan.ts` – zod-Schema `Plan` (ScenePlan v1: `id`, `name`, `monsters`, `reveals`) plus `demo`. **Grenze zwischen KI-Planung und deterministischer Ausführung**: alles, was gebaut wird, muss vorher dieses Schema passieren. Schema ist `.strict()`, Item-IDs müssen planweit eindeutig sein.
- `src/main.ts` – Popover-Logik gegen `@owlbear-rodeo/sdk` 3.1.0 (exakt gepinnt). Karten-Upload über `OBR.assets.uploadScenes`, Aufbau per `OBR.scene.items.addItems`, Sichtblöcke (FOG-Layer-Rechtecke) umschalten, Plan gezielt entfernen.
- `src/roster.ts` – Monsterliste (Raum-Metadaten `de.soenke.owlbear-prep/roster`), Bild-Upload/Zuordnung über Asset-Namen `Prep <Monster> Token|Stats`, OCR per lazy geladenem tesseract.js; `src/stats.ts` – reiner HP/RK-Parser.
- `index.html` – gesamte UI inkl. Inline-CSS; `public/manifest.json` – Owlbear-Manifest (Popover `/`).
- `vite.config.mjs` – CORS-Freigabe für `https://www.owlbear.rodeo`; ohne sie blockiert der Browser das Manifest (`MissingAllowOriginHeader`).

Wichtige Konventionen in `main.ts`:
- Eigene Metadaten nur unter `de.soenke.owlbear-prep/item` mit `{planId, kind, sourceId, …}`. Löschen/Umschalten filtert immer über `planId` – nie fremde Items oder fremde Namespaces anfassen.
- Jede Mutation läuft über `run()` (Doppelklick-Sperre) und `guard()` (verbunden, GM-Rolle, Szene bereit) plus Checkbox „Testszene“.
- Koordinaten im Plan sind Rasterfelder ab der oberen linken Ecke der gewählten Ursprungskarte (`mapOrigin` in `src/scene.ts`); Umrechnung mit `OBR.scene.grid.getDpi()`.
- Laufende Monsternummer steht im Token-Label (`text.plainText`, „Name“ im Kontextmenü); `src/background.ts` (Manifest `background_url`) nummeriert Kopien nach, nur beim GM und nur Labels im Schema „<Typ> <Nr>“.
- Stat Bubbles: nur über `BUBBLES`/`bubbles()` in `src/scene.ts` schreiben (Schema aus Quellcode verifiziert, live bestätigt). Wirkt nur auf Bild-Items auf CHARACTER/MOUNT.
- Stat-Labels sind an den Token gehängt, erben aber bewusst **nicht** dessen Sichtbarkeit (`disableAttachmentBehavior(['VISIBLE'])`).

## Stil

Sehr kompakter Code (viele Anweisungen pro Zeile, kurze Namen). So beibehalten, keine neuen Frameworks/Services ohne konkreten Bedarf.

## Nicht behaupten

Stand der Live-Verifikation steht in VERIFICATION.md; Spieleransicht und Agentenverbindung sind nicht verifiziert – implementiert, getestet und geplant getrennt halten. Keine erfundenen D&D-Werte, keine Abenteuerinhalte/fremden Assets im Repo.
