# Owlbear Prep — Szenenvorbereitung für Owlbear Rodeo

Stand: 30.09.2026. Persönlicher Prototyp für Sönke, läuft lokal über den Vite-Dev-Server. Nicht veröffentlicht.

Aus Abenteuertext, offizieller Spieler- und DM-Karte sowie eigenen Token- und Statblock-Bildern entsteht eine vorbereitete Owlbear-Szene: verborgene Monster mit Stat Bubbles, Statblocks daneben, nummerierte Namen.

## In 5 Minuten starten

Voraussetzung: Node.js 22.12+ (empfohlen: Node 24), Owlbear-Konto mit GM-Rolle, empfohlen die Extension „Stat Bubbles for D&D“.

Hinweis Windows: Liegt der Projektordner in einem Pfad mit `&` (z. B. `D:\D&D\…`), scheitert `npm run dev`. Ordner verschieben oder `node node_modules/vite/bin/vite.js` direkt starten.

```sh
npm ci
npm run dev
```

1. Owlbear-Profil → Extensions → Add Extension, Installationslink `http://localhost:5173/manifest.json`. Extension im Raum aktivieren und als GM öffnen („Prep“ in der oberen Leiste).
2. **Karten:** Spielerkarte als Szene (ggf. über „Spielerkarte als neue Szene anlegen“), Raster auf die gedruckten Kästchen ausrichten. DM-Karte mit Raumnummern als zweites Kartenbild daneben legen und unsichtbar machen. Im Popover beide Karten auswählen.
3. **Abenteuer:** Abenteuerdatei (Markdown, D&D-Beyond-Export) wählen, Dungeon übernehmen. Pro Raum Monster/Anzahl prüfen; mit „Markieren“ jede Stelle des Raums auf der **Spielerkarte** anklicken (roter Punkt, für Spieler verborgen). Alt+Klick auf einen Punkt löscht ihn, verschieben mit dem Bewegen-Werkzeug. Die Checkliste oben im Popover zeigt, was noch fehlt.
4. **Monster:** „Monster aus dem Abenteuer übernehmen“, je Monster Tokenbild und Statblock-Screenshot wählen (HP/RK/Größe werden gelesen, prüfen), „Bilder in Owlbear hochladen“ und im Auswahldialog die „Prep …“-Bilder markieren.
5. **Plan:** „Plan erzeugen“ (optional als JSON speichern oder ansehen/einfügen).
6. **Aufbauen:** Szene bestätigen, „In dieser Szene aufbauen“. Alles ist verborgen; „Plan entfernen“ löscht nur Elemente dieses Plans. Duplikate (Alt+Drag) werden automatisch weiter nummeriert.

Der lokale Server läuft auf DEINEM Computer. Ein Server in einer entfernten Coding-Umgebung ist nicht dein localhost. Kein Öffnen per Doppelklick/file://. Falls der Browser eine lokale Netzwerkfreigabe verlangt, für diese Entwicklungsverbindung erlauben. Die Extension muss nur beim DM laufen; Szenenelemente liegen in Owlbear. Verwendete Bilder kommen aus Owlbear, nicht von lokalen Bild-URLs.

## Was die Extension kann

