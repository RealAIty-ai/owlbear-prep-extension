# Verifikation v0.1

30.09.2026

- TypeScript-Prüfung: bestanden.
- Vite-Produktionsbuild: bestanden.
- Vier Schema-Tests: bestanden (gültiger Plan, doppelte IDs, ungültige Werte, unbekannte Operationen).
- SDK-Version: 3.1.0; Abhängigkeiten in package-lock.json fixiert.
- Noch NICHT verifiziert: Live-Mutationen in Owlbear, Asset-Uploaddialog, Positionierung, Spieleransicht und Sichtblockverhalten. Hierfür README-Testablauf verwenden.
- Kein Beleg für direkte ChatGPT→Owlbear-Ausführung: v0.1 übergibt den Plan manuell.

## Live-Test Chrome, 30.09.2026 (GM-Ansicht, Testraum „The Held Shame“)

Bestanden:
- Extension über `http://localhost:5173/manifest.json` installiert (nach CORS-Fix in vite.config.mjs), Popover meldet „Mit Owlbear verbunden“.
- Plan aufbauen: 3 verborgene Gegner + Sichtblock angelegt; mit Tokenbild und mit Kreismarker.
- Zweiter Build desselben Plans wird abgewiesen.
- Aufdecken/Verdecken des Sichtblocks schaltet korrekt um.
- „Diesen Plan entfernen“ löscht nur Plan-Elemente, Karte bleibt.

Behoben:
- HP/RK-Beschriftungen waren leer: `buildText()` ist standardmäßig `RICH` mit leerem `richText`. Jetzt `textType('PLAIN')`; Labels live sichtbar.

Offen / beobachtet:
- Positionen beziehen sich auf den Szenenursprung; die Karte liegt nicht dort, Elemente landen oberhalb/links der Karte. Kalibrierter Ursprung nötig.
- Gedrucktes Kartenraster (~3× feiner) passt nicht zum Szenenraster; Karte in Owlbear kalibrieren oder Plan-Einheiten anpassen.
- Labels sind linksbündig ab Tokenmitte, nicht zentriert.
- Popover ist höher als sichtbar; Statusmeldung oben ist beim Klick auf die unteren Buttons nicht im Blick.
- Spieleransicht, Reload/Szenenwechsel und Nicht-GM-Rolle weiterhin NICHT geprüft.

## Live-Test Chrome, 30.09.2026 (2): Kartenursprung + Stat Bubbles

Bestanden:
- Ursprungskarte wird aus dem MAP-Layer gelistet und bei nur einer Karte automatisch gewählt („Oozing Temple Player Version“).
- Plan `prep-demo-02` landet relativ zur oberen linken Kartenecke (Sichtblock ab Feld 1/1 auf der Karte).
- Bild-Tokens zeigen Stat Bubbles mit korrekten Werten (20/20 RK 12, 30/30 RK 13, 40/40 RK 14).

Hinweise:
- Auswahl per Klick auf die Karte funktioniert nicht zuverlässig (Karten sind gesperrt); daher Auswahlliste.
- Spieleransicht der Stat Bubbles (`hide: true`) weiterhin NICHT geprüft.

## Monsterliste mit OCR, 30.09.2026

- 6 Parser-Tests (englisch/deutsch, 2014/2024-Layout, OCR-Rauschen) grün; insgesamt 14 Tests.
- Browser-Test (lokale Seite, ohne Owlbear): Hinzufügen, Statblock-Screenshot mit Platzhalterwerten → OCR erkennt HP 33 / RK 11 und trägt sie ein.
- Tesseract lädt Worker, Core und `eng`-Sprachdaten beim ersten Lesen vom CDN (jsdelivr); der Screenshot bleibt lokal.
- NICHT live geprüft: Upload-Dialog mit mehreren Bildern, ob Owlbear die Asset-Namen „Prep <Monster> Token|Stats“ beibehält, Zuordnung per Mehrfachauswahl, Statblock-Platzierung, Monsterliste in Raum-Metadaten.

## Live-Test Chrome, 30.09.2026 (3): Monsterliste, OCR, Nummerierung

Bestanden:
- OCR mit echtem Statblock-Screenshot (2024-Layout): zuerst „ACS“ statt „AC 8“; nach 2× Hochskalierung + Graustufen und toleranterem Parser: HP 152, RK 8 erkannt.
- Monsterliste „Gray Ooze“ mit Token und Statblock aus Owlbear (vom DM hochgeladen und zugeordnet), in Raum-Metadaten gespeichert.
- Plan mit `type: "Gray Ooze"` baut 2 Bild-Tokens (Stat Bubbles 152/152, RK 8) und 1 verborgenes Statblock-Bild.
- Background-Script wird von Owlbear geladen (`background_url`).

NICHT geprüft:
- Alt+Drag/Duplizieren → Umnummerierung im Stat-Bubbles-Namen (Automatisierung kann Alt+Drag nicht; Ansicht sprang während des Tests).
- Anzeige der Namensschilder (braucht Stat-Bubbles-Einstellung „Name tags“).
- Spieleransicht.
- Upload-Dialog selbst (nur Ergebnis des DM-Uploads gesehen).

Hinweis: Dev-Test-Einstiege (`postMessage`: prepTestFile/prepTestPlan/prepTestClick) existieren nur im Dev-Server, nicht im Build.

## Live-Test Chrome, 30.09.2026 (4): Nummer im Token-Label

