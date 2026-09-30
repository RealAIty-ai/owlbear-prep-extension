# Owlbear Prep — lokaler technischer Durchstich

Stand: 30.09.2026, v0.1. Persönlicher Prototyp für Sönke.

## In 5 Minuten starten

Voraussetzung: Node.js 22.12+ (empfohlen: Node 24), Owlbear-Konto mit GM-Rolle.

```sh
npm ci
npm run dev
```

1. Owlbear-Profil → Extensions → Add Extension.
2. Installationslink: `http://localhost:5173/manifest.json`.
3. Extension in einem Test-Raum aktivieren, als GM öffnen.
4. Im Prep-Popover lokale Karte wählen → „Kartenszene anlegen“. Owlbear fragt den Zielordner. Danach die neue Szene selbst öffnen und Raster/Skalierung prüfen.
5. Ursprungskarte wählen (Liste der Kartenbilder im MAP-Layer; bei nur einer Karte automatisch). Testplan prüfen. Optional ein bereits in Owlbear gespeichertes Tokenbild wählen (für alle drei Gegner).
6. „Aktuelle Szene ist meine Testszene“ bestätigen → „In aktueller Szene aufbauen“.
7. Drei verborgene Gegner, HP/RK (Stat Bubbles bei Bild-Tokens, sonst Beschriftung) und schwarzen Sichtblock prüfen. Über „Aufdecken“ den Block verbergen. Gegner bei Bedarf separat sichtbar machen.
8. „Diesen Plan entfernen“ entfernt nur Elemente mit der aktuellen Plan-ID, auch nach erneutem Öffnen des Popovers. Die Karte bleibt bestehen.

Der lokale Server läuft auf DEINEM Computer. Ein Server in einer entfernten Coding-Umgebung ist nicht dein localhost. Kein Öffnen per Doppelklick/file://. Falls der Browser eine lokale Netzwerkfreigabe verlangt, für diese Entwicklungsverbindung erlauben. Die Extension muss nur beim DM laufen; Szenenelemente liegen in Owlbear. Verwendete Bilder kommen aus Owlbear, nicht von lokalen Bild-URLs.

## Enthalten / Grenzen

- HTML + TypeScript + Vite + Owlbear SDK; keine KI-API, keine Schlüssel, kein Backend.
- Streng validierter JSON-Plan, bis 100 Gegner und 100 Rechtecke.
- Build in aktueller Szene; separate Anlage einer Kartenszene mit Owlbear-Dialog.
- Optional echtes Tokenbild; sonst Kreismarker. Testzahlen sind erfunden, keine offiziellen Monsterwerte.
- HP/RK in eigenen Metadaten. Bild-Tokens: zusätzlich Stat Bubbles for D&D (`com.owlbear-rodeo-bubbles-extension/metadata`, Felder aus Quellcode v1.9.13 verifiziert, `hide: true`). Kreismarker: verborgene Beschriftung, da Stat Bubbles nur Bild-Items auf CHARACTER/MOUNT liest.
- Gegner verborgen; HP/RK-Beschriftungen erben Sichtbarkeit nicht vom Gegner.
- Sichtblock ist eine schwarze Form auf dem FOG-Layer, kein Dynamic Lighting. Visuelle Abdeckung ist kein Zugriffsschutz. Spieleransicht muss live geprüft werden.
- Eigene Metadaten sind keine sicheren Geheimnisse. Noch keine Schatztexte oder privaten Statblocks implementiert.
- Wiederholtes Bauen desselben Plans wird abgewiesen. Kein Multi-GM-Concurrency-Schutz.
- Kein autonomer Agent, keine direkte ChatGPT-Verbindung, kein Beyond20/Combat, kein Quellenimport.
- Noch keine automatische Raumzuordnung, keine Polygon-Reveals, keine Statblock-Bilder und keine automatische Rasterkalibrierung.
- Positionen in Rasterfeldern ab der oberen linken Ecke der gewählten Karte (unrotiert), Umrechnung anhand aktueller Scene-DPI. Karte muss in Owlbear aufs Raster kalibriert sein. Bildtoken sind zentriert.

## Verifikation

```sh
npm run build
npm test
```

Für einen erfolgreichen End-to-End-Nachweis sind zusätzlich in Owlbear zu prüfen:
- Map bleibt nach Browser-Neustart erhalten.
- Drei Gegner stehen passend zum Raster, Token-Größe stimmt.
- Spieler sehen verborgene Gegner/Statlabels nicht.
- Sichtblock deckt tatsächlich die geplante Kammer ab; Aufdecken funktioniert.
- Gegner sichtbar machen verrät keine HP/RK-Beschriftung.
- Zweiter Build wird abgefangen; Entfernen löscht keine fremden Elemente.
- Reload, Szenenwechsel und Nicht-GM-Rolle funktionieren erwartungsgemäß.

## Weiterentwickeln

Siehe PROJECT_BRIEF.md und AGENTS.md. Keine kommerziellen Abenteuertexte, Buchbilder oder fremden Token ins Repo committen. Eigene Testassets oder offen lizenzierte Materialien verwenden.

Quellen (geprüft 30.09.2026):
- https://docs.owlbear.rodeo/extensions/getting-started/
- https://docs.owlbear.rodeo/extensions/tutorial-hello-world/install-your-extension/
- https://docs.owlbear.rodeo/extensions/apis/assets/
- https://docs.owlbear.rodeo/extensions/reference/builders/image/
- Installierte Typen des offiziellen @owlbear-rodeo/sdk 3.1.0
