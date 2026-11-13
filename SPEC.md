# SPEC.md: Kopfrechnen 60s (PWA)

Verbindliches Architektur- und Entwicklungsgesetzbuch für `/Users/benkovert/kopfrechen-pwa`.
Jede Änderung am Code oder an der Oberfläche muss alle hier definierten Verträge einhalten.

## 1. System-Struktur

Die Anwendung ist eine leichtgewichtige Progressive Web App (PWA) für das iPhone ohne Build-Schritt oder externe Runtime-Abhängigkeiten (reines ES-Module-JavaScript).

### Die 4 Hauptbausteine

1. **`storage.js` (Datenschicht)**
   Kapselt alle Zugriffe auf `globalThis.localStorage` und trennt Persistenz strikt von Spiellogik und DOM. Das Nutzerprofil (`streak`, `highScore`, `lastPlayedDate`) bleibt unter `kopfrechen_user_data_v1` hinter den asynchronen Funktionen `loadUserData()` und `saveUserData(data)` gekapselt, damit sich der Speicher später ohne Umbau von `engine.js` oder `ui.js` auf ein Backend (z. B. Supabase) umstellen lässt. Seit V1.2 (Phase 2 Teil 1) verwaltet `storage.js` zusätzlich Themen-Gewichte unter `kopfrechen_weights_v1` (`TOPIC_IDS`, `getWeights()`, `adjustWeight(topicId, outcome)`, `getTopGaps(limit = 3)`) und Multi-Timer-Highscores unter `kopfrechen_highscores_v1` (`HIGHSCORE_DURATIONS`, `getHighScores()`, `getHighScore(durationSeconds = 60)`, `saveHighScore(score, durationSeconds = 60)`).

2. **`engine.js` (Logikschicht / Headless Core)**
   Reines JavaScript für alle fachlichen Regeln ohne Browser- oder Speicherbezug. Für V1.1 bleiben `GAME_DURATION_SECONDS = 60`, die vier Aufgabenkategorien (`CATEGORIES`: `Quadratzahlen` bis `25²`, `Potenzen`, `Lineare Gleichungen`, `Prozentrechnung`), 10 Fun-Facts (`MATH_FUN_FACTS`), `getDifficultyForScore`, `generateQuestion`, `checkAnswer`, `getLocalDateString`, `updateUserProfile` und `getRandomFunFact` vollständig erhalten. Seit V1.2 (Phase 2 Teil 1) stellt `engine.js` zusätzlich alle 11 Kurs-Themen (`TOPICS`), die vier Zeitstufen (`TIMER_DURATIONS = [60, 120, 300, 600]`), Themen- und gewichtete Generatoren mit Lösungswegen (`generateTopicQuestion`, `generateWeightedQuestion`, `pickTopic`) sowie Session-History und PPM-Auswertung (`createSessionHistory`, `createHistoryEntry`, `recordSessionAnswer`, `setHistoryGap`, `calculatePpm`, `summarizeSession`) bereit.

3. **`ui.js` (Präsentationsschicht)**
   Verbindet `index.html`, `engine.js` und `storage.js`. Verwaltet den Sitzungszustand (`isPlaying`, `timeLeft`, `timerId`, `score`, `attempts`, `currentQuestion`, `inputBuffer`, `userProfile`), bindet Klick- und Tastatur-Events (`#btn-start`, `#btn-replay`, `#btn-home`, `#keypad`, `keydown`), steuert das 1-Sekunden-Timer-Intervall, registriert den Service Worker (`./sw.js`) und überträgt Spielzustände ausschließlich über Textinhalte, funktionale Progress-Werte und semantische `data-*`-Attribute in das DOM. In Phase 2 Teil 1 bleibt `ui.js` unverändert; die Anbindung der neuen V1.2-Funktionen folgt in Phase 2 Teil 2.

4. **`index.html` (Struktur, PWA-Meta und Defensives CSS)**
   Enthält die semantische HTML-Struktur für die drei Ansichten (`#screen-start`, `#screen-game`, `#screen-end`), die iOS/PWA-Metadaten (`viewport-fit=cover`, `apple-mobile-web-app-capable`), den zentralen `<style>`-Block für Layout, Fallbacks und Zustandsübersetzung sowie den Module-Einstiegspunkt `<script type="module" src="./ui.js"></script>`. In Phase 2 Teil 1 bleibt `index.html` unverändert; der UI-Umbau für Timer- und Themenwahl sowie Fehler-Rückblick folgt in Phase 2 Teil 2.

### Test-, PWA- und Spiegeldokumente

