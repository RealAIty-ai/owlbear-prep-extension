# Architektur: Sichtsteuerung im Dungeon

Stand: 01.10.2026 · Status: **Plan, nicht umgesetzt** · Prüfpunkte siehe Abschnitt 5.

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

## 6. Reihenfolge

1. Prüfpunkte P1 + P2 (klein, ohne Code-Umbau).
2. Raumumrisse erfassen (Werkzeug + Daten).
3. Adapter A: aufdeckbarer Nebel je Bereich, Schritt „Sicht“ im Popover.
4. Prüfpunkt P3, dann Adapter B1 an Raum + Gang + Tür, dann ganzer Dungeon.
5. P4/P5 und ggf. Adapter B2.

## 7. Offene Entscheidungen

- Spielstil: erkundete Räume sichtbar lassen oder nur aktuelle Sicht? (Abschnitt 1)
- Welche Nebel-Extension im Raum: Owlbear Dynamic Fog oder Smoke & Spectre (bereits installiert)?
- Gänge als eigene aufdeckbare Abschnitte – automatisch vorschlagen oder nur von Hand?
