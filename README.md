# Owlbear Prep

**Szenenvorbereitung für [Owlbear Rodeo](https://www.owlbear.rodeo) – aus Abenteuertext, Karten und Statblocks wird eine spielbereite Szene.**
*Scene preparation for Owlbear Rodeo – [English below](#english).*

Stand: funktionsfähiger Prototyp, läuft lokal über den Vite-Dev-Server. Nicht im Owlbear-Extension-Store.

## Worum geht's?

Du bringst mit, was du besitzt: das Abenteuer als Markdown (z. B. D&D-Beyond-Export), die offizielle Spieler- und DM-Karte, Tokenbilder und Statblocks. Die Extension baut daraus eine vorbereitete Szene:

- **Monster am richtigen Ort** – verborgen, mit Tokenbild, HP/RK in [Stat Bubbles for D&D](https://extensions.owlbear.rodeo/bubble-tracker) und durchnummerierten Namen („Gnoll 1, 2 …“; Alt+Drag-Kopien werden weiter nummeriert).
- **Statblocks** als Bild neben der Karte.
- **Notizen** für Schätze (gelb) und Fallen (rot) neben den Räumen, für Spieler verborgen.
- **Richtige Größen** aus dem Statblock (Medium, Large, Huge …), passend zur Rasterskala der Szene (5 ft oder 10 ft je Feld).

Keine KI-API, keine Schlüssel, kein Server: Alles läuft in deinem Browser. Nur die Daten der Texterkennung werden einmalig vom CDN jsDelivr geladen.

## Schnellstart

Voraussetzungen: Node.js 22.12+ (empfohlen Node 24), Owlbear-Konto mit GM-Rolle, am besten die Extension *Stat Bubbles for D&D*.

```sh
npm ci
npm run dev
```

1. Owlbear-Profil → Extensions → Add Extension → `http://localhost:5173/manifest.json`
2. Extension im Raum aktivieren und als GM oben in der Leiste **Prep** öffnen.
3. Der Checkliste oben im Popover folgen.

Der Dev-Server muss auf deinem Rechner laufen, solange du die Extension nutzt. Unter Windows scheitert `npm run dev` in Pfaden mit `&` (z. B. `D:\D&D\…`) – Ordner verschieben oder `node node_modules/vite/bin/vite.js` starten.

## So läuft es ab

1. **Karten** – Spielerkarte als Szene anlegen und in Owlbear aufs gedruckte Raster ausrichten, Rasterskala passend einstellen. Die DM-Karte (mit Raumnummern) unsichtbar daneben legen. Im Popover werden beide meist automatisch erkannt.
2. **Abenteuer** – Markdown-Datei laden und Dungeon wählen. Die Extension schlägt je Raum Monster und Anzahl vor („je Punkt“ = ein Monster an jeder markierten Stelle) sowie Schatz- und Fallen-Notizen. Alles lässt sich bearbeiten.
3. **Räume markieren** – Bei einem Raum auf **Markieren** klicken, dann auf der Spielerkarte jede Stelle anklicken (roter Punkt, für Spieler unsichtbar). **Alt+Klick** löscht einen Punkt, verschieben geht mit dem Bewegen-Werkzeug.
4. **Monsterbilder** – Je Monster Tokenbild und Statblock:
   - **von der Festplatte** – das Token wird automatisch zugeschnitten (rund oder eckig),
   - **aus deiner Owlbear-Bibliothek** – ohne erneuten Upload,
   - **aus einem Screenshot** mit Statblock *und* Bild (z. B. D&D-Beyond-Monsterseite) – die Extension trennt beides, stellt das Bild frei und macht ein Token daraus.

   HP, RK und Größe werden aus dem Statblock gelesen (bitte prüfen). Neue Bilder: „Bilder in Owlbear hochladen“ → Owlbear-Dialog bestätigen → „Hochgeladene zuordnen“.
5. **Plan erzeugen und aufbauen** – Alles wird verborgen angelegt. „Plan entfernen“ löscht nur, was dieser Plan angelegt hat.

## Inhalte und Urheberrecht

Dieses Repository enthält **nur Code**. Abenteuertexte, Karten, Tokenbilder und Statblocks gehören nicht hinein – nutze Material, das du besitzt. Der lokale Ordner `abenteuer/` ist dafür von Git ausgeschlossen. Verborgene Elemente in Owlbear sind kein Geheimnisschutz: Sie sind Teil der Szenendaten.

## Grenzen

- Texterkennung und Parser arbeiten mit Regeln statt KI – Ergebnisse immer prüfen.
- Raumnummern auf Kartenbildern werden nicht erkannt, deshalb das Markieren per Klick.
- Owlbears eigene „Notes“ sind Bild-Assets und werden nicht genutzt; Notizen sind farbige Zettel.
- Die Spieleransicht ist noch nicht live geprüft.
- Noch offen: Sichtbereiche je Raum, Luft-/Wasser-Tracker, Kampfablauf.

## Für Entwickler

`main` ist geschützt – Änderungen über Branch und Pull Request.

```sh
npm run build   # Typprüfung + Produktionsbuild
npm test        # Unit-Tests (node --test)
```

**Plan-Format (JSON, Version 1):** `{version:1, id, name, monsters:[…], notes:[…], reveals:[…]}`, Schema in `src/plan.ts`, streng validiert.
- `monsters`: `id`, `name`, optional `type` (Monsterart aus der Monsterliste), `x`/`y` in Rasterfeldern ab oberer linker Kartenecke (Tokenmitte), `size` in Rasterfeldern, optional `hp`/`ac`.
- `notes` (optional): `id`, `name`, `kind` (`Schatz`/`Falle`), `x`/`y` (obere linke Ecke), `text`.
- `reveals`: Sichtblöcke `id`, `name`, `x`, `y`, `width`, `height`.

| Datei | Aufgabe |
|---|---|
| `index.html`, `src/main.ts` | Popover, Plan prüfen/aufbauen/entfernen |
| `src/plan.ts` | Plan-Schema (Grenze zwischen Planung und Ausführung) |
| `src/adventure.ts` | Abenteuer-Markdown: Räume, Monster, Schatz/Falle |
| `src/draft.ts`, `src/draft-keys.ts` | Entwurf, Markierungen, Plan erzeugen, Checkliste |
| `src/roster.ts`, `src/stats.ts`, `src/token.ts` | Monsterliste, Upload, Texterkennung, Token-Zuschnitt |
| `src/split.ts`, `src/splitui.ts` | Screenshot in Statblock und Bild zerlegen |
| `src/scene.ts` | Kartengeometrie, Rasterskala, Stat Bubbles, Nummerierung |
| `src/background.ts` | Hintergrund: Markier-Werkzeug, Nummerierung von Kopien |

Testprotokoll: `VERIFICATION.md` · Ziele und Ausbau: `PROJECT_BRIEF.md`

Quellen: [Owlbear-Extension-Doku](https://docs.owlbear.rodeo/extensions/getting-started/) · [Manifest (`background_url`)](https://docs.owlbear.rodeo/extensions/reference/manifest/) · [Stat Bubbles (Metadatenschema)](https://github.com/SeamusFinlayson/Bubbles-for-Owlbear-Rodeo) · `@owlbear-rodeo/sdk` 3.1.0

## Lizenz

MIT – siehe [LICENSE](LICENSE). Kein offizielles Produkt von Owlbear Rodeo, Wizards of the Coast oder D&D Beyond.

---

<a id="english"></a>
# English

**Owlbear Prep turns your adventure text, maps and statblocks into a prepared Owlbear Rodeo scene.** Working prototype, runs locally; the extension UI is German.

**What it does**
- Imports an adventure in Markdown (e.g. a D&D Beyond export): dungeons, numbered areas, monsters per area, treasure and trap sections.
- You mark each area's spots on the player map (hidden markers; Alt+click removes).
- Monster images from disk (auto-cropped tokens), from your Owlbear library, or split from one screenshot that shows statblock and art. HP, AC and size are read by in-browser OCR.
- Builds hidden tokens with HP/AC in [Stat Bubbles for D&D](https://extensions.owlbear.rodeo/bubble-tracker), numbered names, statblocks beside the map and hidden treasure/trap notes. Sizes follow the statblock and the scene grid scale.

**Quick start:** Node.js 22.12+, then `npm ci` and `npm run dev`. In Owlbear: Profile → Extensions → Add Extension → `http://localhost:5173/manifest.json`, open **Prep** as GM and follow the checklist.

**Content:** code only – no adventure texts, maps or art. Use material you own; the local `abenteuer/` folder is git-ignored.

**License:** MIT. Not affiliated with Owlbear Rodeo, Wizards of the Coast or D&D Beyond.