- **`tests.mjs`**: Automatisierte Testsuite für `node --test tests.mjs`. Prüft neben den V1.1- und V1.2-Verträgen in `engine.js` und `storage.js` (Rechen-, Themen-, Gewichtungs-, History-, Highscore- und Streak-Funktionen) per Quelltext-Analyse auch die Einhaltung der Architektur-Gesetze (Headless Core, Storage-Kapselung, State-Driven UI und Defensives CSS).
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
- **Rückwärtskompatibler Aufgaben-Vertrag V1.1 (`generateQuestion`)**: `generateQuestion(difficulty, randomFn)` bleibt unverändert bestehen und liefert exakt `{ id, category, questionText, correctAnswer, difficulty }` mit ganzzahligem `correctAnswer >= 0` und `difficulty` im Bereich `1..3` für die vier `CATEGORIES`. Ebenso bleiben `GAME_DURATION_SECONDS = 60`, `CATEGORIES`, `MATH_FUN_FACTS`, `getDifficultyForScore`, `checkAnswer` (unterstützt `correctAnswer` und `answer`), `getLocalDateString`, `updateUserProfile` und `getRandomFunFact` erhalten.
- **V1.2 Kurs-Themen und Timer-Stufen**:
  - `TIMER_DURATIONS`: Gefrorenes Array `[60, 120, 300, 600]` (in Sekunden).
  - `TOPICS`: Gefrorenes Array mit allen 11 Kurs-Themen (`{ id, label }`):
    - `de1_1`: `DE 1.1 Grundlagen`
    - `de2_1`: `DE 2.1 Brüche (Grundlagen)`
    - `de2_2`: `DE 2.2 Brüche (Fortgeschritten)`
    - `de3_1`: `DE 3.1 Terme - Potenzgesetze`
    - `de3_2`: `DE 3.2 Terme - Exponenten und Logarithmen`
    - `de4_1`: `DE 4.1 Gleichungen`
    - `de4_2`: `DE 4.2 Lineare Gleichungssysteme`
    - `de5_1`: `DE 5.1 Funktionen (Geraden)`
    - `de5_2`: `DE 5.2 Funktionen (Fortgeschritten)`
    - `de6_1`: `DE 6.1 Technik - Trigonometrie am Dreieck`
    - `de6_2`: `DE 6.2 Technik - Trigonometrische Funktionen`
- **V1.2 Themen-Generatoren und gewichtete Auswahl**:
  - API: `generateTopicQuestion(topicId, difficulty, randomFn)`, `generateWeightedQuestion(activeTopicIds, weights, difficulty, randomFn)`, `pickTopic(activeTopicIds, weights, randomFn)`.
  - **Rückwärtskonstruktion**: Jede Themen-Aufgabe wird vom Ergebnis her so konstruiert, dass `answer` bzw. `correctAnswer` immer ganzzahlig und `>= 0` ist (über Zifferntasten `0` bis `9` eingebbar).
  - **Pflichtfelder einer Themen-Aufgabe**: `{ id, topicId, topicLabel, category, question, questionText, text, answer, correctAnswer, difficulty, steps }`.
  - **Lösungswege (`steps`)**: Array mit mindestens 2 kurzen, konkreten deutschen Lösungswegen genau für die erzeugten Zahlen der Aufgabe.
  - **Gewichtete Auswahl**: `pickTopic` wählt unter Berücksichtigung von `weights` (Standardgewicht `1.0`) aus `activeTopicIds` (Standard: alle 11 Themen aus `TOPICS`; bei leerem Array `[]` Rückgabe `null`). `generateWeightedQuestion` kombiniert `pickTopic` und `generateTopicQuestion`.
- **V1.2 Session-History und PPM**:
  - API: `createSessionHistory()`, `createHistoryEntry(question, checkResult)`, `recordSessionAnswer(history, question, checkResult)`, `setHistoryGap(history, index, marked = true)`, `calculatePpm(correctCount, durationSeconds = GAME_DURATION_SECONDS)`, `summarizeSession(history, durationSeconds = GAME_DURATION_SECONDS)`.
  - **Verlaufs-Eintrag (`createHistoryEntry`)**: `{ topicId, topicLabel, question, correctAnswer, userAnswer, isCorrect, steps, markedAsGap }`.
  - **Auswertung**: `calculatePpm` liefert richtige Antworten pro Minute (auf 1 Nachkommastelle gerundet, `0` bei Dauer `<= 0`). `summarizeSession` liefert `{ total, correctCount, wrongCount, accuracyPercent, ppm, durationSeconds }`.

