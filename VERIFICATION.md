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
