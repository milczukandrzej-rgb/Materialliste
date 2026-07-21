# Sunskin Materialrechner

Browser-Tools, die Materiallisten für Swisspearl-Solarsysteme erzeugen.
Läuft lokal im Browser – die Daten verlassen den Rechner nicht.

**`index.html` ist die Startseite** mit der Auswahl der beiden Rechner:

- **`roof-lap.html`** – Sunskin **Roof Lap** (Dach), Materialliste aus DXF/DWG
- **`facade-flat.html`** – Sunskin **Facade Flat** (Fassade), Materialliste aus
  Fassadenfeldern (siehe Abschnitt am Ende)

# Sunskin Roof Lap – Materialliste-Tool (`roof-lap.html`)

## Unterstützte Dateien
- **PV*Sol-DXF** (Dachaufsicht, Layer `MODULES` etc.)
- **SPT-DWG** (AutoCAD 2018 / AC1032) – Module, Aura-Platten, Aussparungen und
  Schneefang werden direkt gelesen. First und Seitenanschlussprofil sind im SPT
  unzuverlässig und werden im **Kanten-Editor** manuell gesetzt/korrigiert.
- **In CAD nachbearbeitete DWG** (z. B. PV*Sol-Plan, in AutoCAD/ODA gespeichert) –
  Blöcke werden aufgelöst, die Zeichnungseinheit wird automatisch erkannt.

## Dateien (alle im selben Ordner lassen)
- `index.html` – Startseite (Auswahl Roof Lap / Facade Flat)
- `roof-lap.html` – das Roof-Lap-Tool
- `facade-flat.html` – das Facade-Flat-Tool
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
  `http://localhost:8000/roof-lap.html` öffnen.
- Oder über den GitHub-Pages-Link des Repos (dort funktioniert auch DWG).

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
- **Layer „Aura" in der Datei:** Rechtecke auf einem Layer namens Aura
  (DXF oder DWG) werden 1:1 als Platten-Layout übernommen und sind im Editor
  weiter bearbeitbar. Der Name wird ohne Beachtung der Groß-/Kleinschreibung
  erkannt (auch XRef-Namen wie Projekt|Aura und Aura-Platten). Unterstützt
  werden geschlossene LWPOLYLINE/POLYLINE sowie Rechtecke aus vier Linien.

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

Rechner im gleichen Stil für das PV-Fassadensystem **Sunskin Facade Flat**.
Fassaden kommen wahlweise aus dem **PV*Sol-Plan (DXF/DWG-Import)** oder
werden manuell über Breite × Höhe definiert. Öffnet per Doppelklick
(DWG-Import und Excel-einfach brauchen Webserver/Pages-Link bzw. Internet).

## Plan laden (PV*Sol)
- **DXF/DWG der Fassadenansicht** in die Ladezone ziehen. Module
  (780×1940/1380/1010, vertikal/horizontal) werden automatisch erkannt,
  die Zeichnungseinheit ebenso. Layer `MODULES` wird bevorzugt.
- **Fassade auf 2 Pläne verteilt?** Vor dem Laden der zweiten Datei oben
  „mit aktivem Feld zusammenführen (überlagern)" wählen — gleiche
  Koordinaten werden exakt überlagert, Duplikate übersprungen. Alternativ
  „rechts anfügen" (unten bündig). Jede weitere Datei kann auch ein
  eigenes Feld (F2, F3 …) werden.
- Ohne CAD-Plan: „+ Feld manuell" (Breite/Höhe, Modultyp, Anordnung).

## Editor — alles automatisch vorgeplant, alles editierbar
- **Belegung:** Module anklicken/überstreichen → *aktiv*, *inaktiv
  (Blindmodul)*, *Sigma 8 Pro Ergänzungsplatte*, *Aussparung*.
- **Migrationsschutz-K:** per Klick auf einzelne Module setzen/entfernen;
  „Brüstungsfeld" setzt automatisch die unterste Reihe (XL vertikal doppelt).
- **Kanten** (automatisch vorbelegt, per Klick änderbar):
  - *Lüftungsprofil unten/oben* an allen unteren/oberen Kanten — auch an
    Fensteröffnungen (Sturz/Bank).
  - *Kreuzeckblech* an den äussersten Vertikalkanten.
  - *Windabschottungsprofil* wird **nur** an manuell markierten Kanten
    gerechnet (nicht jede Ecke braucht eines); 3 Eckprofilhalter je Profil.
  - „✕ Kante" entfernt eine Zuweisung, „↺ Kanten-Automatik" stellt alles zurück.

## Export
- **NUS-Vorlage ausfüllen** (grüner Knopf): trägt die Mengen mit
  SAP-Nummern direkt in die offizielle Offertvorlage ein
  (`nus-vorlage.xlsx`, Blatt „Basis Sunskin Facade Flat_DE", Spalte
  „Menge") — Preise, Gruppen und kWp rechnet die Vorlage selbst. Bei einer
  neueren NUS-Version einfach die Datei im Dialog wählen; zugeordnet wird
  über die SAP-Nummern in Spalte A.
- **Excel (einfach)** / **CSV**: neutrale Liste mit Spalten je Feld.

## Regelbasis (Doku Rev. 03.2026 + NUS-Artikelstamm)
- Fugenbreite 10 mm systembedingt. U-Agraffe S8 Pro je Einhängepunkt
  (XL 8, L/M 4 je Modul), Befestiger ×2 je Agraffe: SR2 4.8×30 (Holz) bzw.
  Nieten S8 4.8×12 (Alu/Stahl) — gerundet auf 100er-Packs.
- Einhänge-Agraffen, Backrail, Migrationsschutz Flat: werkseitig am Modul.
- Stützlatten 37×60 / Stützprofile 45×60×2 je Einhängespalte (lfm,
  bauseits); EPDM-Band 70 mm +3 % in 25-m-Rollen.
- Lieferlängen: Kreuzeckblech/Windabschottung 2800 mm, Lüftungsprofile
  6650 mm — je Kantenabschnitt aufgerundet.
- Sigma 8 Pro: Zuschnitt im Modulformat, 2 Omegaprofile je Platte
  (980/1350/1540/1910 mm nach Typ), Verbindungsprofil je Stoss.
- Werkzeug (einmalig): Bit SR2 150 mm bzw. Bohrer Ø4.9 Typ A/S,
  Glasheber, Kantenschutz-Set.