- Nummer steht jetzt im Token-Label (Owlbear-Kontextmenü „Name“), nicht mehr im Stat-Bubbles-Namen; Item-Name bleibt der Monstertyp.
- Nach Neuladen: drei Gray-Ooze-Tokens (zwei gebaut, eins vom DM kopiert) tragen eindeutige Labels „Gray Ooze 1/2/3“, Stat Bubbles 152/152 RK 8 sichtbar.
- Frei umbenannte Tokens (Label nicht „<Typ>“/„<Typ> <Nr>“) werden nicht angefasst (Unit-Test).
- Weiterhin NICHT geprüft: Spieleransicht.

## Abenteuertext → Plan, 30.09.2026

- Parser (Markdown im D&D-Beyond-Exportformat): 15 Dungeons in der lokalen Abenteuerdatei; „The Oozing Temple“: Bereiche 1–6, Monster Gray Ooze (je Punkt), Gelatinous Cube + Name Glabbagool, Black Pudding (je Punkt), 4 Gray Ooze. Tests mit eigenem Beispieltext (kein Buchtext im Repo).
- OCR der Raumnummern auf der DM-Karte getestet: unbrauchbar (keine der 11 Nummern erkannt) → Bereiche werden per Klick-Werkzeug markiert.
- Live in Owlbear: Datei geladen, Dungeon übernommen, Bereichsliste angezeigt, Monster in die Monsterliste übernommen.
- Statblock-OCR liest jetzt auch die Größe (Huge → 3 Felder).
- NICHT live geprüft: Markier-Werkzeug (Klick → Punkt), Plan erzeugen, Umrechnung DM-Karte → Spielerkarte, JSON speichern. Voraussetzung: DM-Karte als zweites Kartenbild in der Szene.

## Live-Test Chrome, 30.09.2026 (5): Markieren und Plan erzeugen

- DM-Karte „DM - Der triefende Tempel“ neben der Spielerkarte; per Name automatisch als DM-Karte vorgeschlagen (Fehler behoben: Vorschlag wurde beim Neuzeichnen geleert).
- „Markieren“ springt zur DM-Karte und aktiviert das Werkzeug; 9 Klicks (3× Bereich 2, 4 Grubenfelder, 3, 5) als Punkte gespeichert, verborgene rote Nummern gesetzt. Punkte stimmen mit den Nummernpositionen im Kartenbild überein (Abweichung < 0,005 der Kartenbreite).
- „Plan erzeugen“: 12 Monster (3 Gray Ooze, Glabbagool mit Namen, 4 Black Pudding je Grube, 4 Gray Ooze in 5). Unmarkierte Bereiche landen in einer Ablage unter der Karte statt zu fehlen.
- Beobachtung: Spielerkarte hat Raster-DPI 150 = Szenen-DPI, das gedruckte 5-ft-Raster ist aber ca. 100 px → Tokens erscheinen zu groß. Karte in Owlbear aufs gedruckte Raster kalibrieren.
- NICHT geprüft: Aufbau dieses Plans in der Szene, JSON-Download.
- Aufbau des erzeugten Plans „the-oozing-temple“: 18 Elemente (7 Gray Ooze mit Bild/Label 1–7, 1 Statblock, Cube + 4 Puddings als Kreismarker). Monster liegen in den richtigen Bereichen, aber zu groß/überlappend (Größe 3 für alle aus der Monsterliste + Karte nicht aufs gedruckte Raster kalibriert). Label für benannte Kreismarker korrigiert (Glabbagool).

## Live-Test Chrome, 30.09.2026 (6): neue Szene, kalibrierte Karte

- Neue Szene vom DM angelegt; Spielerkarte auf das gedruckte Raster kalibriert (Bild-DPI 107,2, Versatz), DM-Karte unsichtbar daneben.
- Markieren funktioniert über den echten „Markieren“-Button (Bereich 4: 4 Punkte). Problem war fehlende Rückmeldung → jetzt Owlbear-Meldung je Klick, Statuszeile zählt mit, größere Markierung „Bereich·Nr“.
- Alle Bereiche mit Monstern markiert (2×3, 3, 4×4, 5), Plan mit 12 Monstern erzeugt und aufgebaut (18 Elemente). Alle Monster stehen im richtigen Raum der Spielerkarte.
- Fehler behoben: Tokens rasteten relativ zur Kartenecke ein; jetzt am Szenenraster (wichtig bei verschobener, kalibrierter Karte).
- Offen: Statblock-Bild wird über die Karte gelegt; Cube/Pudding noch mit Gray-Ooze-Werten (Monsterliste).

## Markieren auf der Spielerkarte, 30.09.2026

- Markierungen sind jetzt die Positionsquelle: verborgene, ungesperrte Text-Items (verschieben mit Owlbear-Bewegen-Werkzeug, löschen mit Entf oder Klick im Markier-Werkzeug). Popover zählt live je Bereich.
- „Markieren“ springt zur Spielerkarte; Klicks auf Spieler- oder DM-Karte werden angenommen (DM-Karte über Kartenanteil übertragen).
- Live: Ansicht springt zur Spielerkarte, Markierungen „2·n“ auf der Spielerkarte gesetzt und gezählt.
- Fehler gefunden und behoben: Der gerade markierte Bereich lag in den Szenen-Metadaten und wurde von einem parallel arbeitenden GM überschrieben (Markierungen landeten in Bereich 1). Jetzt pro GM in den Werkzeug-Metadaten.
- Fehler 2: Werkzeug-Metadaten (OBR.tool.setMetadata aus dem Popover) kamen nicht an (getMetadata = undefined) → Meldung „zuerst Markieren“. Jetzt Spieler-Metadaten `de.soenke.owlbear-prep/marking`; live: Bereich 4 markiert („4·1“), Klick auf die Markierung löscht sie („Markierung 4 entfernt“).
- NICHT live geprüft: Verschieben einer Markierung und „Plan erzeugen“ aus Markierungen der Spielerkarte.
