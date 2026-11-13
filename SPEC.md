# SPEC.md: Kopfrechnen 60s (PWA)

Verbindliches Architektur- und Entwicklungsgesetzbuch für `/Users/benkovert/kopfrechen-pwa`.
Jede Änderung am Code oder an der Oberfläche muss alle hier definierten Verträge einhalten.

## 1. System-Struktur

Die Anwendung ist eine leichtgewichtige Progressive Web App (PWA) für das iPhone ohne Build-Schritt oder externe Runtime-Abhängigkeiten (reines ES-Module-JavaScript).

### Die 4 Hauptbausteine

1. **`storage.js` (Datenschicht)**
   Kapselt das Lesen und Schreiben des Nutzerprofils hinter den asynchronen Funktionen `loadUserData()` und `saveUserData(data)`. Aktuell wird `globalThis.localStorage` unter dem Schlüssel `kopfrechen_user_data_v1` verwendet. Durch die asynchrone Schnittstelle lässt sich der Speicher später ohne Umbau von `engine.js` oder `ui.js` auf ein Backend (z. B. Supabase) umstellen.

2. **`engine.js` (Logikschicht / Headless Core)**
   Reines JavaScript für alle fachlichen Regeln ohne Browser-Bezug. Definiert die Spieldauer (`GAME_DURATION_SECONDS = 60`), die vier Aufgabenkategorien (`CATEGORIES`: `Quadratzahlen` bis `25²`, `Potenzen`, `Lineare Gleichungen`, `Prozentrechnung`) und 10 Fun-Facts (`MATH_FUN_FACTS`). Stellt `getDifficultyForScore`, `generateQuestion`, `checkAnswer`, `getLocalDateString`, `updateUserProfile` und `getRandomFunFact` bereit.

3. **`ui.js` (Präsentationsschicht)**
   Verbindet `index.html`, `engine.js` und `storage.js`. Verwaltet den Sitzungszustand (`isPlaying`, `timeLeft`, `timerId`, `score`, `attempts`, `currentQuestion`, `inputBuffer`, `userProfile`), bindet Klick- und Tastatur-Events (`#btn-start`, `#btn-replay`, `#btn-home`, `#keypad`, `keydown`), steuert das 1-Sekunden-Timer-Intervall, registriert den Service Worker (`./sw.js`) und überträgt Spielzustände ausschließlich über Textinhalte, funktionale Progress-Werte und semantische `data-*`-Attribute in das DOM.

4. **`index.html` (Struktur, PWA-Meta und Defensives CSS)**
   Enthält die semantische HTML-Struktur für die drei Ansichten (`#screen-start`, `#screen-game`, `#screen-end`), die iOS/PWA-Metadaten (`viewport-fit=cover`, `apple-mobile-web-app-capable`), den zentralen `<style>`-Block für Layout, Fallbacks und Zustandsübersetzung sowie den Module-Einstiegspunkt `<script type="module" src="./ui.js"></script>`.

### Test-, PWA- und Spiegeldokumente

