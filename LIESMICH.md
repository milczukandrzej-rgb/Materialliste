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
2. Parameter prüfen (Bezugshöhe, Neigung, Ort-Variante, Aura, Schneefang).
3. Im **Kanten-Editor** First / Traufe / Ort / Grat / Kehle / Schneefang anklicken
   oder per „Freihand" zeichnen. Bei DXF mit EliteCAD-Kantenlayern werden diese
   automatisch übernommen.
4. Materialliste pro Gebäude prüfen, als Excel/CSV exportieren.

Regelbasis: Planung + Ausführung Sunskin Roof Lap, Rev. 01.2025.
