# Sunskin Roof Lap – Materialliste-Tool

Browser-Tool, das aus CAD-Planexporten automatisch eine Materialliste erzeugt.
Läuft lokal im Browser – die Plandaten verlassen den Rechner nicht.

> **Neu:** Für das Fassadensystem gibt es den Schwester-Rechner
> **`facade-flat.html`** (Sunskin Facade Flat) – siehe Abschnitt am Ende.

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
- **Auto-Layout (intelligente Auffüllung):** Standardbreiten (1380/1940/2770)
  strikt am Modulraster; Restlücken ab 400 mm werden mit Zuschnittplatten
  gefüllt, die an Modul- und Störflächenkanten andocken. Nichts ragt über die
  Dachkante.
- **Bestellung mit Abschnitt-Wiederverwendung:** Zuschnittbreiten werden
  nebeneinander aus möglichst wenigen Rohlingen geschnitten; höhenreduzierte
  Platten (≤ 440 mm) zu zweit übereinander aus einem Rohling. Aufsteckprofil
  und Plattenauflager zählen trotzdem **je verbautem Teilstück**. Die Zeile
  „davon aus Abschnitten gedeckt" zeigt die eingesparten Rohlinge.
- **„⬚ Aura bearbeiten":** Platten verschieben (ziehen), Breite/Höhe an den
  Kanten ziehen (rastet auf Standardbreiten, Modul- und Störflächenkanten).
  Klick auf leere Fläche setzt den **Einfügepunkt (×)** — „+ Platte" erzeugt
  die Platte dort (CAD-Prinzip). „– Platte löschen" (oder Entf),
  „↺ Auto-Layout" stellt die Automatik wieder her.
- **Layer „Aura" in der Datei:** Rechtecke auf einem Layer namens `Aura`
  (DXF oder DWG) werden 1:1 als Platten-Layout übernommen und sind im Editor
  weiter bearbeitbar.

## Mehrere Dächer / ein Objekt
Mit **„+ Dach hinzufügen"** (über der Materialliste) weitere DXF/DWG-Dateien
zum selben Objekt laden. Jedes Dach wird als eigenes Gebäude (H1, H2, …)
geführt; die Materialliste zeigt Spalten je Gebäude und die Gesamtsumme —
eine komplette Liste für das ganze Objekt. Hinweis: manuelle Kanten-/Aura-
Änderungen werden beim Hinzufügen zurückgesetzt, daher zuerst alle Dächer
laden, dann bearbeiten.

## Schneefang
Automatisch erkannte Schneefang-Linien (SPT-Marker bzw. DXF-Layer `Schneefang`)
fliessen direkt in die Berechnung ein; „Schneefang rechnen" schaltet sich dann
selbst ein. Manuell markierte Schneefang-Kanten (zusätzlich zur Traufe möglich)
ersetzen die Automatik.

Regelbasis: Planung + Ausführung Sunskin Roof Lap, Rev. 01.2025.

---

# Sunskin Facade Flat – Materialliste-Tool (`facade-flat.html`)

Eigenständiger Rechner im gleichen Stil für das PV-Fassadensystem
**Sunskin Facade Flat**. Kein CAD-Import nötig: Fassadenfelder werden direkt
über Breite × Höhe definiert, das Modulraster wird daraus berechnet.
Öffnet per Doppelklick auf die HTML-Datei (kein Webserver nötig; nur der
Excel-Export braucht Internet fürs SheetJS-CDN, sonst CSV nutzen).

## Bedienung
1. **Fassadenfeld** definieren: Breite/Höhe in mm, Modultyp (XL 780×1940,
   L 780×1380, M 780×1010), Anordnung vertikal/horizontal. Weitere Felder
   (Süd, West, Stockwerke …) mit „+ Feld hinzufügen" — die Liste zeigt
   Spalten je Feld und die Gesamtsumme.
2. **Raster-Editor:** Zellen anklicken/überstreichen und als *Modul aktiv*,
   *Modul inaktiv (Blindmodul)*, *Ergänzungsplatte Sigma 8 Pro* oder
   *Aussparung* (Fenster/Türe) markieren.
3. Optionen je Feld: Lüftungsprofil unten/oben, Brüstungsfeld
   (Migrationsschutz-K), Anzahl Aussen-/Innenecken.
4. Materialliste prüfen, als Excel/CSV exportieren.

## Regelbasis (Planung + Ausführung Sunskin Facade Flat, Rev. 03.2026)
- Fugenbreite 10 mm systembedingt; Raster = Modulmass + Fuge.
- **U-Agraffe S8** je Einhängepunkt: Typ XL 8 Stk/Modul, Typ L/M 4 Stk/Modul.
- Befestigung: 2 Schrauben SR2 4.8×30 (Holz-UK) bzw. 2 Nieten S8 4.8×12
  (Metall-UK) je U-Agraffe; Migrationsschutz Flat mit SR2 bzw. ST 4.2×16.
- Einhänge-Agraffen, Backrail und Migrationsschutz Flat sind werkseitig am
  Modul vormontiert (nur informativ aufgeführt).
- Stützlatten 37×60 (Holz) bzw. Stützprofile 45×60×2 (Metall) je
  Einhängespalte über die volle Feldhöhe; EPDM-Band S8 70 mm vollflächig
  (+3 % Überlappung, Rollen à 25 m).
- Aussenecke: Kreuzeckblech + Windabschottungsprofil Flat (2800 mm) über
  Feldhöhe, 3 Eckprofilhalter je Profil. Lüftungsprofile in 2500-mm-Längen.
- Brüstungsfeld: Migrationsschutz-K S8 je untere Einhängespalte
  (XL vertikal doppelt).
- Ergänzungsplatten Sigma 8 Pro: Largo-8-mm-Zuschnitt im Modulformat mit
  2 Omegaprofilen je Platte (Längen 980/1350/1540/1910 nach Modultyp),
  Verbindungsprofil bei gestossenen Omegaprofilen.
