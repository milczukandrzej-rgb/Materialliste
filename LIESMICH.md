# Sunskin Roof Lap – Materialliste-Tool

Browser-Tool, das aus CAD-Planexporten automatisch eine Materialliste erzeugt.
Läuft lokal im Browser – die Plandaten verlassen den Rechner nicht.

## Unterstützte Dateien
- **PV*Sol-DXF** (Dachaufsicht, Layer `MODULES` etc.)
- **SPT-DWG** (AutoCAD 2018 / AC1032) – Module, Aura-Platten, Aussparungen und
  Schneefang werden direkt gelesen. First und Seitenanschlussprofil sind im SPT
  unzuverlässig und werden im **Kanten-Editor** manuell gesetzt/korrigiert.
- **In CAD nachbearbeitete DWG** (z. B. PV*Sol-Plan, in AutoCAD/ODA gespeichert) –
  Blöcke werden aufgelöst, die Zeichnungseinheit wird automatisch erkannt.

## Dateien (alle im selben Ordner lassen)
- `index.html` – das Tool (hiermit starten)
- `dwg_support.js` – DWG-Leser
- `dist-esm.js`, `wasm-glue.js`, `libredwg-web.wasm` – DWG-Bibliothek (libredwg)

Alle Dateien müssen zusammen im selben Ordner liegen. Das Tool läuft komplett
offline; das WASM (~9 MB) ist die DWG-Lese-Engine.

## Starten
DXF funktioniert per Doppelklick auf die HTML-Datei. **Für DWG** muss die HTML über
einen lokalen Webserver geöffnet werden (Browser-Sicherheit verbietet WASM-Laden
über `file://`). Einfachste Wege:

- VS Code: Erweiterung „Live Server", Rechtsklick auf die HTML → „Open with Live Server".
- Python: im Ordner `python -m http.server` ausführen, dann
  `http://localhost:8000/index.html` öffnen.

## Bedienung
1. DXF oder DWG hineinziehen.
2. Parameter prüfen (Bezugshöhe, Neigung, Ort-Variante, Aura, Schneefang).
   Bei SPT-DWG wird die **Neigung je Dachfläche** automatisch erkannt.
3. Im **Kanten-Editor** First / Traufe / Ort / Grat / Kehle / Schneefang anklicken
   oder per „Freihand" zeichnen. Automatik gilt je Kantentyp, bis der Typ manuell
   markiert wird.
4. Materialliste pro Gebäude prüfen, als Excel/CSV exportieren.

## Aura-Platten
- **Auto-Layout:** Standardbreiten (1380/1940/2770) strikt am Modulraster;
  Störflächen-Zeilen bleiben frei, nichts ragt über die Dachkante.
- **„⬚ Aura bearbeiten":** Platten verschieben (ziehen), Breite/Höhe an den
  Kanten ziehen (rastet auf Standardbreiten und Modulkanten), „+ Platte",
  „– Platte löschen" (oder Entf), „↺ Auto-Layout" stellt die Automatik wieder her.
  Abweichende Masse werden als Zuschnitt aus der nächstgrösseren Platte bestellt.
- **Layer „Aura" in der Datei:** Rechtecke auf einem Layer namens `Aura`
  (DXF oder DWG) werden 1:1 als Platten-Layout übernommen und sind im Editor
  weiter bearbeitbar.

## Schneefang
Automatisch erkannte Schneefang-Linien (SPT-Marker bzw. DXF-Layer `Schneefang`)
fliessen direkt in die Berechnung ein; „Schneefang rechnen" schaltet sich dann
selbst ein. Manuell markierte Schneefang-Kanten (zusätzlich zur Traufe möglich)
ersetzen die Automatik.

Regelbasis: Planung + Ausführung Sunskin Roof Lap, Rev. 01.2025.
