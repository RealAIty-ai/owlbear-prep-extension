# Owlbear Prep — Projektauftrag v0.1

## Ziel und Nutzer
Sönke ist Dungeon Master für D&D 2024. Aus seinen bereitgestellten Materialien soll eine spielbereite Owlbear-Szene entstehen. Der Agent übernimmt Zuordnung und Produktionsarbeit; Sönke entscheidet über Dramaturgie, Encounter-Anpassungen und Freigabe. Erst persönliche Nutzung; Veröffentlichung später separat entscheiden.

## Beobachteter Workflow
1. Browser-Tabgruppe mit ChatGPT, D&D Beyond, Charakterblättern und Owlbear öffnen.
2. Abenteuer lesen, Original-DM-Karte und alternative Battlemap zusammenbringen.
3. Räume zwischen beiden Karten semantisch zuordnen; Geometrie kann abweichen.
4. Spieler-, NPC- und Monstertoken beschaffen oder mit ChatGPT aus Referenzen erzeugen.
5. Monster nach Raum platzieren, HP/RK für die Stat-Extension eintragen.
6. Statblock-Ausschnitte neben die Kampfkarte legen; Original-DM-Karte als Referenz behalten.
7. Raumweise schwarze Sichtflächen bauen, manuell während des Spiels auflösen.
8. Verborgene Ortsnotizen für Schätze, Fallen und Umweltgefahren anlegen.
9. Monsterverhalten verstehen und Begegnungen an die Gruppe anpassen.
10. Initiative/Kampf durchführen; diese Laufzeitautomatisierung ist ein späteres, separates Modul.

Referenzfall: Triefender Tempel, Out of the Abyss. Vier SC auf Stufe 6, vom DM angepasste Schleimbegegnungen und Wasserflucht. Monsterzahlen/Statwerte/Balance sind hier NICHT quellengeprüft und dürfen nicht aus Gesprächsbeispielen als Regeln übernommen werden.

## Entscheidung: kleinste tragfähige Verbindung
Jetzt: ChatGPT erzeugt JSON → Sönke kopiert den Plan → lokales Owlbear-Popover validiert → CTA baut Items über SDK.
Eine HTML-Datei allein hat keinen Zugriff auf den anderen Browser-Tab. Die HTML-Anwendung muss als Extension in Owlbear eingebettet sein. manifest.json beschreibt diese Einbettung. Vite stellt sie auf localhost bereit.

Das ist ein Test der Executor-Strecke, noch KEIN Nachweis für eine autonome ChatGPT→Owlbear-Verbindung. Kein Serverdienst und kein MCP nötig für diesen ersten Test.

Später: Agent/MCP → authentifizierte Befehlswarteschlange → laufende Owlbear-Extension → derselbe validierte Plan. Das Owlbear-SDK ist eine Schnittstelle im laufenden Owlbear-Client, keine universelle serverseitige Konto-API. Hosting allein schafft weder Benutzerisolation noch Agentenzugriff. Pairing, Raum-/GM-Bindung, Ablaufzeiten, Replay-Schutz und Freigaben sind dann nötig.

## Umfang v0.1 (implementiert)
- Neue Szene aus lokaler Karte über offiziellen Uploaddialog; Nutzer öffnet diese anschließend.
- JSON-Plan v1: id, name, monsters, reveals; Schema steht in src/plan.ts.
- Drei Demonstrationsgegner, wahlweise Asset-Bild oder Kreismarker.
- HP/RK in eigenem Namespace; bei Bild-Tokens zusätzlich Stat Bubbles, sonst verborgene Beschriftungen.
- Plan-Koordinaten relativ zur gewählten Ursprungskarte.
- Rechteckiger schwarzer Sichtblock mit Aufdecken/Verdecken.
- GM-Prüfung, Eingabevalidierung, Doppelklick-Sperre, Duplikatprüfung und gezieltes Entfernen.

## Akzeptanzgate
Compiler/Build und Schema-Tests müssen grün sein. Danach echter Owlbear-Test mit GM- und Spieleransicht gemäß README. Ohne diesen Test kein „funktioniert End-to-End“ behaupten. Für den späteren Agenten muss zusätzlich eine echte autorisierte Tool-Ausführung vom Chat bis zur Szene nachgewiesen werden.

## Nächste kleine Schritte
1. Live-Test mit Sönke, Koordinaten/Raster/Formanker korrigieren falls nötig.
2. Reale Tempel-Battlemap und drei konkrete Platzierungen; Bildauswahl pro Asset, kalibrierter Ursprung.
3. Stat-Bubbles-Version und dokumentiertes/öffentliches Metadatenschema prüfen, optionalen Adapter bauen; nie fremde Namespaces raten.
4. Referenz-DM-Karte, Statblock-Bilder, verborgene Notes und Polygon-Reveals ergänzen; Spieleransicht prüfen.
5. Agentenbrücke als eigenen vertikalen Test ergänzen, sobald der Executor zuverlässig ist.
6. Quellenanalyse, Bildgenerierung und Raumzuordnung als Plan-Erzeuger aufsetzen.

## Repo und Veröffentlichung
Lokales Git-Repo jetzt sinnvoll, auch privat. Remote-Vorschlag: privates GitHub-Repo `owlbear-prep`. Kein Remote eingerichtet, kein öffentlicher Release. Vor öffentlicher Veröffentlichung Lizenz wählen und Abhängigkeiten/Assetrechte prüfen. Das Repo enthält ausschließlich Code und eigene technische Beispiele. Keine Secrets oder Abenteuerinhalte. Öffentliche Extension benötigt erreichbares HTTPS-Hosting; lokale/private Nutzung braucht keinen Katalogeintrag.

## Auftrag an einen KI-Code-Assistenten
„Lies PROJECT_BRIEF.md, README.md, AGENTS.md und src/plan.ts. Führe npm ci, npm run build und npm test aus. Beginne mit dem dokumentierten Owlbear-Live-Test und behebe konkret beobachtete Fehler. Erhalte den schlanken lokalen Aufbau. Erweitere in kleinen Schritten entlang der obigen Reihenfolge. Behaupte keine ungetestete API-, Stat-Bubbles- oder Agentenintegration. Halte implementiert, getestet und geplant getrennt. Veröffentliche keine privaten Materialien.“

## Offene Entscheidungen
- Zielrepo/Account und spätere Lizenz.
- Konkrete Stat-Bubbles-Extension und Version.
- Referenzkarte, Rastermaß, Ursprung und Tokenmaterial für echten Test.
- Ob Copy/Paste schon genug Nutzen bringt oder direkte Agentenanbindung erforderlich ist.
