# Owlbear Prep

**Scene preparation for [Owlbear Rodeo](https://www.owlbear.rodeo) from your adventure text, maps and statblocks.**
*Szenenvorbereitung für Owlbear Rodeo aus Abenteuertext, Karten und Statblocks – deutsche Beschreibung unten.*

Status: working prototype, runs locally via the Vite dev server. Not listed in the Owlbear extension store. UI and in-depth docs are German.

## What it does

You bring the material you own – the adventure as Markdown (e.g. a D&D Beyond export), the official player and DM map, token images and statblock screenshots. The extension turns them into a prepared scene:

- **Adventure import:** finds dungeons with numbered areas (`### 2. Name`), suggests monsters per area (bold creature names, counts like “four”, “each”) and treasure/trap sections.
- **Mark areas:** a GM tool places hidden markers on the player map (Alt+click removes, move with Owlbear's move tool); the DM map is only a reference for room numbers.
- **Monster roster:** token image and statblock screenshot per monster – from your disk or picked directly from your Owlbear asset library. Tokens are auto-cropped (square or round); HP, AC and size are read from the statblock via in-browser OCR (tesseract.js) and stay editable.
- **Plan → build:** generates a validated JSON plan and builds it: hidden image tokens with HP/AC in [Stat Bubbles for D&D](https://extensions.owlbear.rodeo/bubble-tracker), statblocks beside the map, numbered names (“Gray Ooze 1, 2 …”, Alt+drag copies are renumbered), hidden notes for treasure (yellow) and traps (red). Token size follows the statblock and the scene grid scale (e.g. 10 ft per square).
- **Safe removal:** “remove plan” deletes only what this plan created.

No AI API, no keys, no backend. Everything runs in your browser; only the OCR language data is loaded once from the jsDelivr CDN.

## Quick start

Requirements: Node.js 22.12+ (Node 24 recommended), an Owlbear Rodeo account with GM role, ideally the *Stat Bubbles for D&D* extension.

```sh
npm ci
npm run dev
```

1. Owlbear profile → Extensions → Add Extension → `http://localhost:5173/manifest.json`.
2. Enable it in a room, open **Prep** in the top toolbar as GM.
3. Follow the checklist at the top of the popover: maps → adventure → mark areas → images → plan → build.

The dev server must run on your own computer while you use the extension. On Windows, a project path containing `&` breaks `npm run dev`; move the folder or run `node node_modules/vite/bin/vite.js`.

## Content and copyright

This repository contains **code only**. Adventure texts, maps, token art and statblocks are not included and must not be committed – use material you own. The local folder `abenteuer/` is git-ignored for that purpose. Hidden items in Owlbear are not a secrecy mechanism: they are part of the scene data.

## Contributing

`main` is protected: changes go through a branch and a pull request.

```sh
npm run build   # type check + production build
npm test        # unit tests (node --test)
```

Structure, plan format and limits: German sections below; live-test log in `VERIFICATION.md`, goals in `PROJECT_BRIEF.md`.

## License

MIT – see [LICENSE](LICENSE). Not affiliated with Owlbear Rodeo, Wizards of the Coast or D&D Beyond.

---

# Deutsch

## Was die Extension kann

Das Popover führt in 5 Schritten, eine Checkliste oben zeigt den nächsten Schritt:

1. **Karten:** Spielerkarte (darauf wird gespielt) und DM-Karte (mit Raumnummern, unsichtbar daneben) wählen. Vorschlag anhand des Namens bzw. bei zwei Karten automatisch. Die Spielerkarte in Owlbear auf das gedruckte Raster ausrichten und die Rasterskala (5 ft / 10 ft) passend einstellen.
2. **Abenteuer:** Markdown-Datei laden, Dungeon übernehmen. Pro Raum Monster/Anzahl prüfen („je Punkt“ = ein Monster an jeder markierten Stelle), Schatz-/Fallen-Notizen aufklappen und bearbeiten. Mit **Markieren** jede Stelle des Raums auf der Spielerkarte anklicken (roter Punkt, für Spieler verborgen). Klick auf einen Punkt zeigt nur einen Hinweis, **Alt+Klick löscht**, verschieben mit dem Bewegen-Werkzeug.
3. **Monster:** aus dem Abenteuer übernehmen oder von Hand hinzufügen. Je Monster Tokenbild und Statblock-Screenshot wählen: von der Festplatte („wählen …“, Token wird zugeschnitten, danach hochladen und zuordnen) oder direkt aus der Owlbear-Bibliothek („aus Owlbear …“, sofort zugeordnet). HP, RK und Größe werden aus dem Statblock gelesen. „Bilder in Owlbear hochladen“, im Owlbear-Dialog bestätigen, dann „Hochgeladene zuordnen“ – die Auswahl zeigt nur die Bilder dieses Uploads.
4. **Plan:** „Plan erzeugen“ (optional als JSON speichern oder eigenen Plan einfügen). Nicht markierte Räume landen in einer Ablage unter der Karte.
5. **Aufbauen:** Szene bestätigen, „In dieser Szene aufbauen“. Alles wird verborgen angelegt; „Plan entfernen“ löscht nur Elemente dieses Plans.

## Plan-Format (JSON, Version 1)

`{version:1, id, name, monsters:[…], notes:[…], reveals:[…]}`, Schema in `src/plan.ts`, streng validiert.
- **monsters:** `id`, `name`, optional `type` (Monsterart aus der Monsterliste), `x`/`y` in Rasterfeldern ab oberer linker Ecke der Spielerkarte (Tokenmitte), `size` in Rasterfeldern, optional `hp`/`ac`.
- **notes** (optional): `id`, `name`, `kind` (`Schatz`/`Falle`), `x`/`y` (obere linke Ecke), `text`.
- **reveals:** Sichtblöcke `id`, `name`, `x`, `y`, `width`, `height`.

## Grenzen

- Parser und OCR sind regelbasiert; Ergebnisse immer prüfen. Raumnummern auf Kartenbildern werden nicht erkannt – deshalb Markieren per Klick.
- Markieren auf der Spielerkarte funktioniert mit jeder Battlemap; wird auf der DM-Karte markiert, müssen beide Karten dieselbe Geometrie haben.
- Owlbear-eigene „Notes“ (Bild-Assets) werden nicht genutzt; Notizen sind farbige Zettel auf dem NOTE-Layer.
- Stat-Bubbles-Anbindung nutzt deren Metadatenschema (`com.owlbear-rodeo-bubbles-extension/metadata`, aus dem Quellcode v1.9.13).
- Spieleransicht ist noch nicht live geprüft. Noch nicht umgesetzt: Sichtbereiche je Raum/als freie Form, Luft-/Wasser-Tracker, Kampfablauf.

## Aufbau

| Datei | Aufgabe |
|---|---|
| `index.html`, `src/main.ts` | Popover, Plan prüfen/aufbauen/entfernen, Sichtblöcke |
| `src/plan.ts` | Plan-Schema (Grenze zwischen Planung und Ausführung) |
| `src/adventure.ts` | Parser für Abenteuer-Markdown (Räume, Monster, Schatz/Falle) |
| `src/draft.ts`, `src/draft-keys.ts` | Dungeon-Entwurf, Markierungen, Plan erzeugen, Checkliste |
| `src/roster.ts`, `src/stats.ts`, `src/token.ts` | Monsterliste, Upload, OCR, Statblock-Parser, Token-Zuschnitt |
| `src/scene.ts` | Kartengeometrie, Verteilung, Rasterskala, Stat Bubbles, Nummerierung |
| `src/background.ts`, `background.html` | Hintergrund: Markier-Werkzeug, Nummerierung von Kopien |

## Quellen

- https://docs.owlbear.rodeo/extensions/getting-started/
- https://docs.owlbear.rodeo/extensions/reference/manifest/ (`background_url`)
- https://github.com/SeamusFinlayson/Bubbles-for-Owlbear-Rodeo (Stat-Bubbles-Metadaten)
- Offizielles `@owlbear-rodeo/sdk` 3.1.0
