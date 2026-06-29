# Sunskin Roof Lap – Materialliste-Tool

Browser-Tool, das aus CAD-Planexporten automatisch eine Materialliste erzeugt.
Läuft lokal im Browser – die Plandaten verlassen den Rechner nicht.

## Unterstützte Dateien
- **PV*Sol-DXF** (Dachaufsicht, Layer `MODULES` etc.)
- **SPT-DWG** (AutoCAD 2018 / AC1032) – Module, Aura-Platten, Aussparungen und
  Schneefang werden direkt gelesen. First und Seitenanschlussprofil sind im SPT
  unzuverlässig und werden im **Kanten-Editor** manuell gesetzt/korrigiert.

## Dateien (alle im selben Ordner lassen)
- `sunskin_materialliste.html` – das Tool (hiermit starten)
- `dwg_support.js` – DWG-Leser (SPT)
- `dist-esm.js`, `wasm-glue.js`, `libredwg-web.wasm` – DWG-Bibliothek (libredwg)

Alle fünf Dateien müssen zusammen im selben Ordner liegen. Das Tool läuft komplett
offline; das WASM (~9 MB) ist die DWG-Lese-Engine.

## Starten
DXF funktioniert per Doppelklick auf die HTML-Datei. **Für DWG** muss die HTML über
einen lokalen Webserver geöffnet werden (Browser-Sicherheit verbietet WASM-Laden
über `file://`). Einfachste Wege:

- VS Code: Erweiterung „Live Server", Rechtsklick auf die HTML → „Open with Live Server".
- Python: im Ordner `python -m http.server` ausführen, dann
  `http://localhost:8000/sunskin_materialliste.html` öffnen.

## Bedienung
1. DXF oder DWG hineinziehen.
2. Parameter prüfen:
   - Bei DWG: **Neigung je Dachfläche** wird automatisch aus der 3D-Geometrie
     erkannt und ist pro Fläche editierbar (bestimmt Schneefang-Typ je Fläche).
   - Bezugshöhe, Ort-Variante, Aura, Schneefang.
3. In der **Vorschau** mit Mausrad oder +/−/⤢-Buttons zoomen, ziehen zum Verschieben.
   Die erkannte **Firstlinie** ist rot gestrichelt eingezeichnet.
4. Im **Kanten-Editor** First / Traufe / Ort / Grat / Kehle / Schneefang anklicken
   oder per „Freihand" zeichnen. Die automatische First-Erkennung kann hier
   überschrieben werden.
5. Materialliste pro Gebäude prüfen, als Excel/CSV exportieren.

## Was das Tool aus der SPT-DWG liest
- Module (Typ XL/L/M) und Aura-Platten exakt aus den platzierten Blöcken.
- Dachflächen, Umriss und **Firstlinie** aus der 3D-Dachgeometrie (RoofArea).
- **Neigung je Dachfläche** aus den Höhenkoordinaten.
- First-Komponenten **adaptiv**: je Firstabschnitt 2770 oder 1940, je nach Länge.

Regelbasis: Planung + Ausführung Sunskin Roof Lap, Rev. 01.2025.