### Gesetz 2: Speicher-Kapselung (`storage.js`)

`storage.js` kapselt alle Zugriffe auf `globalThis.localStorage` (Nutzerprofil, Themen-Gewichte und Multi-Timer-Highscores) und ist frei von DOM-Zugriffen.

- **Verbot in `storage.js`**: Kein Zugriff auf `document`, `querySelector` oder `getElementById`.
- **Nutzerprofil V1.1 (rückwärtskompatibel, `kopfrechen_user_data_v1`)**:
  - Verbindliche `async` Exports: `async loadUserData()` und `async saveUserData(data)`.
  - Verbindliches Datenmodell: Exakt die drei Felder `streak` (Ganzzahl `>= 0`), `highScore` (Ganzzahl `>= 0`) und `lastPlayedDate` (`YYYY-MM-DD`-String oder `null`).
  - Fehlertoleranz: Altdaten mit kleingeschriebenem `highscore` werden beim Laden auf `highScore` migriert; defektes JSON oder ungültige Werte fallen sicher auf `{ streak: 0, highScore: 0, lastPlayedDate: null }` zurück.
- **Themen-Gewichte V1.2 (`kopfrechen_weights_v1`)**:
  - API (synchron): `TOPIC_IDS` (11 Themen-IDs `de1_1` bis `de6_2`), `WEIGHT_DEFAULT` (`1.0`), `WEIGHT_MIN` (`1.0`), `WEIGHT_MAX` (`2.5`), `getWeights()`, `adjustWeight(topicId, outcome)`, `getTopGaps(limit = 3)`.
  - Wertebereich und Rundung: Startwert `1.0`, Minimum `1.0`, Cap/Maximum `2.5`, Rundung auf 2 Nachkommastellen; fehlertolerant bei fehlendem oder kaputtem JSON.
  - Gewichtsanpassung in `adjustWeight(topicId, outcome)`: `correct` `-0.05`, `wrong` `+0.15`, `gap` `+0.40` (begrenzt auf `[1.0, 2.5]`; unbekannte `topicId` lässt Gewichte unverändert).
  - `getTopGaps(limit = 3)`: Liefert bis zu `limit` Themen-IDs mit Gewicht `> 1.0`, absteigend nach Gewicht sortiert (bei Gleichstand in Reihenfolge aus `TOPIC_IDS`).