**Live in Owlbear geprüft** (Details in VERIFICATION.md):
- Popover mit 5 Schritten: Karten → Abenteuer → Monster → Plan → Aufbauen. Statuszeile bleibt beim Scrollen sichtbar.
- **Karten:** Spieler- und DM-Karte aus den Kartenbildern der Szene wählen; Vorschlag anhand des Namens („player/spieler“, „dm“). Positionen werden relativ zur oberen linken Kartenecke gerechnet.
- **Abenteuertext:** Markdown im D&D-Beyond-Exportformat laden. Dungeons = Abschnitte mit nummerierten Bereichen („### 2. Name“), Monster = kleingeschriebene Fettungen, Eigennamen = großgeschriebene. Anzahl aus Zahlwörtern, „each“ = ein Monster je markierter Stelle. Alles ist ein bearbeitbarer Vorschlag.
- **Bereiche markieren:** Werkzeug „Prep: Bereiche markieren“ in der Owlbear-Werkzeugleiste. Klicks auf die DM-Karte werden als Kartenanteil gespeichert und mit einer verborgenen roten Nummer quittiert. Die Ansicht springt beim Markieren zur DM-Karte.
- **Monsterliste** (im Raum gespeichert): je Monster Tokenbild und Statblock-Screenshot. HP, RK und Größe per OCR (tesseract.js im Browser; beim ersten Mal werden die Erkennungsdaten vom CDN jsdelivr geladen, der Screenshot bleibt lokal). Werte sind editierbar.
- **Bilder hochladen:** ein Owlbear-Upload-Dialog für alle Bilder; Zuordnung über die Asset-Namen „Prep <Monster> Token|Stats“.
- **Plan erzeugen:** Monster je markierter Stelle, auf die Spielerkarte umgerechnet (gleiche Geometrie von DM- und Spielerkarte vorausgesetzt), nach Größe verteilt. Nicht markierte Bereiche landen in einer Ablage unter der Karte. Plan als JSON speicherbar.
- **Aufbauen:** Bild-Tokens verborgen auf CHARACTER mit Stat Bubbles (HP/RK, für Spieler verborgen); Statblock einmal je Monsterart als verborgenes Bild daneben; Monster ohne Bild als Kreismarker mit verborgener HP/RK-Beschriftung. Name im Token-Label: „Gray Ooze 1“, „Gray Ooze 2“ …, benannte Einzelmonster (z. B. Glabbagool) mit ihrem Namen.
- **Nummerierung im Hintergrund:** Kopien eigener Monster (Alt+Drag, Duplizieren) bekommen die nächste freie Nummer, auch bei geschlossenem Popover; nur beim GM, frei umbenannte Tokens bleiben unangetastet.
- **Sicherheit der Szene:** Zweiter Aufbau desselben Plans wird abgewiesen; „Plan entfernen“ löscht nur Elemente dieses Plans. Sichtblöcke (Rechtecke auf dem FOG-Layer) lassen sich aufdecken/verdecken.

**Gebaut, aber nicht live geprüft:** Spieleransicht (verborgene Tokens, Stat Bubbles, Statblocks), JSON-Download, Umbenennungsschutz, Nicht-GM-Rolle.

## Plan-Format (JSON, Version 1)

`{version:1, id, name, monsters:[…], reveals:[…]}`, Schema in `src/plan.ts`, streng validiert (max. 100 Monster/100 Sichtblöcke, eindeutige IDs).
- Monster: `id`, `name`, optional `type` (Monsterart aus der Monsterliste), `x`/`y` in Rasterfeldern ab oberer linker Ecke der Spielerkarte (Tokenmitte), `size` in Feldern, optional `hp`/`ac` (Rückfallwerte, sonst aus der Monsterliste).
- Sichtblöcke: `id`, `name`, `x`, `y`, `width`, `height` in Rasterfeldern.

## Grenzen

- Keine KI-API, keine Schlüssel, kein Backend. Texterkennung und Parser sind regelbasiert; Ergebnisse immer prüfen.
- Raumnummern auf Karten erkennt die OCR nicht (getestet) – deshalb Markieren per Klick.
- Die Karte muss in Owlbear auf das gedruckte Raster ausgerichtet sein, sonst stimmen Tokengrößen und Abstände nicht.
- DM- und Spielerkarte müssen dieselbe Geometrie haben (offizielle Kartenpaare); eigene Battlemaps mit anderem Grundriss werden nicht automatisch zugeordnet.
- Verborgen ist kein Geheimnisschutz: Verborgene Items und Metadaten liegen in den Szenendaten.
- Noch nicht umgesetzt: Notes für Schätze/Fallen, Sichtbereiche je Raum und als freie Formen, Luft-/Wasser-Tracker, Kampfablauf.
- Stat-Bubbles-Anbindung nutzt deren Metadatenschema (`com.owlbear-rodeo-bubbles-extension/metadata`, aus Quellcode v1.9.13); ändert sich die Extension, muss `src/scene.ts` angepasst werden.
- Kein Multi-GM-Schutz; Abenteuertexte und Buchbilder gehören nur in den ignorierten Ordner `abenteuer/`.

## Aufbau

| Datei | Aufgabe |
|---|---|
| `index.html`, `src/main.ts` | Popover, Plan prüfen/aufbauen/entfernen, Sichtblöcke |
| `src/plan.ts` | Plan-Schema (Grenze zwischen Planung und Ausführung) |
| `src/adventure.ts` | Parser für Abenteuer-Markdown |
| `src/draft.ts`, `src/draft-keys.ts` | Dungeon-Entwurf, Bereiche, Plan erzeugen |
| `src/roster.ts`, `src/stats.ts` | Monsterliste, Bild-Upload, OCR und Statblock-Parser |
| `src/scene.ts` | Kartengeometrie, Verteilung, Stat Bubbles, Nummerierung (ohne Owlbear testbar) |
| `src/background.ts`, `background.html` | Hintergrundskript: Markier-Werkzeug, Nummerierung von Kopien |

## Verifikation

```sh
npm run build
npm test
```

Noch offen für einen vollständigen End-to-End-Nachweis in Owlbear:
- Spieler sehen verborgene Monster, Stat Bubbles, Statblocks und Markierungen nicht.
- Tokengrößen stimmen nach Rasterkalibrierung der Spielerkarte.
- Reload, Szenenwechsel und Nicht-GM-Rolle verhalten sich erwartungsgemäß.

## Weiterentwickeln

Siehe PROJECT_BRIEF.md und AGENTS.md. Keine kommerziellen Abenteuertexte, Buchbilder oder fremden Token ins Repo committen. Eigene Testassets oder offen lizenzierte Materialien verwenden.

Quellen (geprüft 30.09.2026):
- https://docs.owlbear.rodeo/extensions/getting-started/
- https://docs.owlbear.rodeo/extensions/tutorial-hello-world/install-your-extension/
- https://docs.owlbear.rodeo/extensions/apis/assets/
- https://docs.owlbear.rodeo/extensions/reference/builders/image/
- https://docs.owlbear.rodeo/extensions/reference/manifest/ (`background_url`)
- https://github.com/SeamusFinlayson/Bubbles-for-Owlbear-Rodeo (Stat-Bubbles-Metadaten, v1.9.13)
- Installierte Typen des offiziellen @owlbear-rodeo/sdk 3.1.0 (Tool-, Viewport-, Assets-API)