- **`tests.mjs`**: Automatisierte Testsuite für `node --test tests.mjs`. Prüft neben den Rechen-, Streak- und Speicherfunktionen per Quelltext-Analyse auch die Einhaltung der Architektur-Gesetze (Headless Core, Storage-Kapselung, State-Driven UI und Defensives CSS).
- **`sw.js`**: Service Worker (`CACHE_NAME = 'kopfrechen-v2'`). Cached bei Installation die App-Shell (`./`, `./index.html`, `./ui.js`, `./engine.js`, `./storage.js`, `./manifest.json`, `./icon.svg`) sowie bestmöglich `https://cdn.tailwindcss.com` per `no-cors`-Fetch (`res.ok || res.type === 'opaque'`, abgesichert in `try/catch`). Nutzt für `https://cdn.tailwindcss.com` Cache-First / Stale-While-Revalidate mit Hintergrund-Update und für lokale `GET`-Anfragen Network-First (`ok && type === 'basic'`) mit Offline-Cache-Fallback.
- **`manifest.json`**: Web App Manifest für die Installation auf dem Homescreen (`display: "standalone"`, `orientation: "portrait"`, `start_url: "./index.html"`, Farben `#020617`).
- **`icon.svg`**: Quadratisches Vektor-App-Icon (`512x512` mit `x²`-Motiv auf dunklem Grund).
- **`CODE_SPIEGEL.md`**: Synchronisierter Volltext-Spiegel der Kerndateien im Projektordner für schnellen Kontextabgleich und externe Reviews. Wird vor jedem Commit automatisch über `tools/update-spiegel.mjs` aktualisiert.
- **`tools/update-spiegel.mjs` & Git-Hooks**: Erstellt `CODE_SPIEGEL.md` neu (`--code`, eingebunden in `.git/hooks/pre-commit`) und spiegelt den Projektordner per `rsync` ohne `.git/` und `node_modules/` nach Google Drive (`--drive`, eingebunden in `.git/hooks/post-commit`). Die versionierten Vorlagen bzw. Sicherheitskopien beider Hooks liegen in `tools/git-hooks/`. Zusätzlich läuft der zentrale Mac-Spiegel `drive-spiegel.sh` um 09:00 und 19:00 Uhr.
- **`Start-Lokal.command`**: Ausführbarer Doppelklick-Starter für den macOS Finder. Wechselt in `/Users/benkovert/kopfrechen-pwa`, prüft Port `8080`, startet bei Bedarf `python3 -m http.server 8080` im Hintergrund und öffnet `http://localhost:8080` im Standardbrowser.

---

## 2. Strikte Architektur-Gesetze

### Gesetz 1: Headless Core (`engine.js`)

`engine.js` ist zu 100 Prozent frei von Browser-, DOM- und Speicherzugriffen.

- **Verbotene Bezeichner in `engine.js`**: `document`, `window`, `localStorage`, `querySelector`, `getElementById`.
- **Reine Ein- und Ausgaben**: Funktionen nehmen schlichte Werte entgegen und geben saubere JSON-kompatible Objekte zurück (Zufallszahlen und Datum sind über `randomFn` und `todayStr` injizierbar).
- **Aufgaben-Vertrag (`generateQuestion`)**: Liefert exakt `{ id, category, questionText, correctAnswer, difficulty }` mit ganzzahligem `correctAnswer >= 0` und `difficulty` im Bereich `1..3`.

### Gesetz 2: Speicher-Kapselung (`storage.js`)

`storage.js` verwaltet ausschließlich das Laden, Normalisieren und Speichern des Nutzerprofils.

- **Verbindliche Exports**: `async loadUserData()` und `async saveUserData(data)`.
- **Verbindliches Datenmodell**: Exakt die drei Felder `streak` (Ganzzahl `>= 0`), `highScore` (Ganzzahl `>= 0`) und `lastPlayedDate` (`YYYY-MM-DD`-String oder `null`).
- **Fehlertoleranz**: Altdaten mit kleingeschriebenem `highscore` werden beim Laden auf `highScore` migriert; defektes JSON oder ungültige Werte fallen sicher auf `{ streak: 0, highScore: 0, lastPlayedDate: null }` zurück.
- **Verbot in `storage.js`**: Kein Zugriff auf `document`.

### Gesetz 3: State-Driven UI Gesetz (`ui.js`)

`ui.js` trennt Logiksteuerung strikt von visueller Gestaltung und direkter Datenhaltung.

- **Verboten in `ui.js`**:
  - Visuelle Tailwind-Farb-, Sichtbarkeits- oder Animationsklassen im JavaScript-Code (z. B. `bg-rose-500`, `bg-sky-400`, `text-rose-400`, `text-slate-500`, `text-white`, `ring-emerald-400`, `ring-rose-500`, `animate-shake`, `animate-pop`, `hidden`, `flex`).
  - Jede Verwendung von `classList` oder `className` zum Umschalten von Zuständen.
  - Jeder direkte Aufruf von `localStorage` (Zugriffe laufen nur über `storage.js`).
