# Architektur: Sichtsteuerung im Dungeon

Stand: 01.10.2026 · Status: **Plan, nicht umgesetzt** · Entscheidung in 3a, Optimierungen in 3b, Prüfpunkte in 5 und 3c.

## 1. Ziel und Entscheidungsfrage

Der vorbereitete Dungeon soll für Spieler nicht sofort komplett sichtbar sein. Zwei Wege:

| | A · Aufdeckbarer Nebel | B · Wände + Token-Sicht |
|---|---|---|
| Vorbereitung | Bereiche (Räume, Gangabschnitte) als verdeckte Flächen | Wände, Öffnungen, Türen entlang der Battlemap |
| Im Spiel | DM gibt Bereiche gezielt frei | Sicht folgt Tokenposition, Türen, Ecken |
| Erkundetes bleibt sichtbar | ja, solange freigegeben | nur mit „Persistence“ (Smoke & Spectre), nicht mit Owlbear Dynamic Fog |
| Risiko | Freigegebene Bereiche zeigen mehr, als eine Figur gerade sieht | Lücken in Wänden lassen Sicht nach außen |

**Entscheidung für den DM:** Sollen Spieler erkundete Räume weiter sehen (→ A, oder B mit Persistence) oder nur das, was ihre Figuren gerade sehen (→ B ohne Persistence)?

## 2. Geprüfte technische Fakten

