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