- **Verbindlicher `data-*`-Vertrag**: `ui.js` schreibt ausschließlich semantische Daten-Attribute in das DOM (plus Textwerte über `textContent` und die prozentuale Balkenbreite auf `#game-progress`):
  - `document.body.dataset.screen = "start" | "game" | "end"` (HTML-Attribut `data-screen` auf `<body>`): Steuert, welcher der drei Screens (`#screen-start`, `#screen-game`, `#screen-end`) sichtbar ist.
  - `els.gameTimer.dataset.state = "normal" | "low"` und `els.gameProgress.dataset.state = "normal" | "low"` (`data-state`): Steht auf `"low"`, sobald `timeLeft <= 10` Sekunden beträgt, sonst auf `"normal"`.
  - `els.questionCard.dataset.feedback = "none" | "correct" | "wrong"` (`data-feedback`): Zeigt auf `#question-card` das kurze Feedback nach einer Antwort an und kehrt danach zu `"none"` zurück.
  - `els.answerDisplay.dataset.empty = "true" | "false"` (`data-empty`): Markiert, ob der Eingabepuffer leer ist (Platzhalter `_`) oder Ziffern enthält.
  - `els.endHighscoreBadge.dataset.visible = "true" | "false"` (`data-visible`): Steuert auf dem Endbildschirm die Sichtbarkeit des Badges `Neuer Highscore`.

### Gesetz 4: Defensives CSS Gesetz (`index.html`)

Alle visuellen Zustände und Layout-Schutzmechanismen liegen gebündelt im `<style>`-Block von `index.html`.

- **Zustands-Übersetzung im `<style>`-Block**: CSS-Selektoren auf `body[data-screen="..."]`, `#game-timer[data-state="..."]`, `#game-progress[data-state="..."]`, `#question-card[data-feedback="..."]`, `#answer-display[data-empty="..."]` und `#end-highscore-badge[data-visible="..."]` übersetzen die semantischen Attribute in Sichtbarkeit (`display`), Farben, Ringe und Keyframe-Animationen (`shake`, `pop`).
- **Barrierefreiheit**: `@media (prefers-reduced-motion: reduce)` deaktiviert Bewegungsanimationen zuverlässig.
- **Stabiles iPhone-Layout**: Die App-Shell nutzt `100dvh`, `env(safe-area-inset-*)`, `overflow: hidden` sowie ein Flex/Grid-Layout mit `min-height: 0` auf flexiblen Mittelbereichen (insbesondere dem Aufgabenbereich zwischen Header und Zahlenpad). Dadurch bleibt `#keypad` auf jedem iPhone (auch auf dem kompakten iPhone SE oder bei größerer Systemschrift) vollständig sichtbar und läuft weder über noch wird abgeschnitten. Tasten halten mindestens `44px` Breite und Höhe ein.
- **Offline- und CDN-Fallback**: Der `<style>`-Block enthält eigene Basis-Fallback-Regeln für Farben, Typografie, Flex/Grid-Container, Karten und das 3-Spalten-Zahlenpad, sodass die App auch bei Offline-Start oder Ausfall von `cdn.tailwindcss.com` vollständig bedienbar und lesbar bleibt.

---

## 3. Dauerhafte Workflow- und GitHub-Pflicht

Ab sofort gilt nach jeder Änderung am Projekt eine feste Abschlussreihenfolge. Ein Arbeitsschritt gilt erst als fertig, wenn alle fünf Punkte erledigt sind:

1. **Grüne Tests**: `node --test tests.mjs` im Projektordner ausführen. Alle Tests müssen ohne Fehler und ohne übersprungene Prüfungen bestehen.
2. **Sauberer Git-Commit**: Alle geänderten Dateien stagen und mit einer verständlichen deutschen oder englischen Commit-Message committen.
3. **Sofortiger Push**: `git push` direkt auf `origin main` (GitHub) ausführen.
4. **`CODE_SPIEGEL.md` synchronisieren**: Die Volltext-Spiegeldatei `CODE_SPIEGEL.md` im Projekt wird beim Commit automatisch durch `.git/hooks/pre-commit` (`node tools/update-spiegel.mjs --code`) aktualisiert und mitgestaged.
5. **Google-Drive-Spiegel synchronisieren**: Nach dem Commit überträgt `.git/hooks/post-commit` (`node tools/update-spiegel.mjs --drive`) den Projektstand automatisch ohne `.git/` und `node_modules/` nach:
   `~/Library/CloudStorage/GoogleDrive-kovertben@gmail.com/Meine Ablage/KI-Spiegel/kopfrechen-pwa/`
   Zusätzlich prüft und spiegelt der zentrale `drive-spiegel.sh` täglich um 09:00 und 19:00 Uhr. Manueller Komplettlauf bei Bedarf: `node tools/update-spiegel.mjs`.