Quellen: [Owlbear-Doku Fog](https://docs.owlbear.rodeo/extensions/apis/scene/fog/), [Wall](https://docs.owlbear.rodeo/extensions/reference/items/wall/), [Light](https://docs.owlbear.rodeo/extensions/reference/items/light/), [Dynamic Fog](https://docs.owlbear.rodeo/extensions/reference/dynamic-fog/), Quellcode [owlbear-rodeo/dynamic-fog](https://github.com/owlbear-rodeo/dynamic-fog) (GPL-3.0, Stand 55e22b7), [Smoke & Spectre Store-Seite](https://extensions.owlbear.rodeo/smoke), installiertes `@owlbear-rodeo/sdk` 3.1.0.

1. **Statischer Nebel:** Items auf dem Layer `FOG`. Szenenweit gibt es nur Farbe, Strichstärke und `fog.filled` („Szene ist mit Nebel gefüllt“). Wie gefüllter Nebel und einzelne Nebelformen zusammenwirken (Aussparen? Sichtbarkeit umschalten?), beschreibt die Doku **nicht** → Prüfpunkt P1.
2. **Wände und Lichter (`WALL`, `LIGHT`) sind „Local Only“:** Sie existieren nur lokal auf einem Rechner (`OBR.scene.local`) und werden nicht an Spieler übertragen. Eine Extension muss sie auf **jedem** Client selbst erzeugen. Unsere Extension läuft aber nur beim DM → wir können Dynamic-Fog-Wände **nicht direkt** bauen, sondern nur über eine Nebel-Extension, die bei allen läuft.
3. **Owlbear Dynamic Fog (offizielle Extension):** Jede Zeichnung (Form, Pfad, Kurve, Linie) auf dem Layer `FOG` wird automatisch zur Wand. Türen: Metadaten `rodeo.owlbear.dynamic-fog/doors` an der Zeichnung (Position auf der Kontur). Lichtquellen: Tokens mit `rodeo.owlbear.dynamic-fog/light` (Radius, Winkel, Typ). Keine Erinnerung an erkundete Bereiche.
4. **Smoke & Spectre:** eigene „Obstruction“-Objekte (Linien, Polygone, Türen, Fenster), Sicht pro Spieler-Token, **Persistence** (Erkundetes bleibt), Import von UVTT-Dateien, „Convert to Obstruction“ für normale Owlbear-Zeichnungen. Datenformat **nicht dokumentiert**, Quellcode nicht öffentlich auffindbar.
5. **Konflikt im Bestand:** Unsere bisherigen Sichtblock-Rechtecke liegen auf `FOG` – mit installiertem Owlbear Dynamic Fog würden sie **zu Wänden**.
6. **Verborgene Monster** (`visible:false`) bleiben unabhängig von jedem Nebel verborgen. Aufdecken eines Bereichs macht sie nicht sichtbar – das muss so bleiben.

## 3. Architektur

### 3.1 Gemeinsames Fundament: Raumumrisse

Beide Varianten brauchen dieselbe Information: **die Form jedes Bereichs auf der tatsächlichen Battlemap**. Die DM-Karte liefert nur Zuordnung und Inhalt (welcher Raum, welche Monster), bei abweichender Geometrie keine Koordinaten.

- **Erfassen:** Werkzeug „Umriss zeichnen“ je Bereich – Punkte setzen (mit Rasterfang), Doppelklick schließt. Gänge können eigene Bereiche sein (z. B. „Gang 2→3“).
- **Türen/Öffnungen:** Kanten des Umrisses als Tür oder offene Öffnung markieren.
- **Speichern (Quelle der Wahrheit):** in unseren eigenen Szenen-Metadaten (`de.soenke.owlbear-prep/outline`: Bereich, Punkte in Szenenkoordinaten, Kanten-Typen). Aus diesen Daten werden die Owlbear-Objekte der jeweiligen Variante **erzeugt und wieder entfernt** – nie umgekehrt.
- **Nebeneffekt:** Markierungen und Notizen lassen sich dem Umriss automatisch zuordnen; Monster können innerhalb des Umrisses verteilt werden statt nur um einen Punkt.

```
Abenteuertext ─┐
DM-Karte ──────┼─> Entwurf (Bereiche, Monster, Notizen)
Battlemap ─────┘        │
                        ├─> Markierungen  ─> Plan ─> Tokens, Notizen
                        └─> Umrisse ──┬─> Adapter A: Nebelflächen (aufdeckbar)
                                      ├─> Adapter B1: Owlbear Dynamic Fog (Wände, Türen)
                                      └─> Adapter B2: Smoke & Spectre (nur nach Prüfung)
```

### 3.2 Adapter A – aufdeckbarer Nebel (zuerst)

- Je Bereich eine Nebelfläche (Polygon auf `FOG`) aus dem Umriss; dazu ein Rest-Nebel für alles Übrige (Variante abhängig von P1).
- Popover-Schritt „Sicht“: Liste der Bereiche mit **Aufdecken / Verdecken**; Gänge einzeln.
- Aufdecken ändert nur die Nebelfläche, **nie** Monster-Sichtbarkeit.
- Ersetzt die heutigen Rechteck-Sichtblöcke.
- **Wichtig:** Ist Owlbear Dynamic Fog installiert, würden diese Flächen zu Wänden (Fakt 5). Lösung je nach P1/P3: Nebelflächen dann als Wände *gewollt* nutzen oder Adapter A und B1 nicht gleichzeitig aktivieren (Warnung im Popover).

### 3.3 Adapter B1 – Owlbear Dynamic Fog (danach)

- Umrisskanten → Zeichnungen auf `FOG` (werden automatisch Wände); Türkanten → `doors`-Metadaten nach dem Format aus dem Quellcode.
- Spieler-Tokens brauchen `rodeo.owlbear.dynamic-fog/light` (Sichtweite, z. B. Dunkelsicht 60 ft) – Option im Popover.
- Voraussetzung: Owlbear Dynamic Fog ist im Raum installiert (Extension läuft bei allen Spielern).

### 3.4 Adapter B2 – Smoke & Spectre (nur nach Prüfung)

- Kein dokumentiertes Format. Zwei sichere Wege: (a) normale Owlbear-Zeichnungen erzeugen, DM nutzt „Convert to Obstruction“; (b) Format an einer echten, vom DM gezeichneten Obstruction in der Szene prüfen und nur dann schreiben. **Keine geratenen Fremd-Namespaces** (AGENTS.md).

### 3.5 Was ausdrücklich nicht passiert

- Keine automatische Wanderkennung aus dem Kartenbild (zu unzuverlässig; Wände kommen aus den Umrissen des DM).
- Keine Änderung an Owlbear- oder Fremd-Extension-Daten außer dem jeweils dokumentierten bzw. geprüften Format.
- Kein Aufdecken von Monstern über die Sichtsteuerung.

## 3a. Entscheidung (01.10.2026)

- **Erkundetes bleibt sichtbar.** Der DM deckt bei Bedarf wieder zu.
- **Zuerst die einfachste Lösung: Adapter A (aufdeckbarer Nebel).**
- Dynamische Sicht später nur mit **Owlbear Dynamic Fog** (nativ), nicht mit Smoke & Spectre – Grund: Rendergeschwindigkeit und Komplikationen im Spiel. Adapter B2 entfällt vorerst.

## 3b. Optimierungsideen

### Adapter A – aufdeckbarer Nebel

| Idee | Nutzen | Technische Grundlage | Status |
|---|---|---|---|
| **Aufdecken direkt auf der Karte** per Rechtsklick auf die Nebelfläche („Aufdecken“/„Zudecken“) | kein Wechsel ins Popover während der Sitzung | `OBR.contextMenu.create` mit Filter auf unsere Metadaten | SDK geprüft |
| **Automatisch aufdecken beim Betreten:** betritt ein Spieler-Token einen Raumumriss, wird der Raum aufgedeckt und bleibt es (Schalter, aus = nur manuell) | „Erkundetes bleibt sichtbar“ ohne Handarbeit; keine GPU-Last | `OBR.scene.items.onChange` + `Math2.pointInPolygon` im Hintergrundskript (nur beim GM) | SDK geprüft, Verhalten P6 |
| **Nachbarbereiche optional mit aufdecken** (z. B. Gang vor der Tür) | weniger Klicks bei Gängen | Nachbarschaft aus gemeinsamen Umrisskanten | Idee |
| **Wenige Nebelobjekte:** ein Polygon je Bereich, Punkte auf das Raster gerastet, kollineare Punkte zusammengefasst | schnelleres Zeichnen, sauberere Kanten | eigene Geometrie-Hilfen (testbar ohne Owlbear) | Idee |
| **Grundnebel per `fog.filled`** statt eines riesigen Rest-Polygons – falls die Semantik passt | ein Objekt weniger, keine Lücken am Rand | `OBR.scene.fog.setFilled` | **P1 offen** |
| **„Erkundet, aber niemand da“ abgedunkelt** (halbtransparente Fläche statt ganz offen) | Spieler sehen, wo sie waren, ohne Live-Gefühl | zweite, halbtransparente Fläche auf DRAWING-Layer | Idee, optional |
| **Monster bleiben verborgen** beim Aufdecken; eigener Knopf „Monster in diesem Raum zeigen“ | kein versehentliches Verraten | Monster-Tokens per `planId`/Bereich auffindbar | Regel |
| **Ein Klick „Alles zudecken“** für neue Sitzung/Rücksetzen | schneller Neustart | Batch-Update aller eigenen Nebelflächen | Idee |

### Adapter B1 – Owlbear Dynamic Fog (später)

Grundlage: [Dynamic-Fog-Doku](https://docs.owlbear.rodeo/extensions/reference/dynamic-fog/) (Performance-Abschnitt) und Quellcode der Extension.

| Idee | Nutzen | Grundlage | Status |
|---|---|---|---|
| **Lichter mit `sourceRadius` 0** (harte Schatten) für alle Spieler-Tokens | schneller Renderpfad, viele Lichter möglich | Doku: „faster rendering path … sourceRadius of 0“ | Doku |
| **Keine doppelseitigen Wände** | sonst erzwingt *eine* Wand den langsamen Pfad für alle Lichter | Doku: `doubleSided` → soft path für alle | Doku |
| **Keine sekundären Lichter** (Lagerfeuer o. ä.) oder nur in kleinen Szenen | sekundäre Lichter verdoppeln die Renderzeit | Doku: zweiter Schatten-Pass | Doku |
| **Wenige Wandpunkte:** gemeinsame Kanten benachbarter Räume nur einmal als Wand, Linien vereinfachen | weniger Wände = schneller | Wände entstehen aus jeder Zeichnung auf `FOG` | Idee, P3 |
| **Nur ein Licht je Spieler-Token**, keine Lichter auf Monstern/Requisiten | Last skaliert mit Lichtzahl | Lichter = Tokens mit `rodeo.owlbear.dynamic-fog/light` | Doku/Quellcode |
| **Hybrid für „Erkundetes bleibt sichtbar“:** Dynamic Fog zeigt die aktuelle Sicht, unsere Raum-Nebelflächen werden beim Betreten dauerhaft aufgedeckt (Idee aus Adapter A) | Persistenz, die Owlbear Dynamic Fog selbst nicht hat | `zIndex` ≥ 0 schneidet statischen Nebel weg; Auto-Aufdecken aus A | **P3/P6 offen** |
| **Eine Quelle für Nebel und Wand:** die Raum-Nebelfläche auf `FOG` ist zugleich Wand; Türen über `doors`-Metadaten an derselben Fläche | kein doppelter Aufwand, Tür öffnen in Owlbear | Wände entstehen aus `FOG`-Zeichnungen unabhängig von ihrer Sichtbarkeit (Quellcode `WallReactor`) | **P3 offen** |
| **Messung statt Annahme:** Bildrate in Testszene mit 4 Spieler-Lichtern, 1 Dungeon | belastbare Aussage „schnell genug“ | Browser-Leistungsmessung | P7 |

## 3c. Zusätzliche Prüfpunkte

| Nr | Frage | Wie prüfen |
|---|---|---|
| P6 | Auto-Aufdecken: Erkennt das Hintergrundskript zuverlässig, wenn ein Spieler-Token einen Umriss betritt (auch bei schnellem Ziehen)? Nur Spieler-Tokens, keine Monster? | Testszene, Token ziehen |
| P7 | Bildrate mit Owlbear Dynamic Fog (4 Lichter, Dungeon mit ~10 Räumen) in GM- und Spieler-Browser | Leistungsmessung |

## 4. Testaufbau

- **Spieleransicht:** Raum-Link im eingebauten Browser der Claude-App (getrennt von Chrome, ohne Login als Gast) als Spieler öffnen; GM-Ansicht parallel in Chrome. Das schließt auch die bisher offene Prüfung „sehen Spieler verborgene Monster?“.
- **Testszene:** ein Raum + abknickender Gang + eine Tür (Empfehlung aus dem Auftrag), erst danach ein ganzer Dungeon.

## 5. Technische Prüfpunkte (vor der Umsetzung)

| Nr | Frage | Wie prüfen | Entscheidet |
|---|---|---|---|
| P1 | Wie wirken `fog.filled` und Nebelformen zusammen (Aussparung? Sichtbarkeit umschalten = aufdecken?) | Testszene, GM + Spieler-Ansicht | Bauart Adapter A |
| P2 | Sehen Spieler verborgene Monster/Notizen/Markierungen wirklich nicht – auch unter aufgedecktem Nebel? | Spieler-Ansicht | Freigabe A |
| P3 | Owlbear Dynamic Fog: Werden unsere `FOG`-Polygone zu Wänden, funktionieren Türen per Metadaten, sieht ein Spieler-Token mit Licht korrekt um die Ecke? | Testszene Raum + Gang + Tür, Spieler-Ansicht | Adapter B1 |
| P4 | Smoke & Spectre: Format einer echten Obstruction lesen; funktioniert „Convert to Obstruction“ auf unseren Zeichnungen? | DM zeichnet eine Obstruction, wir lesen sie aus | Adapter B2 ja/nein |
| P5 | Vertragen sich Smoke & Spectre und Owlbear Dynamic Fog in einem Raum? | beide aktiv | Warnhinweis |

## 5a. Ergebnisse P1 und P2 (01.10.2026, live)

Aufbau: GM-Ansicht in Chrome, Spieleransicht als Gast im eingebauten Browser der Claude-App (Beitritt vom GM bestätigt). Testform = schwarzes Rechteck auf `FOG` über der Wasserhöhle; danach Ausgangszustand wiederhergestellt (keine Nebelobjekte, `filled: false`).

**P1 – Nebel-Verhalten (gemessen in der Spieleransicht):**

| `fog.filled` | Testform | Spieler sieht |
|---|---|---|
| aus | sichtbar | dunkles, undurchsichtiges Rechteck – Fläche verdeckt |
| aus | verborgen | nichts – Bereich frei |
| an | verborgen | **alles dunkel außer der Fläche der Form** – verborgene Form wirkt als Fenster |
| an | sichtbar | alles dunkel – Form gibt nichts frei |

**Folgerung für Adapter A:** „Nebel füllen“ an + je Raum eine Form auf `FOG`, die zum **Aufdecken verborgen** wird (dann Fenster) und zum Zudecken wieder sichtbar. Kein Rest-Polygon nötig. Erfüllt die Abnahmekriterien 1 (Karte startet verdeckt), 2 (Räume einzeln freigeben), 3 (Nachbarn bleiben verdeckt).

**P2 – Spieleransicht:** Der Spieler sieht nur die Spielerkarte. Nicht sichtbar: verborgene Monster-Tokens, Stat Bubbles, Statblock-Bilder neben der Karte, Schatz-/Fallen-Notizen, Raummarkierungen, die verborgene DM-Karte, die Ablage unter der Karte. Kriterium 4 (Monster nicht mit aufdecken) ist damit für die heutige Bauweise erfüllt – Aufdecken ändert nur Nebelformen.

**Beobachtungen:**
- Die Spieleransicht im eingebauten Browser übernahm Änderungen teils erst nach Neuladen (vermutlich Hintergrund-Drosselung des Tabs) – Prüfungen deshalb immer mit Neuladen.
- Beim Spieler meldet Owlbear „Unable to load extension: localhost“: unsere Extension (inkl. Hintergrundskript) läuft nur beim GM. Für Adapter A unkritisch.
- Wechselwirkung mit Owlbear Dynamic Fog (Formen auf `FOG` = Wände) weiterhin P3.

## 5b. Abnahmekriterien Adapter A (aus externem Feedback übernommen)

1. Die Karte startet für Spieler vollständig verdeckt.
2. Räume und sinnvolle Gangabschnitte lassen sich einzeln freigeben.
3. Nicht freigegebene Nachbarbereiche bleiben verdeckt.
4. Verborgene Monster werden nicht versehentlich mit aufgedeckt.

## 5c. Wände aus dem Kartenbild?

Automatisches Erkennen von Wänden aus einem Kartenbild ist nicht vorgesehen: unzuverlässig und nicht zu gewährleisten. Wände kommen, wenn überhaupt, aus (a) den vom DM gezeichneten Umrissen oder (b) Kartendateien mit Wanddaten (UVTT/`.dd2vtt`, z. B. aus Dungeondraft; Smoke & Spectre kann solche Dateien importieren). Für offizielle Buchkarten gibt es solche Daten meist nicht – deshalb Adapter A zuerst.

## 6. Reihenfolge

1. ~~Prüfpunkte P1 + P2~~ – erledigt (5a).
2. Raumumrisse erfassen (Werkzeug + Daten, Geometrie-Hilfen mit Tests).
3. Adapter A: Nebel je Bereich, Schritt „Sicht“ im Popover, Rechtsklick Aufdecken/Zudecken, „Alles zudecken“.
4. P6, dann Auto-Aufdecken beim Betreten (Schalter).
5. Später: P3 + P7 an Raum + Gang + Tür, dann Adapter B1 (Owlbear Dynamic Fog) als Hybrid mit Auto-Aufdecken.

## 7. Offene Entscheidungen

- ~~Spielstil~~ → erkundet bleibt sichtbar (3a).
- ~~Nebel-Extension~~ → später Owlbear Dynamic Fog (3a).
- Gänge als eigene aufdeckbare Abschnitte – automatisch vorschlagen oder nur von Hand?
- Auto-Aufdecken beim Betreten standardmäßig an oder aus?