- **Multi-Timer-Highscores V1.2 (`kopfrechen_highscores_v1`)**:
  - Zeitstufen: `HIGHSCORE_DURATIONS` für `60`, `120`, `300`, `600` Sekunden (Standard `60s`; `normalizeDuration(durationSeconds)` akzeptiert Zahlen oder numerische Strings innerhalb der 4 Stufen, ungültige Werte fallen auf `60` zurück).
  - API (synchron): `HIGHSCORE_DURATIONS`, `normalizeDuration(durationSeconds)`, `getHighScores()`, `getHighScore(durationSeconds = 60)`, `saveHighScore(score, durationSeconds = 60)`.
  - Kompatibilität zu `60s`: Fehlt für `60` Sekunden ein Eintrag in `kopfrechen_highscores_v1`, wird der `highScore` aus `kopfrechen_user_data_v1` übernommen; übertrifft `saveHighScore(score, 60)` den bisherigen `highScore` in `kopfrechen_user_data_v1`, wird auch dieser mitaktualisiert.

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
+---------------------------------------------------------------------------------+
|                                   index.html                                    |
|  DOM (#screen-start, #screen-game, #screen-end, #keypad, ...)                   |
|  Defensives CSS (<style>: Fallbacks, 100dvh, min-height: 0, data-* Regeln)      |
|  + <script type="module" src="./ui.js">                                         |
|  (Phase 2 Teil 1: unverändert; UI-Erweiterungen folgen in Phase 2 Teil 2)       |
+----------------------------------------+----------------------------------------+
                                         |
                    lädt / liefert DOM   |   schreibt Text, width &
                    & Nutzer-Events      v   semantische data-* Attribute
+---------------------------------------------------------------------------------+
|                                      ui.js                                      |
|  Steuerung von Timer, Eingabepuffer, Events & Service Worker                    |
|  Verboten: Tailwind-Klassen, classList/className, localStorage                  |
|  (Phase 2 Teil 1: unverändert; V1.2-Anbindung folgt in Phase 2 Teil 2)          |
+---------------------+------------------------------------+----------------------+
                      |                                    |
        importiert    |                                    |   importiert
        Pure Logik    v                                    v   Storage API
+----------------------------------------+  +-------------------------------------+
|               engine.js                |  |             storage.js              |
|  Headless Core (reines JS)             |  |  V1.1 (async):                      |
|  V1.1:                                 |  |  - loadUserData(), saveUserData()   |
|  - generateQuestion(), checkAnswer()   |  |    (streak, highScore,              |
|  - updateUserProfile(),                |  |     lastPlayedDate)                 |
|    getDifficultyForScore()             |  |  V1.2 Teil 1 (synchron):            |
|  - getRandomFunFact()                  |  |  - TOPIC_IDS, getWeights(),         |
|  V1.2 Teil 1:                          |  |    adjustWeight(), getTopGaps()     |
|  - TOPICS (11 Themen de1_1..de6_2)     |  |  - HIGHSCORE_DURATIONS,             |
|  - TIMER_DURATIONS ([60,120,300,600])  |  |    getHighScores(), getHighScore(), |
|  - generateTopicQuestion()             |  |    saveHighScore()                  |
|  - generateWeightedQuestion()          |  |  Kein document / keine DOM-Queries  |
|  - pickTopic()                         |  +------------------+------------------+
|  - Session-History & PPM (6 Exports)   |                     |
|  Keine Browser-/Storage-Zugriffe       |                     v
+----------------------------------------+        [ globalThis.localStorage ]
                                                  Keys:
                                                  - kopfrechen_user_data_v1
                                                  - kopfrechen_weights_v1
                                                  - kopfrechen_highscores_v1

Parallel im Browser-Hintergrund:
+---------------------------------------------------------------------------------+
|                                      sw.js                                      |
|  Service Worker (kopfrechen-v2): Offline-Cache für App-Shell                    |
|  (Network-First lokal, Cache-First/SWR für Tailwind CDN)                        |
+---------------------------------------------------------------------------------+

Qualitätssicherung (lokal & vor jedem Push):
+---------------------------------------------------------------------------------+
|                                    tests.mjs                                    |
|  node --test tests.mjs: testet V1.1- und V1.2-Verträge in engine.js +           |
|  storage.js (11 Themen, Gewichte, Session-History, Multi-Timer-Highscores)      |
|  und prüft Quelltext-Gesetze in engine.js, storage.js, ui.js, index.html        |
+---------------------------------------------------------------------------------+
```

### Legende

- **`A -> B` / vertikale Pfeile**: Abhängigkeits-Einbahnstraße. `index.html` bindet `ui.js` ein; `ui.js` importiert `engine.js` und `storage.js` (die neuen V1.2-Schnittstellen werden in Phase 2 Teil 2 in `ui.js` und `index.html` angebunden). Rückwärts-Abhängigkeiten sind verboten (`engine.js` kennt weder `ui.js` noch `storage.js` oder das DOM; `storage.js` kennt weder `ui.js` noch `engine.js` oder `document`).
- **Semantische `data-*`-Brücke**: Einzige Schnittstelle zwischen `ui.js` und CSS in `index.html` für visuelle Zustände (`data-screen`, `data-state`, `data-feedback`, `data-empty`, `data-visible`).
- **`sw.js` (Offline-Cache)**: Arbeitet entkoppelt im Service-Worker-Kontext; wird von `ui.js` einmalig beim Start registriert und liefert zwischengespeicherte Dateien bei fehlendem Netz.
- **`tests.mjs`**: Importiert ausschließlich `engine.js` und `storage.js` und liest geschützte Projektdateien statisch ein, um Architekturverstöße sofort sichtbar zu machen.

---

## 5. Entwicklungs-Phasen (Roadmap)

- **Phase 1: Fundament & Gehärteter Prototyp V1.1** (erledigt)
- **Phase 2: Didaktik & Trainings-Feinschliff V1.2**
  - **Teil 1 (Headless-Kern & Speicher, umgesetzt)**: 11 Kurs-Themen (`de1_1` bis `de6_2`), gewichtete Themen-Priorisierung, Lösungswege (`steps`), Session-History mit PPM-Auswertung sowie Multi-Timer-Highscores in `storage.js`, `engine.js` und `tests.mjs`.
  - **Teil 2 (UI-Integration, nächster Schritt)**: Integration in `index.html` und `ui.js` (Timer- und Themenwahl auf dem Startbildschirm, Fehler-Rückblick mit Lösungswegen und Lücken-Markierung auf dem Endbildschirm).
- **Phase 3: Echtes Cloud-Backend V2.0** (Umbau von `storage.js` auf Supabase nach Abschluss von Phase 2)
- **Phase 4: Langzeit-Statistik oder Native Swift-App V3.0** (Backlog)