---

## 4. Architektur-Karte mit Legende

### Abhängigkeits- und Datenflusskarte

```text
+-------------------------------------------------------------------+
|                           index.html                              |
|  DOM (#screen-start, #screen-game, #screen-end, #keypad, ...)     |
|  Defensives CSS (<style>: Fallbacks, 100dvh, min-height: 0,       |
|  data-* Regeln) + <script type="module" src="./ui.js">            |
+---------------------------------+---------------------------------+
                                  |
             lädt / liefert DOM   |   schreibt Text, width &
             & Nutzer-Events      v   semantische data-* Attribute
+-------------------------------------------------------------------+
|                             ui.js                                 |
|  Steuerung von Timer, Eingabepuffer, Events & Service Worker      |
|  Verboten: Tailwind-Klassen, classList/className, localStorage    |
+----------------+--------------------------------+-----------------+
                 |                                |
   importiert    |                                |   importiert
   Pure Logik    v                                v   async Storage
+---------------------------------+  +------------------------------+
|           engine.js             |  |          storage.js          |
|  Headless Core (reines JS)      |  |  async loadUserData()        |
|  - generateQuestion()           |  |  async saveUserData(data)    |
|  - checkAnswer()                |  |  Felder: streak, highScore,  |
|  - updateUserProfile()          |  |          lastPlayedDate      |
|  - getDifficultyForScore()      |  +--------------+---------------+
|  - getRandomFunFact()           |                 |
|  Keine externen Abhängigkeiten  |                 v
+---------------------------------+        [ globalThis.localStorage ]
                                           Key: kopfrechen_user_data_v1

Parallel im Browser-Hintergrund:
+-------------------------------------------------------------------+
|                             sw.js                                 |
|  Service Worker (kopfrechen-v2): Offline-Cache für App-Shell      |
|  (Network-First lokal, Cache-First/SWR für Tailwind CDN)          |
+-------------------------------------------------------------------+

Qualitätssicherung (lokal & vor jedem Push):
+-------------------------------------------------------------------+
|                           tests.mjs                               |
|  node --test tests.mjs: testet engine.js + storage.js funktional  |
|  und prüft Quelltext-Gesetze in engine.js, storage.js, ui.js,     |
|  index.html                                                       |
+-------------------------------------------------------------------+
```

### Legende

- **`A -> B` / vertikale Pfeile**: Abhängigkeits-Einbahnstraße. `index.html` bindet `ui.js` ein; `ui.js` importiert `engine.js` und `storage.js`. Rückwärts-Abhängigkeiten sind verboten (`engine.js` kennt weder `ui.js` noch `storage.js` oder das DOM; `storage.js` kennt weder `ui.js` noch `engine.js` oder `document`).
- **Semantische `data-*`-Brücke**: Einzige Schnittstelle zwischen `ui.js` und CSS in `index.html` für visuelle Zustände (`data-screen`, `data-state`, `data-feedback`, `data-empty`, `data-visible`).
- **`sw.js` (Offline-Cache)**: Arbeitet entkoppelt im Service-Worker-Kontext; wird von `ui.js` einmalig beim Start registriert und liefert zwischengespeicherte Dateien bei fehlendem Netz.
- **`tests.mjs`**: Importiert ausschließlich `engine.js` und `storage.js` und liest geschützte Projektdateien statisch ein, um Architekturverstöße sofort sichtbar zu machen.

---

## 5. Entwicklungs-Phasen (Roadmap)

- **Phase 1: Fundament & Gehärteter Prototyp V1.1** (erledigt)
- **Phase 2: Didaktik & Trainings-Feinschliff V1.2** (Fehler-Rückblick mit Lösungen auf dem Endbildschirm, Kategorie-Auswahl vor Spielstart)
- **Phase 3: Echtes Cloud-Backend V2.0** (Umbau von `storage.js` auf Supabase nach Abschluss von Phase 2)
- **Phase 4: Langzeit-Statistik oder Native Swift-App V3.0** (Backlog)
