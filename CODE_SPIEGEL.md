# CODE_SPIEGEL.md

Aktueller Volltext der Kerndateien aus `/Users/benkovert/kopfrechen-pwa`.

## SPEC.md

````markdown
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
````

## AGENTS.md

````markdown
# AGENTS.md: Projekt-Anweisungen für kopfrechen-pwa

## Oberstes Gesetzbuch

Für alle Änderungen in `/Users/benkovert/kopfrechen-pwa` gilt verbindlich **[SPEC.md](./SPEC.md)** als oberstes Gesetzbuch. Lies `SPEC.md` vor jeder Bearbeitung von Code oder Oberfläche vollständig.

## Verbindliche Architektur-Regeln im Überblick

1. **Headless Core (`engine.js`)**: Kein `document`, `window`, `localStorage`, `querySelector` oder `getElementById`. Reine Logik mit sauberen JSON-Rückgaben.
2. **Speicher-Kapselung (`storage.js`)**: Alle Profilzugriffe laufen ausschließlich über `async loadUserData()` und `async saveUserData(data)` mit den Feldern `streak`, `highScore`, `lastPlayedDate`; kein `document`.
3. **State-Driven UI Gesetz (`ui.js`)**:
   - Keine visuellen Tailwind-Farb-, Sichtbarkeits- oder Animationsklassen (wie `bg-rose-500`, `text-rose-400`, `ring-emerald-400`, `animate-shake`, `hidden`, `flex`) im JavaScript-Code.
   - Kein `classList` oder `className` umschalten und kein direkter Zugriff auf `localStorage`.
   - Zustände werden ausschließlich über die definierten semantischen `data-*`-Attribute gesetzt (`data-screen` auf `document.body`, `data-state` auf `gameTimer` und `gameProgress`, `data-feedback` auf `questionCard`, `data-empty` auf `answerDisplay`, `data-visible` auf `endHighscoreBadge`).
4. **Defensives CSS (`index.html`)**: Übersetzung aller `data-*`-Attribute im `<style>`-Block (inklusive `prefers-reduced-motion`), stabiles `100dvh`-Layout mit `min-height: 0` ohne Abschneiden des Zahlenpads auf iPhones sowie Offline-/CDN-Fallback-Regeln.

## Pflicht-Prüfung und Abschluss-Workflow nach jeder Änderung

Jeder abgeschlossene Arbeitsschritt endet ausnahmslos mit folgender Abfolge:

1. **Tests ausführen**:
   ```bash
   node --test tests.mjs
   ```
   Alle Tests müssen grün durchlaufen (0 Fehler, keine übersprungenen Prüfungen).
2. **GitHub Commit und Push**:
   Sauberen Git-Commit mit verständlicher deutscher oder englischer Commit-Message erstellen und sofort `git push` auf `origin main` ausführen.
3. **Automatische Spiegelung über Git-Hooks (`tools/update-spiegel.mjs`)**:
   - `.git/hooks/pre-commit` baut `CODE_SPIEGEL.md` bei jedem Commit automatisch neu auf (`--code`) und führt `git add CODE_SPIEGEL.md` aus.
   - `.git/hooks/post-commit` spiegelt das Projekt nach jedem Commit per `rsync` ohne `.git/` und `node_modules/` nach `~/Library/CloudStorage/GoogleDrive-kovertben@gmail.com/Meine Ablage/KI-Spiegel/kopfrechen-pwa/` (`--drive`); optionaler Hintergrund-Push über `git config kopfrechen.autoPush true`.
   - Zusätzlich sichert der zentrale `drive-spiegel.sh` das Projekt um 09:00 und 19:00 Uhr. Manueller Abgleich bei Bedarf: `node tools/update-spiegel.mjs`.
````

## .gitignore

```gitignore
.DS_Store
node_modules/
```

## .nojekyll

```text
```

## storage.js

```javascript
/**
 * Datenschicht (Storage Layer)
 * Verwaltet Nutzerprofil, Themen-Gewichte und Multi-Timer-Highscores.
 * Aktuell über globalThis.localStorage, gekapselt für späteren Backend-Tausch (z. B. Supabase).
 */

const STORAGE_KEY = 'kopfrechen_user_data_v1';
const WEIGHTS_STORAGE_KEY = 'kopfrechen_weights_v1';
const HIGHSCORES_STORAGE_KEY = 'kopfrechen_highscores_v1';

export const TOPIC_IDS = Object.freeze([
  'de1_1',
  'de2_1',
  'de2_2',
  'de3_1',
  'de3_2',
  'de4_1',
  'de4_2',
  'de5_1',
  'de5_2',
  'de6_1',
  'de6_2'
]);

export const HIGHSCORE_DURATIONS = Object.freeze([60, 120, 300, 600]);

export const WEIGHT_DEFAULT = 1.0;
export const WEIGHT_MIN = 1.0;
export const WEIGHT_MAX = 2.5;

const DEFAULT_DURATION = 60;
const TOPIC_ID_SET = new Set(TOPIC_IDS);
const DURATION_SET = new Set(HIGHSCORE_DURATIONS);
const WEIGHT_DELTAS = Object.freeze({
  correct: -0.05,
  wrong: 0.15,
  gap: 0.4
});

const DEFAULT_USER_DATA = {
  streak: 0,
  highScore: 0,
  lastPlayedDate: null
};

/**
 * Liest und parst einen JSON-Wert fehlertolerant aus localStorage.
 * @param {string} key
 * @returns {unknown}
 */
function readJsonFromStorage(key) {
  try {
    const serialized = globalThis.localStorage?.getItem(key);
    if (!serialized) {
      return null;
    }
    return JSON.parse(serialized);
  } catch {
    return null;
  }
}

/**
 * Serialisiert und speichert einen Wert fehlertolerant in localStorage.
 * @param {string} key
 * @param {unknown} value
 * @returns {void}
 */
function writeJsonToStorage(key, value) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Speicherfehler (z. B. privater Modus oder volles Kontingent) abfangen.
  }
}

/**
 * Normalisiert geladene Profildaten auf ein sicheres Format.
 * @param {unknown} raw
 * @returns {{ streak: number, highScore: number, lastPlayedDate: string | null }}
 */
function normalizeUserData(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_USER_DATA };
  }

  const streak = Number.isInteger(raw.streak) && raw.streak >= 0 ? raw.streak : 0;
  const rawHighScore = raw.highScore ?? raw.highscore;
  const highScore = Number.isInteger(rawHighScore) && rawHighScore >= 0 ? rawHighScore : 0;
  const lastPlayedDate = typeof raw.lastPlayedDate === 'string' && raw.lastPlayedDate.length > 0
    ? raw.lastPlayedDate
    : null;

  return { streak, highScore, lastPlayedDate };
}

/**
 * Lädt das Nutzerprofil synchron aus localStorage.
 * @returns {{ streak: number, highScore: number, lastPlayedDate: string | null }}
 */
function loadUserDataSync() {
  const parsed = readJsonFromStorage(STORAGE_KEY);
  return parsed ? normalizeUserData(parsed) : { ...DEFAULT_USER_DATA };
}

/**
 * Speichert das Nutzerprofil synchron in localStorage.
 * @param {{ streak: number, highScore: number, lastPlayedDate: string | null }} data
 * @returns {{ streak: number, highScore: number, lastPlayedDate: string | null }}
 */
function saveUserDataSync(data) {
  const normalized = normalizeUserData(data);
  writeJsonToStorage(STORAGE_KEY, normalized);
  return normalized;
}

/**
 * Lädt das Nutzerprofil asynchron aus dem Speicher.
 * @returns {Promise<{ streak: number, highScore: number, lastPlayedDate: string | null }>}
 */
export async function loadUserData() {
  return loadUserDataSync();
}

/**
 * Speichert das Nutzerprofil asynchron.
 * @param {{ streak: number, highScore: number, lastPlayedDate: string | null }} data
 * @returns {Promise<{ streak: number, highScore: number, lastPlayedDate: string | null }>}
 */
export async function saveUserData(data) {
  return saveUserDataSync(data);
}

/**
 * Begrenzt ein Themen-Gewicht auf [WEIGHT_MIN, WEIGHT_MAX] und rundet auf 2 Nachkommastellen.
 * @param {unknown} value
 * @returns {number}
 */
function normalizeWeightValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return WEIGHT_DEFAULT;
  }
  const clamped = Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, value));
  return Math.round(clamped * 100) / 100;
}

/**
 * Lädt die normalisierten Themen-Gewichte für alle 11 Themen-IDs aus TOPIC_IDS.
 * Fehlende oder ungültige Einträge werden mit WEIGHT_DEFAULT (1.0) initialisiert.
 * @returns {Record<string, number>}
 */
export function getWeights() {
  const raw = readJsonFromStorage(WEIGHTS_STORAGE_KEY);
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const weights = {};

  for (const topicId of TOPIC_IDS) {
    weights[topicId] = normalizeWeightValue(source[topicId]);
  }

  return weights;
}

/**
 * Passt das Gewicht eines Themas abhängig vom Ergebnis an und speichert es.
 * Unbekannte Themen-IDs geben die unveränderten Gewichte zurück.
 * @param {string} topicId
 * @param {'correct' | 'wrong' | 'gap'} outcome
 * @returns {Record<string, number>}
 */
export function adjustWeight(topicId, outcome) {
  const weights = getWeights();
  if (!TOPIC_ID_SET.has(topicId) || !Object.hasOwn(WEIGHT_DELTAS, outcome)) {
    return weights;
  }

  weights[topicId] = normalizeWeightValue(weights[topicId] + WEIGHT_DELTAS[outcome]);
  writeJsonToStorage(WEIGHTS_STORAGE_KEY, weights);
  return weights;
}

/**
 * Liefert die Themen-IDs mit Gewicht > WEIGHT_MIN absteigend sortiert (maximal limit).
 * Bei Gleichstand entscheidet die Reihenfolge in TOPIC_IDS.
 * @param {number} [limit=3]
 * @returns {string[]}
 */
export function getTopGaps(limit = 3) {
  if (typeof limit !== 'number' || Number.isNaN(limit) || limit <= 0) {
    return [];
  }

  const maxCount = Math.floor(limit);
  if (maxCount <= 0) {
    return [];
  }

  const weights = getWeights();
  return TOPIC_IDS
    .filter((topicId) => weights[topicId] > WEIGHT_MIN)
    .sort((a, b) => weights[b] - weights[a] || TOPIC_IDS.indexOf(a) - TOPIC_IDS.indexOf(b))
    .slice(0, maxCount);
}

/**
 * Normalisiert eine Spieldauer auf eine der erlaubten Zeitstufen (60, 120, 300, 600).
 * Bei fehlendem oder ungültigem Wert wird 60 zurückgegeben.
 * @param {unknown} durationSeconds
 * @returns {number}
 */
export function normalizeDuration(durationSeconds) {
  if (typeof durationSeconds !== 'number' && typeof durationSeconds !== 'string') {
    return DEFAULT_DURATION;
  }
  if (typeof durationSeconds === 'string' && durationSeconds.trim() === '') {
    return DEFAULT_DURATION;
  }

  const parsed = Number(durationSeconds);
  return DURATION_SET.has(parsed) ? parsed : DEFAULT_DURATION;
}

/**
 * Normalisiert einen Punktestand auf eine Ganzzahl >= 0.
 * @param {unknown} score
 * @returns {number}
 */
function normalizeScore(score) {
  if (typeof score === 'boolean') {
    return 0;
  }
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.floor(numeric));
}

/**
 * Prüft, ob ein gespeicherter Highscore-Wert eine gültige Ganzzahl >= 0 ist.
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidStoredScore(value) {
  return Number.isInteger(value) && value >= 0;
}

/**
 * Lädt die Highscores aller Zeitstufen (60, 120, 300, 600 Sekunden).
 * Fehlt ein Eintrag für 60 Sekunden, wird ein vorhandener highScore aus dem Nutzerprofil übernommen.
 * @returns {{ 60: number, 120: number, 300: number, 600: number }}
 */
export function getHighScores() {
  const raw = readJsonFromStorage(HIGHSCORES_STORAGE_KEY);
  const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const highScores = {};

  for (const duration of HIGHSCORE_DURATIONS) {
    const key = String(duration);
    const stored = Object.hasOwn(source, key) ? source[key] : undefined;
    highScores[duration] = isValidStoredScore(stored) ? stored : 0;
  }

  const hasStored60 = Object.hasOwn(source, String(DEFAULT_DURATION))
    && isValidStoredScore(source[String(DEFAULT_DURATION)]);
  if (!hasStored60) {
    highScores[DEFAULT_DURATION] = loadUserDataSync().highScore;
  }

  return highScores;
}

/**
 * Liefert den gespeicherten Highscore für eine Zeitstufe (Standard 60 Sekunden).
 * @param {unknown} [durationSeconds=60]
 * @returns {number}
 */
export function getHighScore(durationSeconds = DEFAULT_DURATION) {
  const normDuration = normalizeDuration(durationSeconds);
  const highScores = getHighScores();
  return highScores[normDuration];
}

/**
 * Speichert einen neuen Highscore für eine Zeitstufe, falls er den bisherigen Wert übertrifft.
 * Aktualisiert bei 60 Sekunden bei neuem Rekord auch highScore im Nutzerprofil.
 * @param {unknown} score
 * @param {unknown} [durationSeconds=60]
 * @returns {{ durationSeconds: number, highScore: number, isNewHighScore: boolean, highScores: { 60: number, 120: number, 300: number, 600: number } }}
 */
export function saveHighScore(score, durationSeconds = DEFAULT_DURATION) {
  const normDuration = normalizeDuration(durationSeconds);
  const safeScore = normalizeScore(score);
  const highScores = getHighScores();
  const prevScore = highScores[normDuration];
  const nextScore = Math.max(prevScore, safeScore);
  const isNewHighScore = safeScore > prevScore;

  highScores[normDuration] = nextScore;
  writeJsonToStorage(HIGHSCORES_STORAGE_KEY, highScores);

  if (normDuration === DEFAULT_DURATION) {
    const userData = loadUserDataSync();
    if (nextScore > userData.highScore) {
      saveUserDataSync({
        ...userData,
        highScore: nextScore
      });
    }
  }

  return {
    durationSeconds: normDuration,
    highScore: nextScore,
    isNewHighScore,
    highScores: { ...highScores }
  };
}
```

## engine.js

```javascript
/**
 * Logikschicht (Headless Core)
 * Reines JavaScript ohne jeden DOM- oder Speicherzugriff.
 * Liefert ausschließlich saubere JSON-Objekte.
 */

export const GAME_DURATION_SECONDS = 60;

export const TIMER_DURATIONS = Object.freeze([60, 120, 300, 600]);

export const CATEGORIES = Object.freeze({
  SQUARES: 'Quadratzahlen',
  POWERS: 'Potenzen',
  LINEAR: 'Lineare Gleichungen',
  PERCENT: 'Prozentrechnung'
});

export const TOPICS = Object.freeze(
  [
    { id: 'de1_1', label: 'DE 1.1 Grundlagen' },
    { id: 'de2_1', label: 'DE 2.1 Brüche (Grundlagen)' },
    { id: 'de2_2', label: 'DE 2.2 Brüche (Fortgeschritten)' },
    { id: 'de3_1', label: 'DE 3.1 Terme - Potenzgesetze' },
    { id: 'de3_2', label: 'DE 3.2 Terme - Exponenten und Logarithmen' },
    { id: 'de4_1', label: 'DE 4.1 Gleichungen' },
    { id: 'de4_2', label: 'DE 4.2 Lineare Gleichungssysteme' },
    { id: 'de5_1', label: 'DE 5.1 Funktionen (Geraden)' },
    { id: 'de5_2', label: 'DE 5.2 Funktionen (Fortgeschritten)' },
    { id: 'de6_1', label: 'DE 6.1 Technik - Trigonometrie am Dreieck' },
    { id: 'de6_2', label: 'DE 6.2 Technik - Trigonometrische Funktionen' }
  ].map((topic) => Object.freeze(topic))
);

const TOPIC_MAP = new Map(TOPICS.map((topic) => [topic.id, topic]));

export const MATH_FUN_FACTS = Object.freeze([
  'Die Zahl 0 wurde in Indien erfunden und revolutionierte das Rechnen mit Stellenwerten.',
  'Eine Zahl ist genau dann durch 9 teilbar, wenn ihre Quersumme durch 9 teilbar ist.',
  '2520 ist die kleinste Zahl, die sich ohne Rest durch alle Zahlen von 1 bis 10 teilen lässt.',
  'Das Gleichheitszeichen (=) erfand Robert Recorde 1557, weil zwei parallele Linien gleich lang sind.',
  'Jede ungerade Quadratzahl ergibt minus 1 immer ein Vielfaches von 8.',
  'Die Summe aller Zahlen von 1 bis 100 beträgt genau 5050, berühmt durch Carl Friedrich Gauß.',
  'Es gibt unendlich viele Primzahlen, aber nur eine einzige gerade Primzahl: die 2.',
  'Multipliziert man 111.111.111 mit sich selbst, entsteht das Palindrom 12.345.678.987.654.321.',
  'Prozent stammt vom lateinischen "per centum" und bedeutet wörtlich "von Hundert".',
  'Die Kreiszahl Pi ist irrational: Ihre Nachkommastellen wiederholen sich niemals periodisch.'
]);

const SUPERSCRIPTS = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹'
};

const SUBSCRIPTS = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉'
};

let questionCounter = 0;

/**
 * Erzeugt eine eindeutige Aufgaben-ID ohne Browser-Abhängigkeit.
 * @returns {string}
 */
function createQuestionId() {
  questionCounter += 1;
  return `q_${Date.now()}_${questionCounter}`;
}

/**
 * Formatiert einen ganzzahligen Exponenten als Hochzahl.
 * @param {number} exp
 * @returns {string}
 */
function toSuperscript(exp) {
  return String(exp)
    .split('')
    .map((ch) => SUPERSCRIPTS[ch] ?? ch)
    .join('');
}

/**
 * Formatiert eine ganze Zahl als tiefgestellte Ziffernfolge.
 * @param {number} num
 * @returns {string}
 */
function toSubscript(num) {
  return String(num)
    .split('')
    .map((ch) => SUBSCRIPTS[ch] ?? ch)
    .join('');
}

/**
 * Normalisiert den Rückgabewert einer Zufallsfunktion sicher auf [0, 1).
 * @param {() => number} randomFn
 * @returns {number}
 */
function safeRandom(randomFn = Math.random) {
  const val = Number(randomFn());
  if (!Number.isFinite(val) || val <= 0) return 0;
  if (val >= 1) return 0.9999999999999999;
  return val;
}

/**
 * Zufällige Ganzzahl im Bereich [min, max] inklusive.
 * @param {number} min
 * @param {number} max
 * @param {() => number} randomFn
 * @returns {number}
 */
function randomInt(min, max, randomFn = Math.random) {
  return Math.floor(safeRandom(randomFn) * (max - min + 1)) + min;
}

/**
 * Zufällige Ganzzahl in [min, max], die kein Vielfaches von 10 ist.
 * @param {number} min
 * @param {number} max
 * @param {() => number} randomFn
 * @returns {number}
 */
function randomNonTenInt(min, max, randomFn = Math.random) {
  let n = randomInt(min, max, randomFn);
  if (n % 10 === 0) {
    n = n < max ? n + 1 : n - 1;
  }
  return n;
}

/**
 * Wählt ein zufälliges Element aus einem Array.
 * @template T
 * @param {readonly T[]} items
 * @param {() => number} randomFn
 * @returns {T}
 */
function pickRandom(items, randomFn = Math.random) {
  return items[Math.floor(safeRandom(randomFn) * items.length)];
}

/**
 * Normalisiert die Schwierigkeitsstufe auf 1, 2 oder 3.
 * @param {number} difficulty
 * @returns {number}
 */
function normalizeDifficulty(difficulty = 1) {
  return Math.min(3, Math.max(1, Math.floor(Number(difficulty) || 1)));
}

/**
 * Größter gemeinsamer Teiler zweier positiver Ganzzahlen.
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

/**
 * Baut das einheitliche Aufgaben-Objekt für alle V1.2-Themen.
 * @param {string} topicId
 * @param {string} question
 * @param {number} answer
 * @param {number} difficulty
 * @param {string[]} steps
 */
function buildTopicQuestion(topicId, question, answer, difficulty, steps) {
  const topic = TOPIC_MAP.get(topicId);
  const topicLabel = topic.label;
  const safeAnswer = Math.max(0, Math.round(answer));

  return {
    id: createQuestionId(),
    topicId,
    topicLabel,
    category: topicLabel,
    question,
    questionText: question,
    text: question,
    answer: safeAnswer,
    correctAnswer: safeAnswer,
    difficulty,
    steps
  };
}

// ---------------------------------------------------------------------------
// V1.1 Klassische Generatoren (Rückwärtskompatibel für generateQuestion)
// ---------------------------------------------------------------------------

/**
 * Erzeugt eine Quadratzahl-Aufgabe bis maximal 25².
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateSquareQuestion(difficulty, randomFn) {
  let min = 2;
  let max = 12;
  if (difficulty === 2) {
    min = 13;
    max = 19;
  } else if (difficulty >= 3) {
    min = 20;
    max = 25;
  }

  const base = randomInt(min, max, randomFn);
  return {
    id: createQuestionId(),
    category: CATEGORIES.SQUARES,
    questionText: `${base}² = ?`,
    correctAnswer: base * base,
    difficulty
  };
}

/**
 * Erzeugt eine kopfrechentaugliche Potenz-Aufgabe.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generatePowerQuestion(difficulty, randomFn) {
  const pools = {
    1: [
      [2, 3], [2, 4], [2, 5],
      [3, 3], [4, 3], [5, 3],
      [10, 2], [10, 3]
    ],
    2: [
      [2, 6], [2, 7], [2, 8],
      [3, 4], [4, 4], [6, 3],
      [7, 3], [10, 4]
    ],
    3: [
      [2, 9], [2, 10],
      [3, 5], [5, 4],
      [8, 3], [9, 3]
    ]
  };

  const level = Math.min(3, Math.max(1, difficulty));
  const [base, exp] = pickRandom(pools[level], randomFn);

  return {
    id: createQuestionId(),
    category: CATEGORIES.POWERS,
    questionText: `${base}${toSuperscript(exp)} = ?`,
    correctAnswer: base ** exp,
    difficulty: level
  };
}

/**
 * Erzeugt eine lineare Gleichung ax + b = c mit ganzzahligem, nicht-negativem x.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateLinearQuestion(difficulty, randomFn) {
  const level = Math.min(3, Math.max(1, difficulty));
  let a;
  let x;
  let b;

  if (level === 1) {
    a = randomInt(2, 5, randomFn);
    x = randomInt(1, 10, randomFn);
    b = randomInt(1, 15, randomFn);
  } else if (level === 2) {
    a = randomInt(2, 8, randomFn);
    x = randomInt(2, 12, randomFn);
    const sign = safeRandom(randomFn) < 0.5 ? 1 : -1;
    b = sign * randomInt(1, 15, randomFn);
    if (a * x + b < 1) {
      b = Math.abs(b);
    }
  } else {
    a = randomInt(3, 12, randomFn);
    x = randomInt(2, 15, randomFn);
    const sign = safeRandom(randomFn) < 0.5 ? 1 : -1;
    b = sign * randomInt(2, 25, randomFn);
    if (a * x + b < 1) {
      b = Math.abs(b);
    }
  }

  const c = a * x + b;
  const bFormatted = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;

  return {
    id: createQuestionId(),
    category: CATEGORIES.LINEAR,
    questionText: `${a}x ${bFormatted} = ${c}`,
    correctAnswer: x,
    difficulty: level
  };
}

/**
 * Erzeugt eine Prozent-Aufgabe mit garantiert ganzzahligem Ergebnis.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generatePercentQuestion(difficulty, randomFn) {
  const level = Math.min(3, Math.max(1, difficulty));
  const specs = {
    1: [
      { p: 10, step: 10, maxMul: 20 },
      { p: 20, step: 5, maxMul: 20 },
      { p: 25, step: 4, maxMul: 25 },
      { p: 50, step: 2, maxMul: 50 }
    ],
    2: [
      { p: 5, step: 20, maxMul: 15 },
      { p: 15, step: 20, maxMul: 15 },
      { p: 30, step: 10, maxMul: 25 },
      { p: 40, step: 5, maxMul: 30 },
      { p: 60, step: 5, maxMul: 30 },
      { p: 75, step: 4, maxMul: 30 },
      { p: 80, step: 5, maxMul: 25 }
    ],
    3: [
      { p: 12, step: 25, maxMul: 16 },
      { p: 35, step: 20, maxMul: 20 },
      { p: 45, step: 20, maxMul: 18 },
      { p: 65, step: 20, maxMul: 16 },
      { p: 85, step: 20, maxMul: 14 },
      { p: 120, step: 5, maxMul: 30 },
      { p: 150, step: 2, maxMul: 60 }
    ]
  };

  const { p, step, maxMul } = pickRandom(specs[level], randomFn);
  const base = step * randomInt(1, maxMul, randomFn);
  const answer = (p * base) / 100;

  return {
    id: createQuestionId(),
    category: CATEGORIES.PERCENT,
    questionText: `${p} % von ${base} = ?`,
    correctAnswer: answer,
    difficulty: level
  };
}

// ---------------------------------------------------------------------------
// V1.2 Themen-Generatoren (11 Kurs-Module mit Lösungswegen)
// ---------------------------------------------------------------------------

/**
 * DE 1.1 Grundlagen: Addition, Subtraktion, Multiplikation und Division im Kopf.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe1_1(difficulty, randomFn) {
  const op = pickRandom(['add', 'sub', 'mul', 'div'], randomFn);

  if (op === 'add') {
    const ranges = {
      1: [12, 49, 11, 39],
      2: [35, 89, 24, 79],
      3: [125, 489, 46, 289]
    };
    const [aMin, aMax, bMin, bMax] = ranges[difficulty];
    const a = randomNonTenInt(aMin, aMax, randomFn);
    const b = randomNonTenInt(bMin, bMax, randomFn);
    const ans = a + b;
    const bUnits = b % 10;
    const bRest = b - bUnits;
    const toTen = 10 - (a % 10);

    return buildTopicQuestion(
      'de1_1',
      `${a} + ${b} = ?`,
      ans,
      difficulty,
      [
        `Weg 1 (Stellenweise): ${a} + ${bRest} = ${a + bRest}, dann + ${bUnits} = ${ans}.`,
        `Weg 2 (Zehner voll machen): ${a} + ${toTen} = ${a + toTen}, restliche + ${b - toTen} = ${ans}.`
      ]
    );
  }

  if (op === 'sub') {
    const ranges = {
      1: [11, 34, 12, 49],
      2: [23, 68, 16, 84],
      3: [46, 185, 48, 285]
    };
    const [bMin, bMax, ansMin, ansMax] = ranges[difficulty];
    const b = randomNonTenInt(bMin, bMax, randomFn);
    const ans = randomNonTenInt(ansMin, ansMax, randomFn);
    const a = ans + b;
    const bUnits = b % 10;
    const bRest = b - bUnits;
    const midTen = Math.ceil(b / 10) * 10;

    return buildTopicQuestion(
      'de1_1',
      `${a} - ${b} = ?`,
      ans,
      difficulty,
      [
        `Weg 1 (Schrittweise): ${a} - ${bRest} = ${a - bRest}, dann - ${bUnits} = ${ans}.`,
        `Weg 2 (Ergänzen): Von ${b} bis ${midTen} sind es ${midTen - b}, von ${midTen} bis ${a} noch ${a - midTen}, Summe = ${ans}.`
      ]
    );
  }

  if (op === 'mul') {
    const a = difficulty === 1
      ? randomInt(3, 9, randomFn)
      : difficulty === 2
        ? randomInt(4, 9, randomFn)
        : randomNonTenInt(6, 14, randomFn);
    const b = difficulty === 1
      ? randomNonTenInt(12, 19, randomFn)
      : difficulty === 2
        ? randomNonTenInt(22, 49, randomFn)
        : randomNonTenInt(23, 68, randomFn);
    const ans = a * b;
    const bUnits = b % 10;
    const bRest = b - bUnits;

    let step2;
    if (a % 2 === 0) {
      step2 = `Weg 2 (Halbieren und Verdoppeln): (${a} : 2) · (${b} · 2) = ${a / 2} · ${b * 2} = ${ans}.`;
    } else if (b % 2 === 0) {
      step2 = `Weg 2 (Verdoppeln und Halbieren): (${a} · 2) · (${b} : 2) = ${a * 2} · ${b / 2} = ${ans}.`;
    } else if (bUnits >= 6) {
      const bRound = bRest + 10;
      const diff = bRound - b;
      step2 = `Weg 2 (Aufrunden): ${a} · ${bRound} = ${a * bRound}, minus ${a} · ${diff} (${a * diff}) = ${ans}.`;
    } else {
      step2 = `Weg 2 (Nachbaraufgabe): ${a + 1} · ${b} = ${(a + 1) * b}, minus ${b} = ${ans}.`;
    }

    return buildTopicQuestion(
      'de1_1',
      `${a} · ${b} = ?`,
      ans,
      difficulty,
      [
        `Weg 1 (Zerlegen): ${a} · ${bRest} = ${a * bRest} und ${a} · ${bUnits} = ${a * bUnits}, Summe = ${ans}.`,
        step2
      ]
    );
  }

  const divisor = difficulty === 1
    ? randomInt(3, 9, randomFn)
    : difficulty === 2
      ? randomNonTenInt(4, 12, randomFn)
      : randomNonTenInt(6, 18, randomFn);
  const ans = difficulty === 1
    ? randomNonTenInt(6, 19, randomFn)
    : difficulty === 2
      ? randomNonTenInt(12, 34, randomFn)
      : randomNonTenInt(14, 48, randomFn);
  const dividend = divisor * ans;

  const firstChunk = ans > 10 ? Math.floor(ans / 10) * 10 * divisor : 5 * divisor;
  const secondChunk = dividend - firstChunk;
  const step1 = `Weg 1 (Zerlegen): ${firstChunk} : ${divisor} = ${firstChunk / divisor} und ${secondChunk} : ${divisor} = ${secondChunk / divisor}, Summe = ${ans}.`;

  let step2;
  if (divisor % 2 === 0) {
    step2 = `Weg 2 (Halbieren): Beide Zahlen durch 2 teilen ergibt ${dividend / 2} : ${divisor / 2} = ${ans}.`;
  } else {
    const upper = Math.ceil(ans / 10) * 10 * divisor;
    const diff = upper - dividend;
    step2 = `Weg 2 (Von oben nähern): ${upper} : ${divisor} = ${upper / divisor}, minus ${diff} : ${divisor} (${diff / divisor}) = ${ans}.`;
  }

  return buildTopicQuestion(
    'de1_1',
    `${dividend} : ${divisor} = ?`,
    ans,
    difficulty,
    [step1, step2]
  );
}

/**
 * DE 2.1 Brüche (Grundlagen): Bruchteile von Größen, Kürzen und Erweitern.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe2_1(difficulty, randomFn) {
  const fractions = {
    1: [
      [1, 2], [1, 3], [2, 3], [1, 4], [3, 4],
      [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10]
    ],
    2: [
      [2, 3], [3, 4], [2, 5], [3, 5], [4, 5],
      [1, 6], [5, 6], [3, 8], [5, 8], [7, 8],
      [2, 9], [4, 9], [5, 12], [7, 12]
    ],
    3: [
      [3, 7], [4, 7], [5, 7], [3, 8], [5, 8], [7, 8],
      [4, 9], [5, 9], [7, 9], [5, 12], [7, 12], [11, 12],
      [4, 15], [7, 15], [8, 15]
    ]
  };

  const [num, den] = pickRandom(fractions[difficulty], randomFn);
  const variant = pickRandom(['part', 'reduce', 'expand'], randomFn);

  if (variant === 'part') {
    const k = difficulty === 1
      ? randomInt(2, 9, randomFn)
      : difficulty === 2
        ? randomInt(3, 14, randomFn)
        : randomInt(4, 18, randomFn);
    const total = den * k;
    const ans = num * k;

    const step1 = `Weg 1 (Erst teilen, dann malnehmen): ${total} : ${den} = ${k}, dann ${k} · ${num} = ${ans}.`;
    let step2;
    if (num === den - 1 && den >= 3) {
      step2 = `Weg 2 (Rest vom Ganzen): 1/${den} von ${total} ist ${k}, also ${total} - ${k} = ${ans}.`;
    } else if (num === 1) {
      step2 = `Weg 2 (Direkte Teilung): Der Bruch 1/${den} teilt ${total} in ${den} gleiche Teile, je ${ans}.`;
    } else {
      step2 = `Weg 2 (Erst malnehmen): ${total} · ${num} = ${total * num}, danach : ${den} = ${ans}.`;
    }

    return buildTopicQuestion(
      'de2_1',
      `${num}/${den} von ${total} = ?`,
      ans,
      difficulty,
      [step1, step2]
    );
  }

  if (variant === 'reduce') {
    const k = difficulty === 1
      ? randomInt(2, 5, randomFn)
      : difficulty === 2
        ? randomInt(3, 8, randomFn)
        : randomInt(4, 11, randomFn);
    const bigNum = num * k;
    const bigDen = den * k;

    return buildTopicQuestion(
      'de2_1',
      `${bigNum}/${bigDen} = ?/${den}`,
      num,
      difficulty,
      [
        `Weg 1 (Kürzungszahl finden): ${bigDen} : ${den} = ${k}, also Zähler ${bigNum} : ${k} = ${num}.`,
        `Weg 2 (Verhältnis prüfen): ${den} passt ${k}-mal in ${bigDen}, und ${num} · ${k} ergibt ${bigNum}.`
      ]
    );
  }

  const k = difficulty === 1
    ? randomInt(2, 5, randomFn)
    : difficulty === 2
      ? randomInt(3, 8, randomFn)
      : randomInt(4, 11, randomFn);
  const bigDen = den * k;
  const ans = num * k;

  return buildTopicQuestion(
    'de2_1',
    `${num}/${den} = ?/${bigDen}`,
    ans,
    difficulty,
    [
      `Weg 1 (Erweiterungszahl): ${bigDen} : ${den} = ${k}, deshalb Zähler ${num} · ${k} = ${ans}.`,
      `Weg 2 (Als Bruchteil): ${num}/${den} von ${bigDen} ist (${bigDen} : ${den}) · ${num} = ${k} · ${num} = ${ans}.`
    ]
  );
}

/**
 * DE 2.2 Brüche (Fortgeschritten): Addition/Subtraktion, Division durch Bruch, Bruchmultiplikation.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe2_2(difficulty, randomFn) {
  const variant = pickRandom(['addsub', 'divfrac', 'mulfrac'], randomFn);

  if (variant === 'addsub') {
    const denPairs = {
      1: [
        [2, 4, 4], [2, 6, 6], [3, 6, 6], [2, 8, 8], [4, 8, 8], [5, 10, 10]
      ],
      2: [
        [2, 3, 6], [3, 4, 12], [2, 5, 10], [4, 6, 12], [3, 5, 15], [4, 10, 20]
      ],
      3: [
        [4, 5, 20], [3, 8, 24], [5, 6, 30], [6, 8, 24], [4, 9, 36], [6, 9, 18]
      ]
    };

    const [d1Raw, d2Raw, commonDen] = pickRandom(denPairs[difficulty], randomFn);
    let d1 = d1Raw;
    let d2 = d2Raw;
    let a = randomInt(1, d1 - 1, randomFn);
    let b = randomInt(1, d2 - 1, randomFn);
    const isSub = safeRandom(randomFn) < 0.4;

    if (isSub && a * (commonDen / d1) < b * (commonDen / d2)) {
      const tmpA = a;
      const tmpD1 = d1;
      a = b;
      d1 = d2;
      b = tmpA;
      d2 = tmpD1;
    }

    const f1 = commonDen / d1;
    const f2 = commonDen / d2;
    const n1 = a * f1;
    const n2 = b * f2;
    const ans = isSub ? n1 - n2 : n1 + n2;
    const opSign = isSub ? '-' : '+';

    return buildTopicQuestion(
      'de2_2',
      `${a}/${d1} ${opSign} ${b}/${d2} = ?/${commonDen}`,
      ans,
      difficulty,
      [
        `Weg 1 (Gleichnamig machen): ${a}/${d1} = ${n1}/${commonDen} und ${b}/${d2} = ${n2}/${commonDen}, also ${n1} ${opSign} ${n2} = ${ans}.`,
        `Weg 2 (Teile von ${commonDen}): ${a}/${d1} von ${commonDen} sind ${n1}, ${b}/${d2} sind ${n2}, Ergebnis ${n1} ${opSign} ${n2} = ${ans}.`
      ]
    );
  }

  if (variant === 'divfrac') {
    const fracPool = {
      1: [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5]],
      2: [[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 8]],
      3: [[2, 5], [3, 7], [4, 7], [3, 8], [5, 8], [5, 9], [7, 12]]
    };
    const [num, den] = pickRandom(fracPool[difficulty], randomFn);
    const maxK = difficulty === 1 ? 5 : difficulty === 2 ? 6 : 8;
    const k = randomInt(difficulty === 1 ? 1 : 2, maxK, randomFn);
    const whole = num * k;
    const ans = k * den;

    return buildTopicQuestion(
      'de2_2',
      `${whole} : (${num}/${den}) = ?`,
      ans,
      difficulty,
      [
        `Weg 1 (Kehrwert malnehmen): ${whole} · (${den}/${num}) = (${whole} : ${num}) · ${den} = ${k} · ${den} = ${ans}.`,
        `Weg 2 (Gleichnamig vergleichen): ${whole} = ${whole * den}/${den}, und ${num}/${den} passt (${whole * den} : ${num}) = ${ans}-mal hinein.`
      ]
    );
  }

  const coprimeBases = [
    [2, 3], [2, 5], [3, 4], [3, 5], [4, 5], [3, 7], [4, 7], [5, 6], [5, 7]
  ];
  const [b, d] = pickRandom(coprimeBases, randomFn);
  const k1Pool = [];
  const k2Pool = [];
  const maxFactor = difficulty === 1 ? 3 : difficulty === 2 ? 5 : 7;
  for (let i = 1; i <= maxFactor; i += 1) {
    if (gcd(i, d) === 1) k1Pool.push(i);
    if (gcd(i, b) === 1) k2Pool.push(i);
  }
  const k1 = pickRandom(k1Pool, randomFn);
  const k2 = pickRandom(k2Pool, randomFn);
  const a = d * k2;
  const c = b * k1;
  const ans = k1 * k2;

  return buildTopicQuestion(
    'de2_2',
    `(${a}/${b}) · (${c}/${d}) = ?`,
    ans,
    difficulty,
    [
      `Weg 1 (Über Kreuz kürzen): ${a} gegen ${d} ergibt ${k2}, ${c} gegen ${b} ergibt ${k1}, also ${k2} · ${k1} = ${ans}.`,
      `Weg 2 (Direkt ausmultiplizieren): (${a} · ${c}) : (${b} · ${d}) = ${a * c} : ${b * d} = ${ans}.`
    ]
  );
}

/**
 * DE 3.1 Terme - Potenzgesetze.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe3_1(difficulty, randomFn) {
  const variants = difficulty === 1
    ? ['mulExp', 'powPow', 'divExp', 'divVal']
    : ['mulExp', 'powPow', 'divExp', 'divVal', 'sameExp'];
  const variant = pickRandom(variants, randomFn);

  if (variant === 'mulExp') {
    const base = randomInt(2, difficulty === 1 ? 5 : 9, randomFn);
    const maxExp = difficulty === 1 ? 5 : difficulty === 2 ? 8 : 11;
    const e1 = randomInt(2, maxExp, randomFn);
    const e2 = randomInt(2, maxExp, randomFn);
    const ans = e1 + e2;

    return buildTopicQuestion(
      'de3_1',
      `${base}${toSuperscript(e1)} · ${base}${toSuperscript(e2)} = ${base}^?`,
      ans,
      difficulty,
      [
        `Weg 1 (Potenzgesetz): Bei gleicher Basis ${base} werden die Exponenten addiert: ${e1} + ${e2} = ${ans}.`,
        `Weg 2 (Faktoren zählen): ${e1} Faktoren ${base} mal ${e2} Faktoren ${base} sind zusammen ${ans} Faktoren.`
      ]
    );
  }

  if (variant === 'powPow') {
    const base = randomInt(2, difficulty === 1 ? 5 : 9, randomFn);
    const e1 = randomInt(2, difficulty === 1 ? 4 : 6, randomFn);
    const e2 = randomInt(2, difficulty === 1 ? 3 : 5, randomFn);
    const ans = e1 * e2;

    return buildTopicQuestion(
      'de3_1',
      `(${base}${toSuperscript(e1)})${toSuperscript(e2)} = ${base}^?`,
      ans,
      difficulty,
      [
        `Weg 1 (Potenzgesetz): Potenzen werden potenziert, indem man Exponenten malnimmt: ${e1} · ${e2} = ${ans}.`,
        `Weg 2 (Ausgeschrieben): ${base}${toSuperscript(e1)} steht ${e2}-mal als Faktor, daher ${e2} · ${e1} = ${ans} Faktoren ${base}.`
      ]
    );
  }

  if (variant === 'divExp') {
    const base = randomInt(2, difficulty === 1 ? 6 : 9, randomFn);
    const e2 = randomInt(2, difficulty === 1 ? 4 : 7, randomFn);
    const diffExp = randomInt(1, difficulty === 1 ? 4 : 6, randomFn);
    const e1 = e2 + diffExp;

    return buildTopicQuestion(
      'de3_1',
      `${base}${toSuperscript(e1)} : ${base}${toSuperscript(e2)} = ${base}^?`,
      diffExp,
      difficulty,
      [
        `Weg 1 (Potenzgesetz): Bei Division gleicher Basis ${base} Exponenten abziehen: ${e1} - ${e2} = ${diffExp}.`,
        `Weg 2 (Bruch kürzen): Im Bruch ${base}${toSuperscript(e1)} / ${base}${toSuperscript(e2)} kürzen sich ${e2} Faktoren weg, es bleiben ${diffExp}.`
      ]
    );
  }

  if (variant === 'divVal') {
    const valuePairs = {
      1: [[2, 2], [2, 3], [3, 2], [4, 2], [5, 2], [10, 2]],
      2: [[2, 3], [2, 4], [3, 3], [4, 2], [5, 2], [6, 2], [7, 2]],
      3: [[2, 4], [2, 5], [3, 3], [4, 3], [5, 3], [8, 2], [9, 2]]
    };
    const [base, diffExp] = pickRandom(valuePairs[difficulty], randomFn);
    const e2 = randomInt(2, difficulty === 1 ? 4 : 6, randomFn);
    const e1 = e2 + diffExp;
    const ans = base ** diffExp;

    return buildTopicQuestion(
      'de3_1',
      `${base}${toSuperscript(e1)} : ${base}${toSuperscript(e2)} = ?`,
      ans,
      difficulty,
      [
        `Weg 1 (Exponenten subtrahieren): ${e1} - ${e2} = ${diffExp}, damit ${base}${toSuperscript(diffExp)} = ${ans}.`,
        `Weg 2 (Kürzen): Nach Kürzen von ${e2} Faktoren ${base} bleiben ${diffExp} Faktoren übrig, Produkt = ${ans}.`
      ]
    );
  }

  const a = randomInt(2, difficulty === 2 ? 5 : 7, randomFn);
  const b = randomInt(2, difficulty === 2 ? 5 : 7, randomFn);
  const exp = randomInt(2, difficulty === 2 ? 5 : 8, randomFn);
  const ans = a * b;

  return buildTopicQuestion(
    'de3_1',
    `${a}${toSuperscript(exp)} · ${b}${toSuperscript(exp)} = ?${toSuperscript(exp)}`,
    ans,
    difficulty,
    [
      `Weg 1 (Gleicher Exponent): Basen multiplizieren und Exponent ${exp} behalten: ${a} · ${b} = ${ans}.`,
      `Weg 2 (Paare bilden): Man gruppiert zu (${a} · ${b})${toSuperscript(exp)} = ${ans}${toSuperscript(exp)}.`
    ]
  );
}

/**
 * DE 3.2 Terme - Exponenten und Logarithmen.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe3_2(difficulty, randomFn) {
  const pools = {
    1: [
      [2, 1], [2, 2], [2, 3], [2, 4], [2, 5],
      [3, 1], [3, 2], [3, 3], [5, 2], [10, 1], [10, 2], [10, 3]
    ],
    2: [
      [2, 4], [2, 5], [2, 6], [2, 7],
      [3, 2], [3, 3], [3, 4], [4, 2], [4, 3],
      [5, 2], [5, 3], [10, 3], [10, 4], [2, 0]
    ],
    3: [
      [2, 6], [2, 7], [2, 8], [2, 9], [2, 10],
      [3, 4], [3, 5], [4, 4], [5, 4],
      [6, 2], [7, 2], [8, 2], [9, 2], [10, 0]
    ]
  };

  const variants = difficulty === 1 ? ['log', 'expEq'] : ['log', 'expEq', 'logLaw'];
  const variant = pickRandom(variants, randomFn);

  if (variant === 'log') {
    const [base, x] = pickRandom(pools[difficulty], randomFn);
    const val = base ** x;

    let step2;
    if (x === 0) {
      step2 = `Weg 2 (Sonderfall 1): Jede positive Basis hoch 0 ergibt 1, also log${toSubscript(base)}(1) = 0.`;
    } else if (base === 10) {
      step2 = `Weg 2 (Nullen zählen): ${val} ist eine 1 mit ${x} ${x === 1 ? 'Null' : 'Nullen'}, also ist der Zehnerlogarithmus ${x}.`;
    } else if (x <= 5) {
      const chain = Array.from({ length: x }, () => base).join(' · ');
      step2 = `Weg 2 (Hochmultiplizieren): ${chain} = ${val}, das sind genau ${x} Faktoren ${base}.`;
    } else {
      const half = Math.floor(x / 2);
      const rest = x - half;
      step2 = `Weg 2 (Teilen über Potenzen): ${base}${toSuperscript(half)} = ${base ** half} und ${base}${toSuperscript(rest)} = ${base ** rest}, Exponenten ${half} + ${rest} = ${x}.`;
    }

    return buildTopicQuestion(
      'de3_2',
      `log${toSubscript(base)}(${val}) = ?`,
      x,
      difficulty,
      [
        `Weg 1 (Umkehrfrage): ${base} hoch welche Zahl ergibt ${val}? ${base}${toSuperscript(x)} = ${val}, also ${x}.`,
        step2
      ]
    );
  }

  if (variant === 'expEq') {
    const nonZeroPool = pools[difficulty].filter(([, x]) => x >= 1);
    const [base, x] = pickRandom(nonZeroPool, randomFn);
    const val = base ** x;

    const step1 = x <= 5
      ? `Weg 1 (Potenzen prüfen): ${Array.from({ length: x }, (_, idx) => `${base}${toSuperscript(idx + 1)}=${base ** (idx + 1)}`).join(', ')}, also x = ${x}.`
      : `Weg 1 (Ankern): ${base}${toSuperscript(Math.floor(x / 2))} = ${base ** Math.floor(x / 2)}, bis ${val} fehlen noch ${x - Math.floor(x / 2)} Schritte -> x = ${x}.`;

    return buildTopicQuestion(
      'de3_2',
      `${base}^x = ${val} | x = ?`,
      x,
      difficulty,
      [
        step1,
        `Weg 2 (Logarithmus): x = log${toSubscript(base)}(${val}) = ${x}, weil ${base}${toSuperscript(x)} = ${val}.`
      ]
    );
  }

  const lawBase = pickRandom([2, 3, 5, 6, 10], randomFn);
  const ans = randomInt(2, lawBase <= 3 ? 4 : 3, randomFn);
  const target = lawBase ** ans;
  const mul = randomInt(2, 5, randomFn);
  const bigArg = target * mul;

  return buildTopicQuestion(
    'de3_2',
    `log${toSubscript(lawBase)}(${bigArg}) - log${toSubscript(lawBase)}(${mul}) = ?`,
    ans,
    difficulty,
    [
      `Weg 1 (Logarithmengesetz): Differenz wird zum Quotienten: log${toSubscript(lawBase)}(${bigArg} : ${mul}) = log${toSubscript(lawBase)}(${target}).`,
      `Weg 2 (Exponent ablesen): ${lawBase}${toSuperscript(ans)} = ${target}, daher ist das Ergebnis ${ans}.`
    ]
  );
}

/**
 * DE 4.1 Gleichungen: Lineare Gleichungen, Klammern und beidseitige Terme.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe4_1(difficulty, randomFn) {
  const variants = difficulty === 1 ? ['axb', 'paren'] : ['axb', 'paren', 'bothSides'];
  const variant = pickRandom(variants, randomFn);

  if (variant === 'axb') {
    const a = randomInt(2, difficulty === 1 ? 5 : difficulty === 2 ? 8 : 11, randomFn);
    const x = randomInt(1, difficulty === 1 ? 9 : 14, randomFn);
    const isMinus = safeRandom(randomFn) < 0.5;
    const maxB = isMinus ? Math.min(25, a * x) : difficulty === 1 ? 15 : 28;
    const b = randomInt(1, Math.max(1, maxB), randomFn);
    const c = isMinus ? a * x - b : a * x + b;
    const sign = isMinus ? '-' : '+';
    const invOp = isMinus ? '+' : '-';

    return buildTopicQuestion(
      'de4_1',
      `${a}x ${sign} ${b} = ${c} | x = ?`,
      x,
      difficulty,
      [
        `Weg 1 (Rückwärts auflösen): Erst ${c} ${invOp} ${b} = ${a * x}, dann ${a * x} : ${a} = ${x}.`,
        `Weg 2 (Gegenprobe): ${a} · ${x} ${sign} ${b} = ${a * x} ${sign} ${b} = ${c}.`
      ]
    );
  }

  if (variant === 'paren') {
    const a = randomInt(2, difficulty === 1 ? 4 : 7, randomFn);
    const isMinus = safeRandom(randomFn) < 0.45;
    const b = randomInt(1, difficulty === 1 ? 6 : 9, randomFn);
    const x = isMinus ? b + randomInt(1, 9, randomFn) : randomInt(1, 12, randomFn);
    const inner = isMinus ? x - b : x + b;
    const c = a * inner;
    const sign = isMinus ? '-' : '+';
    const invOp = isMinus ? '+' : '-';
    const ab = a * b;
    const axVal = isMinus ? c + ab : c - ab;

    return buildTopicQuestion(
      'de4_1',
      `${a}(x ${sign} ${b}) = ${c} | x = ?`,
      x,
      difficulty,
      [
        `Weg 1 (Erst durch ${a} teilen): ${c} : ${a} = ${inner}, also x ${sign} ${b} = ${inner} -> x = ${inner} ${invOp} ${b} = ${x}.`,
        `Weg 2 (Ausmultiplizieren): ${a}x ${sign} ${ab} = ${c} -> ${a}x = ${axVal} -> x = ${axVal} : ${a} = ${x}.`
      ]
    );
  }

  const x = randomInt(1, difficulty === 2 ? 10 : 14, randomFn);
  const d = randomInt(1, 5, randomFn);
  const diffA = randomInt(2, 6, randomFn);
  const a = d + diffA;
  const b = randomInt(1, 18, randomFn);
  const c = b + diffA * x;
  const dTerm = d === 1 ? 'x' : `${d}x`;

  return buildTopicQuestion(
    'de4_1',
    `${a}x + ${b} = ${dTerm} + ${c} | x = ?`,
    x,
    difficulty,
    [
      `Weg 1 (Sortieren): ${a}x - ${dTerm} = ${c} - ${b}, also ${diffA}x = ${c - b} -> x = ${x}.`,
      `Weg 2 (Waage-Probe mit x = ${x}): Links ${a} · ${x} + ${b} = ${a * x + b}, rechts ${d} · ${x} + ${c} = ${d * x + c}.`
    ]
  );
}

/**
 * DE 4.2 Lineare Gleichungssysteme.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe4_2(difficulty, randomFn) {
  const variants = difficulty === 1 ? ['sumDiff', 'subst'] : ['sumDiff', 'subst', 'elim'];
  const variant = pickRandom(variants, randomFn);

  if (variant === 'sumDiff') {
    const y = randomInt(1, difficulty === 1 ? 7 : 12, randomFn);
    const x = y + randomInt(1, difficulty === 1 ? 8 : 12, randomFn);
    const sum = x + y;
    const diff = x - y;
    const askY = difficulty >= 2 && safeRandom(randomFn) < 0.45;

    if (askY) {
      return buildTopicQuestion(
        'de4_2',
        `x + y = ${sum}, x - y = ${diff} | y = ?`,
        y,
        difficulty,
        [
          `Weg 1 (Subtrahieren): (${sum}) - (${diff}) eliminiert x und ergibt 2y = ${sum - diff}, also y = ${y}.`,
          `Weg 2 (Erst x bestimmen): x = (${sum} + ${diff}) : 2 = ${x}, dann y = ${sum} - ${x} = ${y}.`
        ]
      );
    }

    return buildTopicQuestion(
      'de4_2',
      `x + y = ${sum}, x - y = ${diff} | x = ?`,
      x,
      difficulty,
      [
        `Weg 1 (Additionsverfahren): (x + y) + (x - y) = ${sum} + ${diff}, also 2x = ${sum + diff} -> x = ${x}.`,
        `Weg 2 (Einsetzen): y = ${sum} - x einsetzen ergibt x - (${sum} - x) = ${diff}, also 2x = ${sum + diff} -> x = ${x}.`
      ]
    );
  }

  if (variant === 'subst') {
    const k = randomInt(2, difficulty === 1 ? 3 : 5, randomFn);
    const a = randomInt(1, difficulty === 1 ? 2 : 4, randomFn);
    const x = randomInt(1, difficulty === 1 ? 8 : 12, randomFn);
    const y = k * x;
    const total = (a + k) * x;
    const aTerm = a === 1 ? 'x' : `${a}x`;
    const askY = difficulty >= 2 && safeRandom(randomFn) < 0.4;
    const ans = askY ? y : x;
    const targetVar = askY ? 'y' : 'x';

    const aShares = a === 1 ? '1 Anteil' : `${a} Anteile`;
    return buildTopicQuestion(
      'de4_2',
      `y = ${k}x, ${aTerm} + y = ${total} | ${targetVar} = ?`,
      ans,
      difficulty,
      [
        `Weg 1 (Einsetzen): ${aTerm} + ${k}x = ${total}, also ${a + k}x = ${total} -> x = ${x}${askY ? `, y = ${k} · ${x} = ${y}` : ''}.`,
        `Weg 2 (Anteile zählen): ${aShares} für x plus ${k} Anteile für y sind ${a + k} Anteile = ${total}, ein Anteil = ${x}${askY ? `, y = ${y}` : ''}.`
      ]
    );
  }

  const x = randomInt(1, 12, randomFn);
  const y = randomInt(1, 9, randomFn);
  const b = randomInt(1, 3, randomFn);
  const a = b + randomInt(1, 4, randomFn);
  const c1 = x + a * y;
  const c2 = x + b * y;
  const bTerm = b === 1 ? 'y' : `${b}y`;
  const askX = safeRandom(randomFn) < 0.45;
  const ans = askX ? x : y;
  const targetVar = askX ? 'x' : 'y';

  return buildTopicQuestion(
    'de4_2',
    `x + ${a}y = ${c1}, x + ${bTerm} = ${c2} | ${targetVar} = ?`,
    ans,
    difficulty,
    [
      `Weg 1 (Subtraktionsverfahren): Gleichungen abziehen ergibt ${a - b}y = ${c1 - c2}, also y = ${y}${askX ? ` und x = ${c2} - ${b * y} = ${x}` : ''}.`,
      `Weg 2 (Einsetzen): x = ${c2} - ${bTerm} in Gleichung 1 liefert ${c2} + ${a - b}y = ${c1} -> y = ${y}${askX ? `, x = ${x}` : ''}.`
    ]
  );
}

/**
 * DE 5.1 Funktionen (Geraden): Funktionswerte, Nullstellen, Steigung.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe5_1(difficulty, randomFn) {
  const variants = difficulty === 1 ? ['eval', 'zero'] : ['eval', 'zero', 'slope'];
  const variant = pickRandom(variants, randomFn);

  if (variant === 'eval') {
    const m = randomInt(2, difficulty === 1 ? 5 : 9, randomFn);
    const x0 = randomInt(1, difficulty === 1 ? 7 : 12, randomFn);
    const isMinus = safeRandom(randomFn) < 0.45;
    const maxC = isMinus ? Math.min(20, m * x0) : difficulty === 1 ? 12 : 25;
    const c = randomInt(1, Math.max(1, maxC), randomFn);
    const sign = isMinus ? '-' : '+';
    const ans = isMinus ? m * x0 - c : m * x0 + c;
    const yAxis = isMinus ? `-${c}` : `${c}`;

    const stepLabel = x0 === 1 ? '1 Schritt' : `${x0} Schritte`;
    return buildTopicQuestion(
      'de5_1',
      `f(x) = ${m}x ${sign} ${c} | f(${x0}) = ?`,
      ans,
      difficulty,
      [
        `Weg 1 (Direkt einsetzen): f(${x0}) = ${m} · ${x0} ${sign} ${c} = ${m * x0} ${sign} ${c} = ${ans}.`,
        `Weg 2 (Startwert und Steigung): Start bei f(0) = ${yAxis}, plus ${stepLabel} mal Steigung ${m} (+${m * x0}) = ${ans}.`
      ]
    );
  }

  if (variant === 'zero') {
    const m = randomInt(2, difficulty === 1 ? 6 : 12, randomFn);
    const x0 = randomInt(1, difficulty === 1 ? 9 : 15, randomFn);
    const b = m * x0;

    return buildTopicQuestion(
      'de5_1',
      `Nullstelle: f(x) = ${m}x - ${b} | x = ?`,
      x0,
      difficulty,
      [
        `Weg 1 (Null setzen): ${m}x - ${b} = 0 -> ${m}x = ${b} -> x = ${b} : ${m} = ${x0}.`,
        `Weg 2 (Steigungsschritte): Von f(0) = -${b} wächst y pro Schritt um ${m}; bis 0 braucht es ${b} : ${m} = ${x0} Schritte.`
      ]
    );
  }

  const m = randomInt(2, difficulty === 2 ? 8 : 12, randomFn);
  const c = randomInt(1, 15, randomFn);
  const x0 = randomInt(2, 8, randomFn);
  const y0 = m * x0 + c;

  return buildTopicQuestion(
    'de5_1',
    `f(x) = mx + ${c} mit f(${x0}) = ${y0} | m = ?`,
    m,
    difficulty,
    [
      `Weg 1 (Gleichung umstellen): m · ${x0} + ${c} = ${y0} -> m · ${x0} = ${y0 - c} -> m = ${m}.`,
      `Weg 2 (Steigungsdreieck): Von f(0) = ${c} bis f(${x0}) = ${y0} steigt y um ${y0 - c} auf ${x0} Einheiten: ${y0 - c} : ${x0} = ${m}.`
    ]
  );
}

/**
 * DE 5.2 Funktionen (Fortgeschritten): Scheitelpunktform, Minimum, Nullstellen von Parabeln.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe5_2(difficulty, randomFn) {
  const variants = difficulty === 1
    ? ['vertexX', 'minY', 'posZero']
    : ['vertexX', 'minY', 'posZero', 'evalQuad'];
  const variant = pickRandom(variants, randomFn);

  if (variant === 'vertexX') {
    const xs = randomInt(1, difficulty === 1 ? 9 : 15, randomFn);
    const ys = randomInt(1, 20, randomFn);
    const a = difficulty >= 2 ? randomInt(1, 4, randomFn) : 1;
    const prefix = a === 1 ? '' : `${a}`;

    return buildTopicQuestion(
      'de5_2',
      `Scheitel-x: f(x) = ${prefix}(x - ${xs})² + ${ys} | x = ?`,
      xs,
      difficulty,
      [
        `Weg 1 (Scheitelpunktform): Bei (x - d)² + e liegt der Scheitel bei x = d, also ist x = ${xs}.`,
        `Weg 2 (Klammer null setzen): Das Quadrat wird am kleinsten für x - ${xs} = 0, daher x = ${xs}.`
      ]
    );
  }

  if (variant === 'minY') {
    const xs = randomInt(1, 12, randomFn);
    const ys = randomInt(1, difficulty === 1 ? 12 : 25, randomFn);
    const a = difficulty >= 2 ? randomInt(1, 4, randomFn) : 1;
    const prefix = a === 1 ? '' : `${a}`;

    return buildTopicQuestion(
      'de5_2',
      `Minimum-y: f(x) = ${prefix}(x - ${xs})² + ${ys} | y = ?`,
      ys,
      difficulty,
      [
        `Weg 1 (Scheitelpunktform): Der hintere Summand e gibt direkt den kleinsten y-Wert an, hier y = ${ys}.`,
        `Weg 2 (Abschätzung): Ein Quadrat ist mindestens 0 (bei x = ${xs}), daher f(${xs}) = 0 + ${ys} = ${ys}.`
      ]
    );
  }

  if (variant === 'posZero') {
    const r = randomInt(2, difficulty === 1 ? 9 : 15, randomFn);
    const a = difficulty === 3 ? randomInt(2, 4, randomFn) : 1;
    const c = a * r * r;
    const aPrefix = a === 1 ? '' : `${a}`;

    const step1 = a === 1
      ? `Weg 1 (Wurzel ziehen): x² - ${c} = 0 -> x² = ${c} -> positive Wurzel x = ${r}.`
      : `Weg 1 (Erst durch ${a} teilen): ${a}x² = ${c} -> x² = ${r * r} -> positive Wurzel x = ${r}.`;
    const step2 = a === 1
      ? `Weg 2 (3. Binomische Formel): x² - ${c} = (x - ${r})(x + ${r}) = 0 -> positive Nullstelle x = ${r}.`
      : `Weg 2 (Ausklammern): ${a}(x - ${r})(x + ${r}) = 0 -> positive Nullstelle x = ${r}.`;

    return buildTopicQuestion(
      'de5_2',
      `Pos. Nullstelle: f(x) = ${aPrefix}x² - ${c} | x = ?`,
      r,
      difficulty,
      [step1, step2]
    );
  }

  const xs = randomInt(1, 10, randomFn);
  const delta = randomInt(2, difficulty === 2 ? 5 : 7, randomFn);
  const x0 = xs + delta;
  const ys = randomInt(1, 15, randomFn);
  const sq = delta * delta;
  const ans = sq + ys;

  return buildTopicQuestion(
    'de5_2',
    `f(x) = (x - ${xs})² + ${ys} | f(${x0}) = ?`,
    ans,
    difficulty,
    [
      `Weg 1 (Klammer zuerst): (${x0} - ${xs})² + ${ys} = ${delta}² + ${ys} = ${sq} + ${ys} = ${ans}.`,
      `Weg 2 (Abstand zum Scheitel): Abstand zu x = ${xs} ist ${delta}, Quadrat ${sq} zum Minimum ${ys} addieren ergibt ${ans}.`
    ]
  );
}

/**
 * DE 6.1 Technik - Trigonometrie am Dreieck.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe6_1(difficulty, randomFn) {
  const variant = pickRandom(['pyth', 'sin30', 'cos60', 'tan45'], randomFn);

  if (variant === 'pyth') {
    const triples = {
      1: [[3, 4, 5, 1, 4]],
      2: [[3, 4, 5, 3, 8], [5, 12, 13, 1, 3]],
      3: [[3, 4, 5, 5, 12], [5, 12, 13, 2, 5], [8, 15, 17, 1, 3]]
    };
    const [ta, tb, tc, minK, maxK] = pickRandom(triples[difficulty], randomFn);
    const k = randomInt(minK, maxK, randomFn);
    const a = ta * k;
    const b = tb * k;
    const c = tc * k;

    const findSideB = difficulty >= 2 && safeRandom(randomFn) < 0.45;
    if (findSideB) {
      return buildTopicQuestion(
        'de6_1',
        `Dreieck (90°): a = ${a}, Hypotenuse c = ${c} | b = ?`,
        b,
        difficulty,
        [
          `Weg 1 (Tripel ${ta}-${tb}-${tc}): a und c sind das ${k}-fache von ${ta} und ${tc}, also b = ${k} · ${tb} = ${b}.`,
          `Weg 2 (3. Binom bei c² - a²): (${c} - ${a}) · (${c} + ${a}) = ${c - a} · ${c + a} = ${b * b}, Wurzel ist ${b}.`
        ]
      );
    }

    return buildTopicQuestion(
      'de6_1',
      `Dreieck (90°): a = ${a}, b = ${b} | c = ?`,
      c,
      difficulty,
      [
        `Weg 1 (Tripel ${ta}-${tb}-${tc}): Katheten sind das ${k}-fache von ${ta} und ${tb}, also c = ${k} · ${tc} = ${c}.`,
        `Weg 2 (Pythagoras): ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}, Wurzel daraus ist ${c}.`
      ]
    );
  }

  if (variant === 'sin30') {
    const a = randomInt(3, difficulty === 1 ? 15 : 35, randomFn);
    const c = 2 * a;
    const findHyp = difficulty >= 2 && safeRandom(randomFn) < 0.45;

    if (findHyp) {
      return buildTopicQuestion(
        'de6_1',
        `sin(30°) = 0,5, Gegenkathete a = ${a} | c = ?`,
        c,
        difficulty,
        [
          `Weg 1 (Formel umstellen): c = a : sin(30°) = ${a} : 0,5 = ${a} · 2 = ${c}.`,
          `Weg 2 (Geometrie): Bei 30° ist die Hypotenuse doppelt so lang wie die Gegenkathete: 2 · ${a} = ${c}.`
        ]
      );
    }

    return buildTopicQuestion(
      'de6_1',
      `sin(30°) = 0,5, c = ${c} | a = ?`,
      a,
      difficulty,
      [
        `Weg 1 (Sinus-Formel): a = c · sin(30°) = ${c} · 0,5 = ${a}.`,
        `Weg 2 (Halbes gleichseitiges Dreieck): Bei 30° ist die Gegenkathete halb so lang wie c: ${c} : 2 = ${a}.`
      ]
    );
  }

  if (variant === 'cos60') {
    const b = randomInt(3, difficulty === 1 ? 15 : 35, randomFn);
    const c = 2 * b;
    const findHyp = difficulty >= 2 && safeRandom(randomFn) < 0.45;

    if (findHyp) {
      return buildTopicQuestion(
        'de6_1',
        `cos(60°) = 0,5, Ankathete b = ${b} | c = ?`,
        c,
        difficulty,
        [
          `Weg 1 (Formel umstellen): c = b : cos(60°) = ${b} : 0,5 = ${b} · 2 = ${c}.`,
          `Weg 2 (Verdoppeln): Da cos(60°) = 1/2 gilt, ist c genau das Doppelte von ${b}: ${c}.`
        ]
      );
    }

    return buildTopicQuestion(
      'de6_1',
      `cos(60°) = 0,5, c = ${c} | b = ?`,
      b,
      difficulty,
      [
        `Weg 1 (Cosinus-Formel): b = c · cos(60°) = ${c} · 0,5 = ${b}.`,
        `Weg 2 (Komplementwinkel): cos(60°) = sin(30°) = 0,5, daher Hälfte von ${c} = ${b}.`
      ]
    );
  }

  const side = randomInt(4, difficulty === 1 ? 18 : 45, randomFn);
  return buildTopicQuestion(
    'de6_1',
    `Dreieck (90°, alpha = 45°): Ankathete b = ${side} | a = ?`,
    side,
    difficulty,
    [
      `Weg 1 (Tangens): a = b · tan(45°) = ${side} · 1 = ${side}.`,
      `Weg 2 (Gleichschenklig): Bei 45° sind beide Winkel an der Hypotenuse gleich, also gilt a = b = ${side}.`
    ]
  );
}

/**
 * DE 6.2 Technik - Trigonometrische Funktionen.
 * @param {number} difficulty
 * @param {() => number} randomFn
 */
function generateDe6_2(difficulty, randomFn) {
  const variants = difficulty === 1
    ? ['amplitude', 'periodB', 'exactVal']
    : ['amplitude', 'periodB', 'exactVal', 'maxVal'];
  const variant = pickRandom(variants, randomFn);

  if (variant === 'amplitude') {
    const amp = randomInt(2, difficulty === 1 ? 9 : 25, randomFn);
    const b = randomInt(2, 9, randomFn);
    const fn = pickRandom(['sin', 'cos'], randomFn);
    const shift = difficulty >= 2 ? randomInt(1, 12, randomFn) : 0;
    const shiftText = shift > 0 ? ` + ${shift}` : '';
    const shiftHint = shift > 0 ? ' + d' : '';

    return buildTopicQuestion(
      'de6_2',
      `Amplitude: f(x) = ${amp} · ${fn}(${b}x)${shiftText} | A = ?`,
      amp,
      difficulty,
      [
        `Weg 1 (Parameter ablesen): In A · ${fn}(bx)${shiftHint} steht die Amplitude als Faktor vor ${fn}, also A = ${amp}.`,
        `Weg 2 (Wertebereich): ${fn} pendelt zwischen -1 und +1; mit Faktor ${amp} beträgt der Ausschlag zur Mittellinie ${amp}.`
      ]
    );
  }

  if (variant === 'periodB') {
    const b = randomInt(2, difficulty === 1 ? 7 : 14, randomFn);
    const amp = difficulty >= 2 ? randomInt(2, 8, randomFn) : 1;
    const fn = pickRandom(['sin', 'cos'], randomFn);
    const ampPrefix = amp === 1 ? '' : `${amp} · `;

    return buildTopicQuestion(
      'de6_2',
      `Periode 2π / b bei f(x) = ${ampPrefix}${fn}(${b}x) | b = ?`,
      b,
      difficulty,
      [
        `Weg 1 (Parameter b): In ${fn}(b · x) ist b der Faktor direkt vor x, hier also b = ${b}.`,
        `Weg 2 (Schwingungen): Auf der Strecke 2π passen genau ${b} volle Perioden, deshalb Periode 2π / ${b} (b = ${b}).`
      ]
    );
  }

  if (variant === 'exactVal') {
    const kind = pickRandom(['sin30', 'cos60', 'sin90', 'cos0', 'tan45', 'zero'], randomFn);
    if (kind === 'sin30') {
      const ans = randomInt(2, difficulty === 1 ? 12 : 25, randomFn);
      const k = 2 * ans;
      return buildTopicQuestion(
        'de6_2',
        `${k} · sin(30°) = ?`,
        ans,
        difficulty,
        [
          `Weg 1 (Standardwert): sin(30°) = 0,5, also ${k} · 0,5 = ${ans}.`,
          `Weg 2 (Halbieren): Multiplikation mit sin(30°) = 1/2 bedeutet teilen durch 2: ${k} : 2 = ${ans}.`
        ]
      );
    }

    if (kind === 'cos60') {
      const ans = randomInt(2, difficulty === 1 ? 12 : 25, randomFn);
      const k = 2 * ans;
      return buildTopicQuestion(
        'de6_2',
        `${k} · cos(60°) = ?`,
        ans,
        difficulty,
        [
          `Weg 1 (Standardwert): cos(60°) = 0,5, also ${k} · 0,5 = ${ans}.`,
          `Weg 2 (Komplementwinkel): cos(60°) = sin(30°) = 1/2, daher ${k} : 2 = ${ans}.`
        ]
      );
    }

    if (kind === 'sin90' || kind === 'cos0' || kind === 'tan45') {
      const k = randomInt(3, difficulty === 1 ? 15 : 30, randomFn);
      const expr = kind === 'sin90' ? 'sin(90°)' : kind === 'cos0' ? 'cos(0°)' : 'tan(45°)';
      const step2 = kind === 'tan45'
        ? `Weg 2 (Dreieck): Bei 45° sind Gegen- und Ankathete gleich lang, somit tan(45°) = 1 und ${k} · 1 = ${k}.`
        : `Weg 2 (Einheitskreis): Bei ${kind === 'sin90' ? '90° für sin' : '0° für cos'} liegt der Maximalwert 1 vor -> ${k}.`;

      return buildTopicQuestion(
        'de6_2',
        `${k} · ${expr} = ?`,
        k,
        difficulty,
        [
          `Weg 1 (Funktionswert): ${expr} = 1, also ${k} · 1 = ${k}.`,
          step2
        ]
      );
    }

    const k = randomInt(3, 25, randomFn);
    const expr = pickRandom(['sin(0°)', 'cos(90°)'], randomFn);
    return buildTopicQuestion(
      'de6_2',
      `${k} · ${expr} = ?`,
      0,
      difficulty,
      [
        `Weg 1 (Funktionswert): ${expr} = 0, also ${k} · 0 = 0.`,
        `Weg 2 (Nullprodukt): Jede Zahl multipliziert mit 0 ergibt 0.`
      ]
    );
  }

  const amp = randomInt(2, 15, randomFn);
  const b = randomInt(2, 6, randomFn);
  const d = randomInt(1, 18, randomFn);
  const fn = pickRandom(['sin', 'cos'], randomFn);
  const ans = amp + d;

  return buildTopicQuestion(
    'de6_2',
    `Maximalwert: f(x) = ${amp} · ${fn}(${b}x) + ${d} | max = ?`,
    ans,
    difficulty,
    [
      `Weg 1 (Maximum von ${fn}): Der größte Wert von ${fn}(${b}x) ist +1, also ${amp} · 1 + ${d} = ${ans}.`,
      `Weg 2 (Mittellinie plus Amplitude): Die Schwingung geht von der Mittellinie ${d} um ${amp} nach oben: ${d} + ${amp} = ${ans}.`
    ]
  );
}

const TOPIC_GENERATORS = {
  de1_1: generateDe1_1,
  de2_1: generateDe2_1,
  de2_2: generateDe2_2,
  de3_1: generateDe3_1,
  de3_2: generateDe3_2,
  de4_1: generateDe4_1,
  de4_2: generateDe4_2,
  de5_1: generateDe5_1,
  de5_2: generateDe5_2,
  de6_1: generateDe6_1,
  de6_2: generateDe6_2
};

// ---------------------------------------------------------------------------
// Öffentliche Engine-API
// ---------------------------------------------------------------------------

/**
 * Bestimmt die Schwierigkeitsstufe (1-3) anhand des aktuellen Punktestands.
 * @param {number} score
 * @returns {number}
 */
export function getDifficultyForScore(score) {
  if (score < 5) return 1;
  if (score < 12) return 2;
  return 3;
}

/**
 * Generiert eine klassische V1.1 Mathe-Aufgabe gemäß festem 5-Key-Datenvertrag.
 * @param {number} [difficulty=1]
 * @param {() => number} [randomFn=Math.random]
 * @returns {{ id: string, category: string, questionText: string, correctAnswer: number, difficulty: number }}
 */
export function generateQuestion(difficulty = 1, randomFn = Math.random) {
  const level = Math.min(3, Math.max(1, Number(difficulty) || 1));
  const generators = [
    generateSquareQuestion,
    generatePowerQuestion,
    generateLinearQuestion,
    generatePercentQuestion
  ];
  const generator = pickRandom(generators, randomFn);
  return generator(level, randomFn);
}

/**
 * Generiert eine Aufgabe für eine der 11 Themen-IDs inklusive Lösungswegen.
 * @param {string} topicId
 * @param {number} [difficulty=1]
 * @param {() => number} [randomFn=Math.random]
 */
export function generateTopicQuestion(topicId, difficulty = 1, randomFn = Math.random) {
  const generator = TOPIC_GENERATORS[topicId];
  if (!generator) {
    throw new Error(`Unbekannte Themen-ID: ${String(topicId)}`);
  }
  const level = normalizeDifficulty(difficulty);
  return generator(level, randomFn);
}

/**
 * Wählt eine Themen-ID anhand aktiver Themen und Gewichte (Weighted Random).
 * @param {string[] | null | undefined} activeTopicIds
 * @param {Record<string, number>} [weights={}]
 * @param {() => number} [randomFn=Math.random]
 * @returns {string | null}
 */
export function pickTopic(activeTopicIds, weights = {}, randomFn = Math.random) {
  let pool;
  if (activeTopicIds === undefined || activeTopicIds === null) {
    pool = TOPICS.map((topic) => topic.id);
  } else {
    const rawList = Array.isArray(activeTopicIds) ? activeTopicIds : [];
    if (rawList.length === 0) return null;
    pool = [...new Set(rawList.filter((id) => TOPIC_MAP.has(id)))];
    if (pool.length === 0) return null;
  }

  const weighted = pool.map((id) => {
    const rawWeight = Number(weights?.[id]);
    const weight = Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1.0;
    return { id, weight };
  });

  const totalWeight = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  const target = safeRandom(randomFn) * totalWeight;

  let acc = 0;
  for (const entry of weighted) {
    acc += entry.weight;
    if (target < acc) {
      return entry.id;
    }
  }

  return weighted[weighted.length - 1].id;
}

/**
 * Wählt ein gewichtetes Thema und generiert direkt die passende Aufgabe.
 * @param {string[] | null | undefined} activeTopicIds
 * @param {Record<string, number>} [weights={}]
 * @param {number} [difficulty=1]
 * @param {() => number} [randomFn=Math.random]
 */
export function generateWeightedQuestion(activeTopicIds, weights = {}, difficulty = 1, randomFn = Math.random) {
  const topicId = pickTopic(activeTopicIds, weights, randomFn);
  if (!topicId) return null;
  return generateTopicQuestion(topicId, difficulty, randomFn);
}

/**
 * Prüft eine Nutzereingabe gegen die korrekte Antwort einer Aufgabe.
 * Unterstützt sowohl question.correctAnswer als auch question.answer.
 * @param {{ correctAnswer?: number, answer?: number }} question
 * @param {string | number} rawInput
 * @returns {{ isCorrect: boolean, correctAnswer: number, userAnswer: number | null }}
 */
export function checkAnswer(question, rawInput) {
  const expectedAnswer = question?.correctAnswer ?? question?.answer;
  const trimmed = String(rawInput ?? '').trim();
  if (trimmed === '') {
    return {
      isCorrect: false,
      correctAnswer: expectedAnswer,
      userAnswer: null
    };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return {
      isCorrect: false,
      correctAnswer: expectedAnswer,
      userAnswer: null
    };
  }

  return {
    isCorrect: parsed === expectedAnswer,
    correctAnswer: expectedAnswer,
    userAnswer: parsed
  };
}

/**
 * Formatiert ein Date-Objekt als lokales Datum (YYYY-MM-DD).
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Berechnet die Differenz in Kalendertagen zwischen zwei YYYY-MM-DD-Strings.
 * @param {string} earlierStr
 * @param {string} laterStr
 * @returns {number | null}
 */
function diffCalendarDays(earlierStr, laterStr) {
  const earlierParts = earlierStr.split('-').map(Number);
  const laterParts = laterStr.split('-').map(Number);
  if (earlierParts.length !== 3 || laterParts.length !== 3) return null;

  const t1 = Date.UTC(earlierParts[0], earlierParts[1] - 1, earlierParts[2]);
  const t2 = Date.UTC(laterParts[0], laterParts[1] - 1, laterParts[2]);
  if (!Number.isFinite(t1) || !Number.isFinite(t2)) return null;

  return Math.round((t2 - t1) / 86400000);
}

/**
 * Normalisiert eine Timer-Dauer auf eine gültige Stufe aus TIMER_DURATIONS.
 * @param {number} durationSeconds
 * @returns {number}
 */
function normalizeTimerDuration(durationSeconds) {
  const parsed = Number(durationSeconds);
  return TIMER_DURATIONS.includes(parsed) ? parsed : GAME_DURATION_SECONDS;
}

/**
 * Berechnet das aktualisierte Nutzerprofil (Streak & Highscore) nach Spielende.
 * Bei score === 0 bleiben streak und lastPlayedDate unverändert.
 * Optionaler 4. Parameter unterstützt Multi-Timer-Highscores ohne Veränderung des Standard-Rückgabeobjekts.
 * @param {{ streak: number, highScore: number, lastPlayedDate: string | null }} currentProfile
 * @param {number} score
 * @param {string} [todayStr=getLocalDateString()]
 * @param {{ durationSeconds?: number, highScores?: Record<number, number> }} [options]
 */
export function updateUserProfile(currentProfile, score, todayStr = getLocalDateString(), options = undefined) {
  const prevStreak = Number.isInteger(currentProfile?.streak) && currentProfile.streak >= 0
    ? currentProfile.streak
    : 0;
  const prevHighScore = Number.isInteger(currentProfile?.highScore) && currentProfile.highScore >= 0
    ? currentProfile.highScore
    : 0;
  const lastPlayed = typeof currentProfile?.lastPlayedDate === 'string' && currentProfile.lastPlayedDate.length > 0
    ? currentProfile.lastPlayedDate
    : null;

  const safeScore = Math.max(0, Math.floor(Number(score) || 0));

  let baseResult;
  if (safeScore === 0) {
    baseResult = {
      profile: {
        streak: prevStreak,
        highScore: prevHighScore,
        lastPlayedDate: lastPlayed
      },
      isNewHighScore: false,
      streakIncreased: false
    };
  } else {
    let nextStreak = 1;
    let streakIncreased = false;

    if (lastPlayed === todayStr) {
      nextStreak = Math.max(1, prevStreak);
      streakIncreased = prevStreak === 0;
    } else if (lastPlayed !== null) {
      const days = diffCalendarDays(lastPlayed, todayStr);
      if (days === 1) {
        nextStreak = prevStreak + 1;
        streakIncreased = true;
      } else if (days !== null && days < 0) {
        nextStreak = Math.max(1, prevStreak);
      } else {
        nextStreak = 1;
        streakIncreased = prevStreak === 0;
      }
    } else {
      nextStreak = 1;
      streakIncreased = true;
    }

    const isNewHighScore = safeScore > prevHighScore;
    const nextHighScore = Math.max(prevHighScore, safeScore);

    baseResult = {
      profile: {
        streak: nextStreak,
        highScore: nextHighScore,
        lastPlayedDate: todayStr
      },
      isNewHighScore,
      streakIncreased
    };
  }

  if (options === undefined || options === null) {
    return baseResult;
  }

  const durationSeconds = normalizeTimerDuration(options?.durationSeconds);
  const nextHighScores = {};
  for (const dur of TIMER_DURATIONS) {
    const rawExisting = Number(options?.highScores?.[dur]);
    const fallback = dur === GAME_DURATION_SECONDS ? prevHighScore : 0;
    nextHighScores[dur] = Number.isInteger(rawExisting) && rawExisting >= 0 ? rawExisting : fallback;
  }

  const prevDurationHighScore = nextHighScores[durationSeconds];
  const isNewDurationHighScore = safeScore > 0 && safeScore > prevDurationHighScore;
  if (safeScore > 0) {
    nextHighScores[durationSeconds] = Math.max(prevDurationHighScore, safeScore);
  }

  const nextLegacyHighScore = durationSeconds === GAME_DURATION_SECONDS
    ? baseResult.profile.highScore
    : prevHighScore;

  return {
    profile: {
      ...baseResult.profile,
      highScore: nextLegacyHighScore
    },
    isNewHighScore: isNewDurationHighScore,
    streakIncreased: baseResult.streakIncreased,
    durationSeconds,
    highScores: nextHighScores,
    isNewDurationHighScore
  };
}

/**
 * Liefert einen zufälligen Mathe-Fun-Fact aus der Liste.
 * @param {() => number} [randomFn=Math.random]
 * @returns {{ index: number, text: string }}
 */
export function getRandomFunFact(randomFn = Math.random) {
  const index = Math.floor(safeRandom(randomFn) * MATH_FUN_FACTS.length);
  return {
    index,
    text: MATH_FUN_FACTS[index]
  };
}

// ---------------------------------------------------------------------------
// Spiel-Verlauf (Session-History) & PPM
// ---------------------------------------------------------------------------

/**
 * Erzeugt eine leere Session-History.
 * @returns {Array}
 */
export function createSessionHistory() {
  return [];
}

/**
 * Erzeugt einen strukturierten Verlaufs-Eintrag aus Aufgabe und Prüfergebnis.
 * @param {Record<string, any>} question
 * @param {{ isCorrect?: boolean, userAnswer?: number | null }} checkResult
 */
export function createHistoryEntry(question, checkResult) {
  return {
    topicId: question?.topicId ?? null,
    topicLabel: question?.topicLabel ?? question?.category ?? '',
    question: question?.question ?? question?.questionText ?? '',
    correctAnswer: question?.correctAnswer ?? question?.answer ?? null,
    userAnswer: checkResult?.userAnswer ?? null,
    isCorrect: Boolean(checkResult?.isCorrect),
    steps: Array.isArray(question?.steps) ? [...question.steps] : [],
    markedAsGap: false
  };
}

/**
 * Fügt ein Prüfergebnis unveränderlich (immutabel) an die Session-History an.
 * @param {Array} history
 * @param {Record<string, any>} question
 * @param {{ isCorrect?: boolean, userAnswer?: number | null }} checkResult
 * @returns {Array}
 */
export function recordSessionAnswer(history, question, checkResult) {
  const safeHistory = Array.isArray(history) ? history : [];
  return [...safeHistory, createHistoryEntry(question, checkResult)];
}

/**
 * Markiert oder entmarkiert einen Eintrag in der Session-History als Wissenslücke.
 * @param {Array} history
 * @param {number} index
 * @param {boolean} [marked=true]
 * @returns {Array}
 */
export function setHistoryGap(history, index, marked = true) {
  const safeHistory = Array.isArray(history) ? history : [];
  if (!Number.isInteger(index) || index < 0 || index >= safeHistory.length) {
    return [...safeHistory];
  }

  return safeHistory.map((entry, idx) => (
    idx === index ? { ...entry, markedAsGap: Boolean(marked) } : entry
  ));
}

/**
 * Berechnet richtige Antworten pro Minute (PPM), auf 1 Nachkommastelle gerundet.
 * @param {number} correctCount
 * @param {number} [durationSeconds=GAME_DURATION_SECONDS]
 * @returns {number}
 */
export function calculatePpm(correctCount, durationSeconds = GAME_DURATION_SECONDS) {
  const safeCorrect = Number(correctCount);
  const safeDuration = Number(durationSeconds);
  if (!Number.isFinite(safeCorrect) || safeCorrect <= 0) return 0;
  if (!Number.isFinite(safeDuration) || safeDuration <= 0) return 0;
  return Math.round(((safeCorrect / safeDuration) * 60) * 10) / 10;
}

/**
 * Erstellt die Gesamtauswertung einer Spielrunde.
 * @param {Array} history
 * @param {number} [durationSeconds=GAME_DURATION_SECONDS]
 * @returns {{ total: number, correctCount: number, wrongCount: number, accuracyPercent: number, ppm: number, durationSeconds: number }}
 */
export function summarizeSession(history, durationSeconds = GAME_DURATION_SECONDS) {
  const safeHistory = Array.isArray(history) ? history : [];
  const total = safeHistory.length;
  const correctCount = safeHistory.filter((entry) => Boolean(entry?.isCorrect)).length;
  const wrongCount = total - correctCount;
  const accuracyPercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const rawDuration = Number(durationSeconds);
  const safeDuration = Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : 0;
  const ppm = calculatePpm(correctCount, safeDuration);

  return {
    total,
    correctCount,
    wrongCount,
    accuracyPercent,
    ppm,
    durationSeconds: safeDuration
  };
}
```

## ui.js

```javascript
/**
 * Präsentationsschicht (UI & Events)
 * Steuert ausschließlich DOM-Updates, Timer-Anzeige, semantische data-Attribute und Nutzer-Events.
 * Enthält keine eigenen Mathe-Regeln, kein Styling-Klassen-Umschalten und keinen direkten Speicherzugriff.
 */

import { loadUserData, saveUserData } from './storage.js';
import {
  GAME_DURATION_SECONDS,
  generateQuestion,
  getDifficultyForScore,
  checkAnswer,
  updateUserProfile,
  getRandomFunFact
} from './engine.js';

const els = {
  startStreak: document.getElementById('start-streak'),
  startHighscore: document.getElementById('start-highscore'),
  btnStart: document.getElementById('btn-start'),

  gameTimer: document.getElementById('game-timer'),
  gameScore: document.getElementById('game-score'),
  gameProgress: document.getElementById('game-progress'),
  questionCard: document.getElementById('question-card'),
  questionCategory: document.getElementById('question-category'),
  questionText: document.getElementById('question-text'),
  answerBox: document.getElementById('answer-box'),
  answerDisplay: document.getElementById('answer-display'),
  keypad: document.getElementById('keypad'),

  endHighscoreBadge: document.getElementById('end-highscore-badge'),
  endScore: document.getElementById('end-score'),
  endAccuracy: document.getElementById('end-accuracy'),
  endStreak: document.getElementById('end-streak'),
  endHighscore: document.getElementById('end-highscore'),
  endFunFact: document.getElementById('end-fun-fact'),
  btnReplay: document.getElementById('btn-replay'),
  btnHome: document.getElementById('btn-home')
};

const state = {
  isPlaying: false,
  timeLeft: GAME_DURATION_SECONDS,
  timerId: null,
  feedbackTimerId: null,
  score: 0,
  attempts: 0,
  currentQuestion: null,
  inputBuffer: '',
  userProfile: { streak: 0, highScore: 0, lastPlayedDate: null }
};

function showScreen(name) {
  document.body.dataset.screen = name;
}

function renderProfileOnStart() {
  els.startStreak.textContent = String(state.userProfile.streak);
  els.startHighscore.textContent = String(state.userProfile.highScore);
}

function renderAnswerBuffer() {
  const isEmpty = state.inputBuffer.length === 0;
  els.answerDisplay.textContent = isEmpty ? '_' : state.inputBuffer;
  els.answerDisplay.dataset.empty = String(isEmpty);
}

function renderTimer() {
  els.gameTimer.textContent = `${state.timeLeft}s`;
  const ratio = Math.max(0, state.timeLeft / GAME_DURATION_SECONDS) * 100;
  els.gameProgress.style.width = `${ratio}%`;

  const isLow = state.timeLeft <= 10;
  els.gameTimer.dataset.state = isLow ? 'low' : 'normal';
  els.gameProgress.dataset.state = isLow ? 'low' : 'normal';
}

function loadNextQuestion() {
  const difficulty = getDifficultyForScore(state.score);
  state.currentQuestion = generateQuestion(difficulty);
  state.inputBuffer = '';

  els.questionCategory.textContent = state.currentQuestion.category;
  els.questionText.textContent = state.currentQuestion.questionText;
  renderAnswerBuffer();
}

function resetCardFeedback() {
  if (state.feedbackTimerId !== null) {
    clearTimeout(state.feedbackTimerId);
    state.feedbackTimerId = null;
  }
  els.questionCard.dataset.feedback = 'none';
}

function triggerCardFeedback(isCorrect) {
  resetCardFeedback();
  void els.questionCard.offsetWidth;

  els.questionCard.dataset.feedback = isCorrect ? 'correct' : 'wrong';

  state.feedbackTimerId = setTimeout(() => {
    els.questionCard.dataset.feedback = 'none';
    state.feedbackTimerId = null;
  }, 260);
}

function handleCorrectAnswer() {
  state.score += 1;
  state.attempts += 1;
  els.gameScore.textContent = String(state.score);
  triggerCardFeedback(true);
  loadNextQuestion();
}

function handleWrongAnswer() {
  state.attempts += 1;
  triggerCardFeedback(false);
  loadNextQuestion();
}

function appendDigit(digit) {
  if (!state.isPlaying || state.inputBuffer.length >= 6) return;

  if (state.inputBuffer === '0') {
    state.inputBuffer = digit;
  } else {
    state.inputBuffer += digit;
  }
  renderAnswerBuffer();

  // Sofortiges Weitergehen bei exakter Treffer-Übereinstimmung
  const result = checkAnswer(state.currentQuestion, state.inputBuffer);
  if (result.isCorrect) {
    handleCorrectAnswer();
  }
}

function deleteLastDigit() {
  if (!state.isPlaying || state.inputBuffer.length === 0) return;
  state.inputBuffer = state.inputBuffer.slice(0, -1);
  renderAnswerBuffer();
}

function skipCurrentQuestion() {
  if (!state.isPlaying || !state.currentQuestion) return;
  handleWrongAnswer();
}

async function endGame() {
  state.isPlaying = false;
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  resetCardFeedback();

  const updated = updateUserProfile(state.userProfile, state.score);
  state.userProfile = await saveUserData(updated.profile);

  const funFact = getRandomFunFact();

  els.endScore.textContent = String(state.score);
  els.endAccuracy.textContent = `${state.score} von ${state.attempts} Aufgaben richtig`;
  els.endStreak.textContent = String(state.userProfile.streak);
  els.endHighscore.textContent = String(state.userProfile.highScore);
  els.endHighscoreBadge.dataset.visible = String(Boolean(updated.isNewHighScore));
  els.endFunFact.textContent = funFact.text;

  showScreen('end');
}

function startGame() {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  resetCardFeedback();

  state.isPlaying = true;
  state.timeLeft = GAME_DURATION_SECONDS;
  state.score = 0;
  state.attempts = 0;
  state.inputBuffer = '';

  els.gameScore.textContent = '0';
  renderTimer();
  loadNextQuestion();
  showScreen('game');

  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    renderTimer();
    if (state.timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function bindEvents() {
  els.btnStart.addEventListener('click', startGame);
  els.btnReplay.addEventListener('click', startGame);
  els.btnHome.addEventListener('click', () => {
    renderProfileOnStart();
    showScreen('start');
  });

  els.keypad.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const { key, action } = button.dataset;
    if (key !== undefined) {
      appendDigit(key);
    } else if (action === 'backspace') {
      deleteLastDigit();
    } else if (action === 'skip') {
      skipCurrentQuestion();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!state.isPlaying) return;
    if (event.key >= '0' && event.key <= '9') {
      appendDigit(event.key);
    } else if (event.key === 'Backspace') {
      deleteLastDigit();
    } else if (event.key === 'Enter') {
      skipCurrentQuestion();
    }
  });
}

async function init() {
  state.userProfile = await loadUserData();
  renderProfileOnStart();
  bindEvents();
  showScreen('start');

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

init();
```

## sw.js

```javascript
const CACHE_NAME = 'kopfrechen-v2';
const TAILWIND_CDN_URL = 'https://cdn.tailwindcss.com';
const ASSETS = [
  './',
  './index.html',
  './ui.js',
  './engine.js',
  './storage.js',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      try {
        const res = await fetch(new Request(TAILWIND_CDN_URL, { mode: 'no-cors' }));
        if (res && (res.ok || res.type === 'opaque')) {
          await cache.put(TAILWIND_CDN_URL, res);
        }
      } catch {
        // Offline-Installation darf wegen externem CDN nicht abbrechen
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === TAILWIND_CDN_URL) {
    const responsePromise = caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const networkUpdate = fetch(event.request)
        .then(async (networkResponse) => {
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
            await cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(() => undefined);

      if (cachedResponse) {
        return { response: cachedResponse, background: networkUpdate };
      }

      const freshResponse = await networkUpdate;
      return { response: freshResponse || Response.error(), background: Promise.resolve() };
    });

    event.waitUntil(responsePromise.then((result) => result.background).catch(() => {}));
    event.respondWith(responsePromise.then((result) => result.response));
    return;
  }

  if (requestUrl.origin !== self.location.origin) return;

  let cachePutPromise = Promise.resolve();
  const networkPromise = fetch(event.request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
        const responseClone = networkResponse.clone();
        cachePutPromise = caches.open(CACHE_NAME)
          .then((cache) => cache.put(event.request, responseClone))
          .catch(() => {});
      }
      return networkResponse;
    })
    .catch(() => caches.match(event.request));

  event.respondWith(networkPromise);
  event.waitUntil(networkPromise.then(() => cachePutPromise).catch(() => {}));
});
```

## manifest.json

```json
{
  "name": "Kopfrechnen 60s",
  "short_name": "Kopfrechnen",
  "description": "Schnelles 60-Sekunden-Kopfrechentraining für das iPhone.",
  "start_url": "./index.html",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#020617",
  "theme_color": "#020617",
  "lang": "de",
  "icons": [
    {
      "src": "./icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

## icon.svg

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#0f172a"/>
  <rect x="36" y="36" width="440" height="440" rx="88" fill="#1e293b"/>
  <text x="256" y="290" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="210" fill="#38bdf8">x²</text>
</svg>
```

## index.html

```html
<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#020617">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Kopfrechnen">
  <title>Kopfrechnen 60s</title>

  <link rel="manifest" href="./manifest.json">
  <link rel="icon" type="image/svg+xml" href="./icon.svg">
  <link rel="apple-touch-icon" href="./icon.svg">

  <script src="https://cdn.tailwindcss.com"></script>

  <style>
    :root {
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bottom: env(safe-area-inset-bottom, 0px);
      --safe-left: env(safe-area-inset-left, 0px);
      --safe-right: env(safe-area-inset-right, 0px);
    }

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    :where(h1, h2, p) {
      margin: 0;
    }

    :where(button) {
      font: inherit;
      color: inherit;
      margin: 0;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: pointer;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
      min-height: 44px;
      min-width: 44px;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      overscroll-behavior: none;
      -webkit-tap-highlight-color: transparent;
      background-color: #020617;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .app-shell {
      width: 100%;
      max-width: 28rem;
      margin-left: auto;
      margin-right: auto;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100vh;
      height: 100dvh;
      min-height: 0;
      min-width: 0;
      overflow: hidden;
      padding-top: max(1rem, var(--safe-top));
      padding-bottom: max(1rem, var(--safe-bottom));
      padding-left: max(1rem, var(--safe-left));
      padding-right: max(1rem, var(--safe-right));
    }

    /* Screen-Steuerung über body[data-screen] */
    #screen-start,
    #screen-game,
    #screen-end {
      display: none;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
      min-height: 0;
      min-width: 0;
    }

    #screen-start,
    #screen-end {
      overflow-y: auto;
      overscroll-behavior: contain;
      gap: 0.75rem;
      padding-top: 0.5rem;
      padding-bottom: 0.5rem;
    }

    #screen-start > *,
    #screen-end > * {
      flex-shrink: 0;
      min-width: 0;
    }

    #screen-game {
      overflow: hidden;
      gap: 0.5rem;
    }

    body[data-screen="start"] #screen-start,
    body[data-screen="game"] #screen-game,
    body[data-screen="end"] #screen-end {
      display: flex;
    }

    /* Defensives Spielfeld-Layout */
    #screen-game > header {
      flex-shrink: 0;
      min-width: 0;
    }

    #screen-game > div:not(#keypad) {
      display: flex;
      flex: 1 1 auto;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      justify-content: safe center;
      min-height: 0;
      min-width: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
    }

    #keypad {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.5rem;
      flex: 0 0 auto;
      flex-shrink: 0;
      min-width: 0;
      padding-bottom: 0.25rem;
    }

    /* Semantische Zustandsregeln über data-Attribute */
    #game-timer {
      color: #ffffff;
    }

    #game-timer[data-state="normal"] {
      color: #ffffff;
    }

    #game-timer[data-state="low"] {
      color: #fb7185;
    }

    #game-progress {
      height: 100%;
      width: 100%;
      border-radius: 9999px;
      background-color: #38bdf8;
      transition: width 300ms linear, background-color 150ms ease;
    }

    #game-progress[data-state="normal"] {
      background-color: #38bdf8;
    }

    #game-progress[data-state="low"] {
      background-color: #f43f5e;
    }

    #question-card {
      width: 100%;
      flex-shrink: 0;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 1.5rem;
      background-color: rgba(15, 23, 42, 0.9);
      border: 1px solid #1e293b;
      box-shadow: 0 0 0 1px #1e293b;
      padding: 1.25rem 1rem;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }

    #question-card[data-feedback="correct"] {
      border-color: #34d399;
      box-shadow: 0 0 0 2px #34d399, 0 0 20px rgba(52, 211, 153, 0.25);
    }

    #question-card[data-feedback="wrong"] {
      border-color: #f43f5e;
      box-shadow: 0 0 0 2px #f43f5e, 0 0 20px rgba(244, 63, 94, 0.25);
    }

    #question-text,
    #end-fun-fact {
      overflow-wrap: break-word;
    }

    #answer-display[data-empty="true"] {
      color: #64748b;
    }

    #answer-display[data-empty="false"] {
      color: #ffffff;
    }

    #end-highscore-badge[data-visible="false"] {
      display: none;
    }

    #end-highscore-badge[data-visible="true"] {
      display: inline-block;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
    }

    @keyframes pop {
      0% { transform: scale(1); }
      50% { transform: scale(1.04); }
      100% { transform: scale(1); }
    }

    @media (prefers-reduced-motion: no-preference) {
      #question-card[data-feedback="correct"] {
        animation: pop 180ms ease-out;
      }

      #question-card[data-feedback="wrong"] {
        animation: shake 260ms ease-in-out;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      #question-card,
      #game-progress,
      button {
        transition: none;
        animation: none;
      }
    }

    /* Kompakte Höhenanpassung für niedrige Displays wie iPhone SE */
    @media (max-height: 680px) {
      .app-shell {
        padding-top: max(0.5rem, var(--safe-top));
        padding-bottom: max(0.5rem, var(--safe-bottom));
      }

      #screen-start,
      #screen-end {
        gap: 0.5rem;
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
      }

      #screen-game {
        gap: 0.375rem;
      }

      #question-card {
        padding: 0.875rem 1rem;
      }

      #question-text {
        margin-top: 0.5rem;
      }

      #answer-box {
        margin-top: 0.625rem;
        height: 3rem;
      }

      #keypad {
        gap: 0.375rem;
        padding-bottom: 0;
      }

      #keypad .keypad-btn {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        font-size: 1.25rem;
        line-height: 1.75rem;
        min-height: 44px;
        min-width: 44px;
      }

      #keypad button[data-action="skip"] {
        font-size: 0.9375rem;
      }
    }

    /* Basis-Fallback-Regeln bei Offline-Start oder CDN-Ausfall (Spezifität 0) */
    :where(.flex) { display: flex; }
    :where(.flex-col) { flex-direction: column; }
    :where(.flex-1) { flex: 1 1 0%; }
    :where(.shrink-0) { flex-shrink: 0; }
    :where(.min-h-0) { min-height: 0; }
    :where(.items-center) { align-items: center; }
    :where(.items-baseline) { align-items: baseline; }
    :where(.justify-center) { justify-content: center; }
    :where(.justify-between) { justify-content: space-between; }
    :where(.grid) { display: grid; }
    :where(.grid-cols-2) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    :where(.grid-cols-3) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    :where(.gap-1\.5) { gap: 0.375rem; }
    :where(.gap-2) { gap: 0.5rem; }
    :where(.gap-3) { gap: 0.75rem; }
    :where(.space-y-2 > * + *) { margin-top: 0.5rem; }
    :where(.space-y-3 > * + *) { margin-top: 0.75rem; }
    :where(.w-full) { width: 100%; }
    :where(.max-w-md) { max-width: 28rem; }
    :where(.max-w-\[220px\]) { max-width: 220px; }
    :where(.h-full) { height: 100%; }
    :where(.h-1\.5) { height: 0.375rem; }
    :where(.h-14) { height: 3.5rem; }
    :where(.h-16) { height: 4rem; }
    :where(.w-16) { width: 4rem; }
    :where(.mx-auto) { margin-left: auto; margin-right: auto; }
    :where(.mb-2) { margin-bottom: 0.5rem; }
    :where(.mb-4) { margin-bottom: 1rem; }
    :where(.mt-1) { margin-top: 0.25rem; }
    :where(.mt-1\.5) { margin-top: 0.375rem; }
    :where(.mt-2) { margin-top: 0.5rem; }
    :where(.mt-3) { margin-top: 0.75rem; }
    :where(.mt-4) { margin-top: 1rem; }
    :where(.pt-2) { padding-top: 0.5rem; }
    :where(.pt-4) { padding-top: 1rem; }
    :where(.pb-1) { padding-bottom: 0.25rem; }
    :where(.pb-2) { padding-bottom: 0.5rem; }
    :where(.py-1) { padding-top: 0.25rem; padding-bottom: 0.25rem; }
    :where(.py-2) { padding-top: 0.5rem; padding-bottom: 0.5rem; }
    :where(.py-3) { padding-top: 0.75rem; padding-bottom: 0.75rem; }
    :where(.py-3\.5) { padding-top: 0.875rem; padding-bottom: 0.875rem; }
    :where(.py-4) { padding-top: 1rem; padding-bottom: 1rem; }
    :where(.py-5) { padding-top: 1.25rem; padding-bottom: 1.25rem; }
    :where(.px-3) { padding-left: 0.75rem; padding-right: 0.75rem; }
    :where(.px-3\.5) { padding-left: 0.875rem; padding-right: 0.875rem; }
    :where(.px-4) { padding-left: 1rem; padding-right: 1rem; }
    :where(.p-3\.5) { padding: 0.875rem; }
    :where(.p-4) { padding: 1rem; }
    :where(.overflow-hidden) { overflow: hidden; }
    :where(.rounded-xl) { border-radius: 0.75rem; }
    :where(.rounded-2xl) { border-radius: 1rem; }
    :where(.rounded-3xl) { border-radius: 1.5rem; }
    :where(.rounded-full) { border-radius: 9999px; }
    :where(.bg-slate-950) { background-color: #020617; }
    :where(.bg-slate-900) { background-color: #0f172a; }
    :where(.bg-slate-900\/90) { background-color: rgba(15, 23, 42, 0.9); }
    :where(.bg-slate-800) { background-color: #1e293b; }
    :where(.bg-sky-500) { background-color: #0ea5e9; }
    :where(.bg-sky-500\/15) { background-color: rgba(14, 165, 233, 0.15); }
    :where(.bg-amber-400\/15) { background-color: rgba(251, 191, 36, 0.15); }
    :where(.text-center) { text-align: center; }
    :where(.text-xs) { font-size: 0.75rem; line-height: 1rem; }
    :where(.text-sm) { font-size: 0.875rem; line-height: 1.25rem; }
    :where(.text-base) { font-size: 1rem; line-height: 1.5rem; }
    :where(.text-lg) { font-size: 1.125rem; line-height: 1.75rem; }
    :where(.text-xl) { font-size: 1.25rem; line-height: 1.75rem; }
    :where(.text-2xl) { font-size: 1.5rem; line-height: 2rem; }
    :where(.text-3xl) { font-size: 1.875rem; line-height: 2.25rem; }
    :where(.text-5xl) { font-size: 3rem; line-height: 1; }
    :where(.font-medium) { font-weight: 500; }
    :where(.font-semibold) { font-weight: 600; }
    :where(.font-bold) { font-weight: 700; }
    :where(.font-extrabold) { font-weight: 800; }
    :where(.uppercase) { text-transform: uppercase; }
    :where(.tracking-tight) { letter-spacing: -0.025em; }
    :where(.tracking-wide) { letter-spacing: 0.025em; }
    :where(.tracking-wider) { letter-spacing: 0.05em; }
    :where(.leading-relaxed) { line-height: 1.625; }
    :where(.tabular-nums) { font-variant-numeric: tabular-nums; }
    :where(.antialiased) { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    :where(.text-white) { color: #ffffff; }
    :where(.text-slate-950) { color: #020617; }
    :where(.text-slate-100) { color: #f1f5f9; }
    :where(.text-slate-200) { color: #e2e8f0; }
    :where(.text-slate-300) { color: #cbd5e1; }
    :where(.text-slate-400) { color: #94a3b8; }
    :where(.text-sky-400) { color: #38bdf8; }
    :where(.text-sky-300) { color: #7dd3fc; }
    :where(.text-amber-400) { color: #fbbf24; }
    :where(.text-amber-300) { color: #fcd34d; }
    :where(.ring-1) { box-shadow: 0 0 0 1px var(--ring-color, #1e293b); }
    :where(.ring-2) { box-shadow: 0 0 0 2px var(--ring-color, #334155); }
    :where(.ring-slate-800) { --ring-color: #1e293b; }
    :where(.ring-slate-700) { --ring-color: #334155; }
    :where(.ring-sky-400\/30) { --ring-color: rgba(56, 189, 248, 0.3); }
    :where(.ring-amber-400\/30) { --ring-color: rgba(251, 191, 36, 0.3); }
    :where(.shadow-lg) { box-shadow: 0 10px 15px -3px var(--shadow-color, rgba(0, 0, 0, 0.25)), 0 4px 6px -4px var(--shadow-color, rgba(0, 0, 0, 0.25)); }
    :where(.shadow-sky-500\/20) { --shadow-color: rgba(14, 165, 233, 0.2); }
    :where(.transition) { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    :where(.transition-\[width\]) { transition-property: width; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    :where(.duration-300) { transition-duration: 300ms; }
    :where(.ease-linear) { transition-timing-function: linear; }
    :where(.selection\:bg-sky-500\/30)::selection { background-color: rgba(14, 165, 233, 0.3); }
    :where(.focus-visible\:outline:focus-visible) { outline-style: solid; }
    :where(.focus-visible\:outline-2:focus-visible) { outline-width: 2px; }
    :where(.focus-visible\:outline-offset-2:focus-visible) { outline-offset: 2px; }
    :where(.focus-visible\:outline-sky-400:focus-visible) { outline-color: #38bdf8; }
    @media (hover: hover) {
      :where(.hover\:bg-sky-400:hover) { background-color: #38bdf8; }
      :where(.hover\:bg-slate-800:hover) { background-color: #1e293b; }
    }
    :where(.active\:scale-95:active) { transform: scale(0.95); }
    :where(.active\:scale-\[0\.98\]:active) { transform: scale(0.98); }
    :where(.active\:bg-slate-700:active) { background-color: #334155; }
    :where(.active\:bg-slate-800:active) { background-color: #1e293b; }
  </style>
</head>
<body data-screen="start" class="bg-slate-950 text-slate-100 antialiased selection:bg-sky-500/30">
  <main class="app-shell mx-auto flex w-full max-w-md flex-col justify-between overflow-hidden">

    <!-- STARTBILDSCHIRM -->
    <section id="screen-start" class="h-full flex-col justify-between py-2">
      <header class="pt-4 text-center">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 ring-1 ring-sky-400/30">
          <span class="text-3xl font-extrabold text-sky-400">x²</span>
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-white" style="text-wrap: balance;">
          Kopfrechnen 60s
        </h1>
        <p class="mt-2 text-sm text-slate-400" style="text-wrap: pretty;">
          Quadratzahlen, Potenzen, Gleichungen und Prozente in 60 Sekunden.
        </p>
      </header>

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-2xl bg-slate-900/90 p-4 ring-1 ring-slate-800">
          <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Streak</p>
          <p class="mt-2 flex items-baseline gap-1.5">
            <span id="start-streak" class="text-3xl font-bold tabular-nums text-amber-400">0</span>
            <span class="text-sm text-slate-400">Tage</span>
          </p>
        </div>
        <div class="rounded-2xl bg-slate-900/90 p-4 ring-1 ring-slate-800">
          <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Highscore</p>
          <p class="mt-2 flex items-baseline gap-1.5">
            <span id="start-highscore" class="text-3xl font-bold tabular-nums text-sky-400">0</span>
            <span class="text-sm text-slate-400">Pkt</span>
          </p>
        </div>
      </div>

      <div class="pb-2">
        <button
          id="btn-start"
          type="button"
          class="w-full rounded-2xl bg-sky-500 py-4 text-lg font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition active:scale-[0.98] hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
        >
          60s Sprint starten
        </button>
      </div>
    </section>

    <!-- SPIELBILDSCHIRM -->
    <section id="screen-game" class="h-full flex-col justify-between gap-2">
      <!-- Top Bar: Timer & Score -->
      <header class="shrink-0 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 ring-1 ring-slate-800">
            <span class="text-xs font-medium uppercase tracking-wider text-slate-400">Zeit</span>
            <span id="game-timer" data-state="normal" class="text-xl font-bold tabular-nums" aria-live="off">60s</span>
          </div>

          <div class="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 ring-1 ring-slate-800">
            <span class="text-xs font-medium uppercase tracking-wider text-slate-400">Punkte</span>
            <span id="game-score" class="text-xl font-bold tabular-nums text-sky-400" aria-live="polite">0</span>
          </div>
        </div>

        <div class="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            id="game-progress"
            data-state="normal"
            class="h-full w-full rounded-full transition-[width] duration-300 ease-linear"
          ></div>
        </div>
      </header>

      <!-- Aufgaben-Bereich -->
      <div class="flex min-h-0 flex-1 flex-col items-center py-1">
        <div
          id="question-card"
          data-feedback="none"
          class="flex w-full flex-col items-center justify-center rounded-3xl bg-slate-900/90 px-4 py-5"
        >
          <span
            id="question-category"
            class="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold tracking-wide text-sky-300"
          >
            Kategorie
          </span>

          <p
            id="question-text"
            class="mt-3 text-center font-bold tracking-tight text-white tabular-nums"
            style="font-size: clamp(1.75rem, 1rem + 5vw, 2.75rem); text-wrap: balance;"
          >
            12² = ?
          </p>

          <div
            id="answer-box"
            class="mt-4 flex h-14 w-full max-w-[220px] items-center justify-center rounded-2xl bg-slate-950 px-4 ring-2 ring-slate-700"
          >
            <span
              id="answer-display"
              data-empty="true"
              class="text-3xl font-bold tracking-wider tabular-nums"
            >
              _
            </span>
          </div>
        </div>
      </div>

      <!-- Eigenes Ziffernblatt unten -->
      <div id="keypad" class="grid shrink-0 grid-cols-3 gap-2 pb-1" role="group" aria-label="Zahlenpad">
        <button type="button" data-key="1" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">1</button>
        <button type="button" data-key="2" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">2</button>
        <button type="button" data-key="3" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">3</button>

        <button type="button" data-key="4" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">4</button>
        <button type="button" data-key="5" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">5</button>
        <button type="button" data-key="6" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">6</button>

        <button type="button" data-key="7" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">7</button>
        <button type="button" data-key="8" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">8</button>
        <button type="button" data-key="9" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">9</button>

        <button type="button" data-action="backspace" aria-label="Letzte Ziffer löschen" class="keypad-btn rounded-2xl bg-slate-900 py-3.5 text-xl font-semibold text-slate-300 ring-1 ring-slate-800 transition active:scale-95 active:bg-slate-800">⌫</button>
        <button type="button" data-key="0" class="keypad-btn rounded-2xl bg-slate-800 py-3.5 text-2xl font-semibold text-white transition active:scale-95 active:bg-slate-700">0</button>
        <button type="button" data-action="skip" aria-label="Aufgabe überspringen" class="keypad-btn rounded-2xl bg-slate-900 py-3.5 text-base font-semibold text-amber-400 ring-1 ring-slate-800 transition active:scale-95 active:bg-slate-800">Skip</button>
      </div>
    </section>

    <!-- ENDBILDSCHIRM -->
    <section id="screen-end" class="h-full flex-col justify-between py-2">
      <header class="pt-2 text-center">
        <span
          id="end-highscore-badge"
          data-visible="false"
          class="mb-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30"
        >
          Neuer Highscore
        </span>
        <h2 class="text-2xl font-bold text-white" style="text-wrap: balance;">Zeit abgelaufen</h2>
        <p class="mt-1 text-5xl font-extrabold tabular-nums text-sky-400">
          <span id="end-score">0</span>
        </p>
        <p id="end-accuracy" class="mt-1 text-sm text-slate-400">0 von 0 Aufgaben richtig</p>
      </header>

      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-2xl bg-slate-900/90 p-3.5 ring-1 ring-slate-800">
            <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Streak</p>
            <p class="mt-1 flex items-baseline gap-1.5">
              <span id="end-streak" class="text-2xl font-bold tabular-nums text-amber-400">0</span>
              <span class="text-xs text-slate-400">Tage</span>
            </p>
          </div>
          <div class="rounded-2xl bg-slate-900/90 p-3.5 ring-1 ring-slate-800">
            <p class="text-xs font-medium uppercase tracking-wider text-slate-400">Highscore</p>
            <p class="mt-1 flex items-baseline gap-1.5">
              <span id="end-highscore" class="text-2xl font-bold tabular-nums text-sky-400">0</span>
              <span class="text-xs text-slate-400">Pkt</span>
            </p>
          </div>
        </div>

        <div class="rounded-2xl bg-slate-900/90 p-4 ring-1 ring-slate-800">
          <p class="text-xs font-semibold uppercase tracking-wider text-sky-400">Mathe-Fun-Fact</p>
          <p id="end-fun-fact" class="mt-1.5 text-sm leading-relaxed text-slate-200" style="text-wrap: pretty;">
            Fun Fact lädt...
          </p>
        </div>
      </div>

      <div class="space-y-2 pb-2">
        <button
          id="btn-replay"
          type="button"
          class="w-full rounded-2xl bg-sky-500 py-3.5 text-base font-bold text-slate-950 shadow-lg shadow-sky-500/20 transition active:scale-[0.98] hover:bg-sky-400"
        >
          Nochmal spielen
        </button>
        <button
          id="btn-home"
          type="button"
          class="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-slate-300 ring-1 ring-slate-800 transition active:scale-[0.98] hover:bg-slate-800"
        >
          Zur Startseite
        </button>
      </div>
    </section>

  </main>

  <script type="module" src="./ui.js"></script>
</body>
</html>
```

## tests.mjs

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  GAME_DURATION_SECONDS,
  TIMER_DURATIONS,
  CATEGORIES,
  TOPICS,
  MATH_FUN_FACTS,
  generateQuestion,
  generateTopicQuestion,
  pickTopic,
  generateWeightedQuestion,
  getDifficultyForScore,
  checkAnswer,
  updateUserProfile,
  getRandomFunFact,
  createSessionHistory,
  createHistoryEntry,
  recordSessionAnswer,
  setHistoryGap,
  calculatePpm,
  summarizeSession
} from './engine.js';
import {
  TOPIC_IDS,
  HIGHSCORE_DURATIONS,
  WEIGHT_DEFAULT,
  WEIGHT_MIN,
  WEIGHT_MAX,
  loadUserData,
  saveUserData,
  getWeights,
  adjustWeight,
  getTopGaps,
  normalizeDuration,
  getHighScores,
  getHighScore,
  saveHighScore
} from './storage.js';

test('Gesetz 1: engine.js greift niemals auf DOM oder localStorage zu', async () => {
  const source = await fs.readFile(new URL('./engine.js', import.meta.url), 'utf8');
  assert.equal(/\bdocument\b/.test(source), false, 'engine.js darf document nicht verwenden');
  assert.equal(/\bwindow\b/.test(source), false, 'engine.js darf window nicht verwenden');
  assert.equal(/\blocalStorage\b/.test(source), false, 'engine.js darf localStorage nicht verwenden');
  assert.equal(/querySelector|getElementById/.test(source), false);
});

test('Gesetz 2: Jede generierte Aufgabe erfüllt exakt den JSON-Datenvertrag', () => {
  const expectedKeys = ['id', 'category', 'questionText', 'correctAnswer', 'difficulty'].sort();
  const validCategories = new Set(Object.values(CATEGORIES));
  const seenCategories = new Set();

  for (let difficulty = 1; difficulty <= 3; difficulty += 1) {
    for (let i = 0; i < 80; i += 1) {
      const q = generateQuestion(difficulty);
      assert.deepEqual(Object.keys(q).sort(), expectedKeys);
      assert.equal(typeof q.id, 'string');
      assert.ok(q.id.length > 0);
      assert.equal(typeof q.category, 'string');
      assert.ok(validCategories.has(q.category), `Unbekannte Kategorie: ${q.category}`);
      assert.equal(typeof q.questionText, 'string');
      assert.ok(q.questionText.length > 0);
      assert.equal(typeof q.correctAnswer, 'number');
      assert.ok(Number.isInteger(q.correctAnswer), `Antwort muss ganzzahlig sein: ${q.correctAnswer}`);
      assert.ok(q.correctAnswer >= 0, `Antwort muss >= 0 sein: ${q.correctAnswer}`);
      assert.equal(q.difficulty, difficulty);

      if (q.category === CATEGORIES.SQUARES) {
        assert.ok(q.correctAnswer <= 625, `Quadratzahl über 25²: ${q.correctAnswer}`);
      }

      seenCategories.add(q.category);
    }
  }

  assert.equal(seenCategories.size, 4, 'Alle 4 Kategorien müssen vorkommen');
});

test('Gesetz 3: Spieldauer beträgt exakt 60 Sekunden und 10 Fun-Facts sind vorhanden', () => {
  assert.equal(GAME_DURATION_SECONDS, 60);
  assert.equal(MATH_FUN_FACTS.length, 10);
  const fact = getRandomFunFact(() => 0.5);
  assert.equal(fact.index, 5);
  assert.equal(fact.text, MATH_FUN_FACTS[5]);
});

test('getDifficultyForScore steigt sinnvoll mit dem Punktestand', () => {
  assert.equal(getDifficultyForScore(0), 1);
  assert.equal(getDifficultyForScore(4), 1);
  assert.equal(getDifficultyForScore(5), 2);
  assert.equal(getDifficultyForScore(11), 2);
  assert.equal(getDifficultyForScore(12), 3);
});

test('checkAnswer prüft Eingaben korrekt', () => {
  const q = { id: '1', category: 'Quadratzahlen', questionText: '12² = ?', correctAnswer: 144, difficulty: 1 };
  assert.deepEqual(checkAnswer(q, '144'), { isCorrect: true, correctAnswer: 144, userAnswer: 144 });
  assert.deepEqual(checkAnswer(q, 144), { isCorrect: true, correctAnswer: 144, userAnswer: 144 });
  assert.deepEqual(checkAnswer(q, '145'), { isCorrect: false, correctAnswer: 144, userAnswer: 145 });
  assert.deepEqual(checkAnswer(q, ''), { isCorrect: false, correctAnswer: 144, userAnswer: null });
  assert.deepEqual(checkAnswer(q, 'abc'), { isCorrect: false, correctAnswer: 144, userAnswer: null });
});

test('updateUserProfile berechnet Streak und Highscore korrekt', () => {
  const day1 = updateUserProfile({ streak: 0, highScore: 0, lastPlayedDate: null }, 10, '2026-11-10');
  assert.deepEqual(day1, {
    profile: { streak: 1, highScore: 10, lastPlayedDate: '2026-11-10' },
    isNewHighScore: true,
    streakIncreased: true
  });

  const sameDay = updateUserProfile(day1.profile, 8, '2026-11-10');
  assert.deepEqual(sameDay, {
    profile: { streak: 1, highScore: 10, lastPlayedDate: '2026-11-10' },
    isNewHighScore: false,
    streakIncreased: false
  });

  const nextDay = updateUserProfile(sameDay.profile, 15, '2026-11-11');
  assert.deepEqual(nextDay, {
    profile: { streak: 2, highScore: 15, lastPlayedDate: '2026-11-11' },
    isNewHighScore: true,
    streakIncreased: true
  });

  const gapDay = updateUserProfile(nextDay.profile, 5, '2026-11-14');
  assert.deepEqual(gapDay, {
    profile: { streak: 1, highScore: 15, lastPlayedDate: '2026-11-14' },
    isNewHighScore: false,
    streakIncreased: false
  });
});

test('updateUserProfile lässt streak und lastPlayedDate bei score === 0 unverändert', () => {
  const untouchedNew = updateUserProfile({ streak: 0, highScore: 0, lastPlayedDate: null }, 0, '2026-11-13');
  assert.deepEqual(untouchedNew, {
    profile: { streak: 0, highScore: 0, lastPlayedDate: null },
    isNewHighScore: false,
    streakIncreased: false
  });

  const untouchedExisting = updateUserProfile({ streak: 3, highScore: 18, lastPlayedDate: '2026-11-12' }, 0, '2026-11-13');
  assert.deepEqual(untouchedExisting, {
    profile: { streak: 3, highScore: 18, lastPlayedDate: '2026-11-12' },
    isNewHighScore: false,
    streakIncreased: false
  });
});

test('storage.js speichert und lädt Nutzerdaten asynchron über LocalStorage', async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v))
  };

  const initial = await loadUserData();
  assert.deepEqual(initial, { streak: 0, highScore: 0, lastPlayedDate: null });

  const saved = await saveUserData({ streak: 4, highScore: 22, lastPlayedDate: '2026-11-13' });
  assert.deepEqual(saved, { streak: 4, highScore: 22, lastPlayedDate: '2026-11-13' });

  const reloaded = await loadUserData();
  assert.deepEqual(reloaded, { streak: 4, highScore: 22, lastPlayedDate: '2026-11-13' });

  // Altdaten-Fallback highscore -> highScore
  globalThis.localStorage.setItem('kopfrechen_user_data_v1', JSON.stringify({ streak: 2, highscore: 14, lastPlayedDate: '2026-11-12' }));
  const migrated = await loadUserData();
  assert.deepEqual(migrated, { streak: 2, highScore: 14, lastPlayedDate: '2026-11-12' });

  // Korrupte Daten abfangen
  globalThis.localStorage.setItem('kopfrechen_user_data_v1', '{kaputt');
  const fallback = await loadUserData();
  assert.deepEqual(fallback, { streak: 0, highScore: 0, lastPlayedDate: null });
});

function stripJsComments(source) {
  return source.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g,
    (match) => (match.startsWith('/*') || match.startsWith('//') ? ' ' : match)
  );
}

function extractStringTokens(code) {
  const tokens = [];
  const literalRegex = /'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)"|`((?:\\.|[^`\\])*)`/g;
  for (const match of code.matchAll(literalRegex)) {
    const rawContent = match[1] ?? match[2] ?? match[3] ?? '';
    for (const token of rawContent.split(/\s+/)) {
      if (token) tokens.push(token);
    }
  }
  return tokens;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('Test A (Architektur-Wächter engine.js): frei von document, window, localStorage und DOM-Queries', async () => {
  const source = await fs.readFile(new URL('./engine.js', import.meta.url), 'utf8');
  const code = stripJsComments(source);

  assert.equal(/\bdocument\b/.test(code), false, 'engine.js darf document nicht verwenden');
  assert.equal(/\bwindow\b/.test(code), false, 'engine.js darf window nicht verwenden');
  assert.equal(/\blocalStorage\b/.test(code), false, 'engine.js darf localStorage nicht verwenden');
  assert.equal(/\b(?:querySelector(?:All)?|getElementById)\b/.test(code), false, 'engine.js darf keine DOM-Selektoren verwenden');
});

test('Test B (Architektur-Wächter storage.js): frei von document und DOM-Queries', async () => {
  const source = await fs.readFile(new URL('./storage.js', import.meta.url), 'utf8');
  const code = stripJsComments(source);

  assert.equal(/\bdocument\b/.test(code), false, 'storage.js darf document nicht verwenden');
  assert.equal(/\b(?:querySelector(?:All)?|getElementById)\b/.test(code), false, 'storage.js darf keine DOM-Selektoren verwenden');
});

test('Test C (Architektur-Wächter ui.js): keine Tailwind-Klassen, kein classList/className und kein localStorage', async () => {
  const source = await fs.readFile(new URL('./ui.js', import.meta.url), 'utf8');
  const code = stripJsComments(source);

  assert.equal(/\bclassList\b/.test(code), false, 'ui.js darf classList nicht verwenden');
  assert.equal(/\bclassName\b/.test(code), false, 'ui.js darf className nicht verwenden');
  assert.equal(/\bsetAttribute\s*\(\s*['"]class['"]/.test(code), false, 'ui.js darf class-Attribut nicht direkt setzen');
  assert.equal(/\blocalStorage\b/.test(code), false, 'ui.js darf localStorage nicht direkt aufrufen');

  const tokens = extractStringTokens(code);
  const forbiddenPrefixRegex = /^(?:bg|text|ring|animate|border)-[a-zA-Z0-9_/${}.-]*$/;
  const forbiddenLayoutRegex = /^(?:hidden|flex|inline-flex|grid|inline-grid|block|inline-block|invisible)$/;

  const forbiddenMatches = tokens.filter(
    (token) => forbiddenPrefixRegex.test(token) || forbiddenLayoutRegex.test(token)
  );
  assert.deepEqual(
    forbiddenMatches,
    [],
    `ui.js darf keine Tailwind-Klassen manipulieren, gefunden: ${forbiddenMatches.join(', ')}`
  );
});

test('Test D (DOM-Vertrags-Test): alle IDs aus ui.js und semantische data-Attribute existieren in index.html', async () => {
  const uiSource = await fs.readFile(new URL('./ui.js', import.meta.url), 'utf8');
  const htmlSource = await fs.readFile(new URL('./index.html', import.meta.url), 'utf8');
  const uiCode = stripJsComments(uiSource);

  const idRegex = /\bdocument\.getElementById\(\s*(['"])([^'"]+)\1\s*\)/g;
  const referencedIds = [...new Set([...uiCode.matchAll(idRegex)].map((match) => match[2]))];

  assert.ok(
    referencedIds.length >= 15,
    `Erwartet mindestens 15 per getElementById referenzierte IDs in ui.js, gefunden: ${referencedIds.length}`
  );

  const missingIds = referencedIds.filter(
    (id) => !new RegExp(`\\bid=(['"])${escapeRegExp(id)}\\1`).test(htmlSource)
  );
  assert.deepEqual(
    missingIds,
    [],
    `Folgende in ui.js referenzierte IDs fehlen in index.html: ${missingIds.join(', ')}`
  );

  const styleMatch = htmlSource.match(/<style>([\s\S]*?)<\/style>/);
  assert.ok(styleMatch, 'index.html muss einen <style>-Block enthalten');
  const styleBlock = styleMatch[1];

  const semanticContracts = [
    { datasetProp: 'screen', htmlAttr: 'data-screen' },
    { datasetProp: 'state', htmlAttr: 'data-state' },
    { datasetProp: 'feedback', htmlAttr: 'data-feedback' },
    { datasetProp: 'empty', htmlAttr: 'data-empty' },
    { datasetProp: 'visible', htmlAttr: 'data-visible' }
  ];

  for (const { datasetProp, htmlAttr } of semanticContracts) {
    assert.ok(
      new RegExp(`\\.dataset\\.${datasetProp}\\b`).test(uiCode),
      `ui.js muss dataset.${datasetProp} setzen`
    );
    assert.ok(
      new RegExp(`\\b${htmlAttr}=(['"])`).test(htmlSource),
      `index.html muss ${htmlAttr} als Attribut initialisieren`
    );
    assert.ok(
      new RegExp(`\\[${htmlAttr}=`).test(styleBlock),
      `index.html <style> muss CSS-Zustandsregeln für [${htmlAttr}=...] definieren`
    );
  }

  for (let digit = 0; digit <= 9; digit += 1) {
    assert.ok(
      new RegExp(`\\bdata-key=(['"])${digit}\\1`).test(htmlSource),
      `Zifferntaste data-key="${digit}" fehlt in index.html`
    );
  }
  assert.ok(/\bdata-action=(['"])backspace\1/.test(htmlSource), 'data-action="backspace" fehlt in index.html');
  assert.ok(/\bdata-action=(['"])skip\1/.test(htmlSource), 'data-action="skip" fehlt in index.html');
});

// ---------------------------------------------------------------------------
// V1.2 Tests (Phase 2 Teil 1: Themen, Gewichte, Multi-Timer-Highscores, History & PPM)
// ---------------------------------------------------------------------------

const FORBIDDEN_DASH_REGEX = /[\u2013\u2014]/;

const SUPERSCRIPT_DIGITS = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9'
};

const SUBSCRIPT_DIGITS = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9'
};

function parseUnicodeDigits(text, digitMap) {
  return Number(
    text
      .split('')
      .map((ch) => digitMap[ch] ?? ch)
      .join('')
  );
}

function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function withMockLocalStorage(fn) {
  const prevDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const store = new Map();
  const mockStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
  globalThis.localStorage = mockStorage;
  return Promise.resolve()
    .then(() => fn(mockStorage, store))
    .finally(() => {
      if (prevDescriptor) {
        Object.defineProperty(globalThis, 'localStorage', prevDescriptor);
      } else {
        delete globalThis.localStorage;
      }
    });
}

function assertValidV12QuestionContract(q, expectedTopicId, expectedLabel, expectedDifficulty) {
  assert.equal(typeof q.id, 'string');
  assert.ok(q.id.length > 0);
  assert.equal(q.topicId, expectedTopicId);
  assert.equal(typeof q.topicLabel, 'string');
  assert.ok(q.topicLabel.length > 0);
  assert.equal(q.topicLabel, expectedLabel);
  assert.equal(typeof q.category, 'string');
  assert.ok(q.category.length > 0);
  assert.equal(q.category, expectedLabel);
  assert.equal(typeof q.question, 'string');
  assert.ok(q.question.length > 0);
  assert.equal(q.questionText, q.question);
  assert.equal(q.text, q.question);
  assert.equal(FORBIDDEN_DASH_REGEX.test(q.question), false, `Gedankenstrich in Frage: ${q.question}`);

  assert.equal(typeof q.answer, 'number');
  assert.ok(Number.isInteger(q.answer), `Antwort muss ganzzahlig sein: ${q.answer}`);
  assert.ok(q.answer >= 0, `Antwort muss >= 0 sein: ${q.answer}`);
  assert.equal(q.correctAnswer, q.answer);
  assert.equal(q.difficulty, expectedDifficulty);

  assert.ok(Array.isArray(q.steps), 'steps muss ein Array sein');
  assert.ok(q.steps.length >= 2, `Mindestens 2 Lösungswege erwartet, erhalten: ${q.steps.length}`);
  for (const step of q.steps) {
    assert.equal(typeof step, 'string');
    assert.ok(step.trim().length > 0, 'Lösungsweg darf nicht leer sein');
    assert.equal(FORBIDDEN_DASH_REGEX.test(step), false, `Gedankenstrich in step: ${step}`);
  }
}

function verifyTopicQuestionMath(q) {
  const { topicId, question, answer } = q;
  let m;

  if (topicId === 'de1_1') {
    if ((m = question.match(/^(\d+) \+ (\d+) = \?$/))) {
      assert.equal(answer, Number(m[1]) + Number(m[2]), question);
      return;
    }
    if ((m = question.match(/^(\d+) - (\d+) = \?$/))) {
      assert.equal(answer, Number(m[1]) - Number(m[2]), question);
      return;
    }
    if ((m = question.match(/^(\d+) · (\d+) = \?$/))) {
      assert.equal(answer, Number(m[1]) * Number(m[2]), question);
      return;
    }
    if ((m = question.match(/^(\d+) : (\d+) = \?$/))) {
      assert.equal(Number(m[1]), Number(m[2]) * answer, question);
      return;
    }
  } else if (topicId === 'de2_1') {
    if ((m = question.match(/^(\d+)\/(\d+) von (\d+) = \?$/))) {
      assert.equal((Number(m[1]) * Number(m[3])) % Number(m[2]), 0, question);
      assert.equal(answer, (Number(m[1]) * Number(m[3])) / Number(m[2]), question);
      return;
    }
    if ((m = question.match(/^(\d+)\/(\d+) = \?\/(\d+)$/))) {
      assert.equal(Number(m[1]) * Number(m[3]), answer * Number(m[2]), question);
      return;
    }
  } else if (topicId === 'de2_2') {
    if ((m = question.match(/^(\d+)\/(\d+) ([+-]) (\d+)\/(\d+) = \?\/(\d+)$/))) {
      const a = Number(m[1]);
      const d1 = Number(m[2]);
      const op = m[3];
      const b = Number(m[4]);
      const d2 = Number(m[5]);
      const commonDen = Number(m[6]);
      const left = op === '+' ? a * d2 + b * d1 : a * d2 - b * d1;
      assert.equal(left * commonDen, answer * d1 * d2, question);
      return;
    }
    if ((m = question.match(/^(\d+) : \((\d+)\/(\d+)\) = \?$/))) {
      assert.equal(Number(m[1]) * Number(m[3]), answer * Number(m[2]), question);
      return;
    }
    if ((m = question.match(/^\((\d+)\/(\d+)\) · \((\d+)\/(\d+)\) = \?$/))) {
      assert.equal(Number(m[1]) * Number(m[3]), answer * Number(m[2]) * Number(m[4]), question);
      return;
    }
  } else if (topicId === 'de3_1') {
    if ((m = question.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) · (\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) = (\d+)\^\?$/))) {
      assert.equal(m[1], m[3], question);
      assert.equal(m[1], m[5], question);
      const e1 = parseUnicodeDigits(m[2], SUPERSCRIPT_DIGITS);
      const e2 = parseUnicodeDigits(m[4], SUPERSCRIPT_DIGITS);
      assert.equal(answer, e1 + e2, question);
      return;
    }
    if ((m = question.match(/^\((\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)\)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) = (\d+)\^\?$/))) {
      assert.equal(m[1], m[4], question);
      const e1 = parseUnicodeDigits(m[2], SUPERSCRIPT_DIGITS);
      const e2 = parseUnicodeDigits(m[3], SUPERSCRIPT_DIGITS);
      assert.equal(answer, e1 * e2, question);
      return;
    }
    if ((m = question.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) : (\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) = (\d+)\^\?$/))) {
      assert.equal(m[1], m[3], question);
      assert.equal(m[1], m[5], question);
      const e1 = parseUnicodeDigits(m[2], SUPERSCRIPT_DIGITS);
      const e2 = parseUnicodeDigits(m[4], SUPERSCRIPT_DIGITS);
      assert.equal(answer, e1 - e2, question);
      return;
    }
    if ((m = question.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) : (\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) = \?$/))) {
      assert.equal(m[1], m[3], question);
      const e1 = parseUnicodeDigits(m[2], SUPERSCRIPT_DIGITS);
      const e2 = parseUnicodeDigits(m[4], SUPERSCRIPT_DIGITS);
      assert.equal(answer, Number(m[1]) ** (e1 - e2), question);
      return;
    }
    if ((m = question.match(/^(\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) · (\d+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+) = \?([⁰¹²³⁴⁵⁶⁷⁸⁹]+)$/))) {
      assert.equal(m[2], m[4], question);
      assert.equal(m[2], m[5], question);
      assert.equal(answer, Number(m[1]) * Number(m[3]), question);
      return;
    }
  } else if (topicId === 'de3_2') {
    if ((m = question.match(/^log([₀₁₂₃₄₅₆₇₈₉]+)\((\d+)\) = \?$/))) {
      const base = parseUnicodeDigits(m[1], SUBSCRIPT_DIGITS);
      assert.equal(base ** answer, Number(m[2]), question);
      return;
    }
    if ((m = question.match(/^(\d+)\^x = (\d+) \| x = \?$/))) {
      assert.equal(Number(m[1]) ** answer, Number(m[2]), question);
      return;
    }
    if ((m = question.match(/^log([₀₁₂₃₄₅₆₇₈₉]+)\((\d+)\) - log([₀₁₂₃₄₅₆₇₈₉]+)\((\d+)\) = \?$/))) {
      const b1 = parseUnicodeDigits(m[1], SUBSCRIPT_DIGITS);
      const b2 = parseUnicodeDigits(m[3], SUBSCRIPT_DIGITS);
      assert.equal(b1, b2, question);
      assert.equal((b1 ** answer) * Number(m[4]), Number(m[2]), question);
      return;
    }
  } else if (topicId === 'de4_1') {
    if ((m = question.match(/^(\d+)x ([+-]) (\d+) = (\d+) \| x = \?$/))) {
      const a = Number(m[1]);
      const b = Number(m[3]);
      const c = Number(m[4]);
      const lhs = m[2] === '+' ? a * answer + b : a * answer - b;
      assert.equal(lhs, c, question);
      return;
    }
    if ((m = question.match(/^(\d+)\(x ([+-]) (\d+)\) = (\d+) \| x = \?$/))) {
      const a = Number(m[1]);
      const b = Number(m[3]);
      const c = Number(m[4]);
      const lhs = a * (m[2] === '+' ? answer + b : answer - b);
      assert.equal(lhs, c, question);
      return;
    }
    if ((m = question.match(/^(\d+)x \+ (\d+) = (\d*)x \+ (\d+) \| x = \?$/))) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      const d = m[3] === '' ? 1 : Number(m[3]);
      const c = Number(m[4]);
      assert.equal(a * answer + b, d * answer + c, question);
      return;
    }
  } else if (topicId === 'de4_2') {
    if ((m = question.match(/^x \+ y = (\d+), x - y = (\d+) \| ([xy]) = \?$/))) {
      const sum = Number(m[1]);
      const diff = Number(m[2]);
      if (m[3] === 'x') {
        assert.equal(2 * answer, sum + diff, question);
        assert.ok(sum - answer >= 0, question);
      } else {
        assert.equal(2 * answer, sum - diff, question);
        assert.ok(sum - answer >= 0, question);
      }
      return;
    }
    if ((m = question.match(/^y = (\d+)x, (\d*)x \+ y = (\d+) \| ([xy]) = \?$/))) {
      const k = Number(m[1]);
      const a = m[2] === '' ? 1 : Number(m[2]);
      const total = Number(m[3]);
      if (m[4] === 'x') {
        assert.equal((a + k) * answer, total, question);
      } else {
        assert.equal(answer % k, 0, question);
        assert.equal((a + k) * (answer / k), total, question);
      }
      return;
    }
    if ((m = question.match(/^x \+ (\d+)y = (\d+), x \+ (\d*)y = (\d+) \| ([xy]) = \?$/))) {
      const a = Number(m[1]);
      const c1 = Number(m[2]);
      const b = m[3] === '' ? 1 : Number(m[3]);
      const c2 = Number(m[4]);
      if (m[5] === 'x') {
        assert.equal((c1 - c2) % (a - b), 0, question);
        const y = (c1 - c2) / (a - b);
        assert.equal(answer + b * y, c2, question);
      } else {
        assert.equal(c1 - a * answer, c2 - b * answer, question);
      }
      return;
    }
  } else if (topicId === 'de5_1') {
    if ((m = question.match(/^f\(x\) = (\d+)x ([+-]) (\d+) \| f\((\d+)\) = \?$/))) {
      const slope = Number(m[1]);
      const c = Number(m[3]);
      const x0 = Number(m[4]);
      const expected = m[2] === '+' ? slope * x0 + c : slope * x0 - c;
      assert.equal(answer, expected, question);
      return;
    }
    if ((m = question.match(/^Nullstelle: f\(x\) = (\d+)x - (\d+) \| x = \?$/))) {
      assert.equal(Number(m[1]) * answer - Number(m[2]), 0, question);
      return;
    }
    if ((m = question.match(/^f\(x\) = mx \+ (\d+) mit f\((\d+)\) = (\d+) \| m = \?$/))) {
      assert.equal(answer * Number(m[2]) + Number(m[1]), Number(m[3]), question);
      return;
    }
  } else if (topicId === 'de5_2') {
    if ((m = question.match(/^Scheitel-x: f\(x\) = (\d*)\(x - (\d+)\)² \+ (\d+) \| x = \?$/))) {
      assert.equal(answer, Number(m[2]), question);
      return;
    }
    if ((m = question.match(/^Minimum-y: f\(x\) = (\d*)\(x - (\d+)\)² \+ (\d+) \| y = \?$/))) {
      assert.equal(answer, Number(m[3]), question);
      return;
    }
    if ((m = question.match(/^Pos\. Nullstelle: f\(x\) = (\d*)x² - (\d+) \| x = \?$/))) {
      const a = m[1] === '' ? 1 : Number(m[1]);
      assert.equal(a * answer * answer - Number(m[2]), 0, question);
      assert.ok(answer > 0, question);
      return;
    }
    if ((m = question.match(/^f\(x\) = \(x - (\d+)\)² \+ (\d+) \| f\((\d+)\) = \?$/))) {
      const xs = Number(m[1]);
      const ys = Number(m[2]);
      const x0 = Number(m[3]);
      assert.equal(answer, (x0 - xs) ** 2 + ys, question);
      return;
    }
  } else if (topicId === 'de6_1') {
    if ((m = question.match(/^Dreieck \(90°\): a = (\d+), Hypotenuse c = (\d+) \| b = \?$/))) {
      const a = Number(m[1]);
      const c = Number(m[2]);
      assert.equal(a * a + answer * answer, c * c, question);
      return;
    }
    if ((m = question.match(/^Dreieck \(90°\): a = (\d+), b = (\d+) \| c = \?$/))) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      assert.equal(a * a + b * b, answer * answer, question);
      return;
    }
    if ((m = question.match(/^sin\(30°\) = 0,5, Gegenkathete a = (\d+) \| c = \?$/))) {
      assert.equal(answer, 2 * Number(m[1]), question);
      return;
    }
    if ((m = question.match(/^sin\(30°\) = 0,5, c = (\d+) \| a = \?$/))) {
      assert.equal(2 * answer, Number(m[1]), question);
      return;
    }
    if ((m = question.match(/^cos\(60°\) = 0,5, Ankathete b = (\d+) \| c = \?$/))) {
      assert.equal(answer, 2 * Number(m[1]), question);
      return;
    }
    if ((m = question.match(/^cos\(60°\) = 0,5, c = (\d+) \| b = \?$/))) {
      assert.equal(2 * answer, Number(m[1]), question);
      return;
    }
    if ((m = question.match(/^Dreieck \(90°, alpha = 45°\): Ankathete b = (\d+) \| a = \?$/))) {
      assert.equal(answer, Number(m[1]), question);
      return;
    }
  } else if (topicId === 'de6_2') {
    if ((m = question.match(/^Amplitude: f\(x\) = (\d+) · (?:sin|cos)\(\d+x\)(?: \+ \d+)? \| A = \?$/))) {
      assert.equal(answer, Number(m[1]), question);
      return;
    }
    if ((m = question.match(/^Periode 2π \/ b bei f\(x\) = (?:\d+ · )?(?:sin|cos)\((\d+)x\) \| b = \?$/))) {
      assert.equal(answer, Number(m[1]), question);
      return;
    }
    if ((m = question.match(/^(\d+) · (?:sin\(30°\)|cos\(60°\)) = \?$/))) {
      assert.equal(2 * answer, Number(m[1]), question);
      return;
    }
    if ((m = question.match(/^(\d+) · (?:sin\(90°\)|cos\(0°\)|tan\(45°\)) = \?$/))) {
      assert.equal(answer, Number(m[1]), question);
      return;
    }
    if ((m = question.match(/^(\d+) · (?:sin\(0°\)|cos\(90°\)) = \?$/))) {
      assert.equal(answer, 0, question);
      return;
    }
    if ((m = question.match(/^Maximalwert: f\(x\) = (\d+) · (?:sin|cos)\(\d+x\) \+ (\d+) \| max = \?$/))) {
      assert.equal(answer, Number(m[1]) + Number(m[2]), question);
      return;
    }
  }

  assert.fail(`Unerwartetes Aufgabenformat für ${topicId}: ${question}`);
}

test('V1.2 TOPICS und TIMER_DURATIONS erfüllen den Spezifikations-Vertrag', () => {
  const expectedTopics = [
    { id: 'de1_1', label: 'DE 1.1 Grundlagen' },
    { id: 'de2_1', label: 'DE 2.1 Brüche (Grundlagen)' },
    { id: 'de2_2', label: 'DE 2.2 Brüche (Fortgeschritten)' },
    { id: 'de3_1', label: 'DE 3.1 Terme - Potenzgesetze' },
    { id: 'de3_2', label: 'DE 3.2 Terme - Exponenten und Logarithmen' },
    { id: 'de4_1', label: 'DE 4.1 Gleichungen' },
    { id: 'de4_2', label: 'DE 4.2 Lineare Gleichungssysteme' },
    { id: 'de5_1', label: 'DE 5.1 Funktionen (Geraden)' },
    { id: 'de5_2', label: 'DE 5.2 Funktionen (Fortgeschritten)' },
    { id: 'de6_1', label: 'DE 6.1 Technik - Trigonometrie am Dreieck' },
    { id: 'de6_2', label: 'DE 6.2 Technik - Trigonometrische Funktionen' }
  ];

  assert.equal(TOPICS.length, 11);
  assert.equal(Object.isFrozen(TOPICS), true);
  assert.deepEqual(TOPICS, expectedTopics);
  for (const topic of TOPICS) {
    assert.equal(FORBIDDEN_DASH_REGEX.test(topic.label), false);
  }

  assert.deepEqual(TOPIC_IDS, expectedTopics.map((topic) => topic.id));
  assert.deepEqual(TIMER_DURATIONS, [60, 120, 300, 600]);
  assert.deepEqual(HIGHSCORE_DURATIONS, [60, 120, 300, 600]);
});

test('V1.2 generateTopicQuestion liefert für alle 11 Themen und Stufen 1 bis 3 gültige und korrekte Aufgaben', () => {
  const rand = createSeededRandom(20261113);
  const constantBoundaryRandoms = [() => 0, () => 0.49, () => 0.99];

  for (const topic of TOPICS) {
    for (let difficulty = 1; difficulty <= 3; difficulty += 1) {
      for (const boundaryRand of constantBoundaryRandoms) {
        const qBoundary = generateTopicQuestion(topic.id, difficulty, boundaryRand);
        assertValidV12QuestionContract(qBoundary, topic.id, topic.label, difficulty);
        verifyTopicQuestionMath(qBoundary);
      }

      for (let sample = 0; sample < 25; sample += 1) {
        const q = generateTopicQuestion(topic.id, difficulty, rand);
        assertValidV12QuestionContract(q, topic.id, topic.label, difficulty);
        verifyTopicQuestionMath(q);

        const checkOk = checkAnswer(q, String(q.answer));
        assert.deepEqual(checkOk, {
          isCorrect: true,
          correctAnswer: q.answer,
          userAnswer: q.answer
        });
      }
    }
  }

  assert.throws(() => generateTopicQuestion('unbekanntes_thema', 1), /Unbekannte Themen-ID/);
});

test('V1.2 generateTopicQuestion deterministische Stichproben über alle 11 Themen', () => {
  const deterministicChecks = [
    { topicId: 'de1_1', difficulty: 1, values: [0.05, 0.25, 0.5], expectedQuestion: '21 + 25 = ?', expectedAnswer: 46 },
    { topicId: 'de1_1', difficulty: 2, values: [0.3, 0.5, 0.2], expectedQuestion: '75 - 46 = ?', expectedAnswer: 29 },
    { topicId: 'de2_1', difficulty: 1, values: [0.1, 0.1, 0.5], expectedQuestion: '1/3 von 18 = ?', expectedAnswer: 6 },
    { topicId: 'de2_2', difficulty: 2, values: [0.4, 0.2, 0.3, 0.5], expectedQuestion: '9 : (3/4) = ?', expectedAnswer: 12 },
    { topicId: 'de3_1', difficulty: 1, values: [0.05, 0.5, 0.25, 0.75], expectedQuestion: '4³ · 4⁵ = 4^?', expectedAnswer: 8 },
    { topicId: 'de3_2', difficulty: 2, values: [0.1, 0.99], expectedQuestion: 'log₂(1) = ?', expectedAnswer: 0 },
    { topicId: 'de4_1', difficulty: 1, values: [0.1, 0.2, 0.5, 0.1, 0.3], expectedQuestion: '2x - 4 = 6 | x = ?', expectedAnswer: 5 },
    { topicId: 'de4_2', difficulty: 2, values: [0.1, 0.5, 0.2, 0.2], expectedQuestion: 'x + y = 17, x - y = 3 | y = ?', expectedAnswer: 7 },
    { topicId: 'de5_1', difficulty: 2, values: [0.4, 0.5, 0.3], expectedQuestion: 'Nullstelle: f(x) = 7x - 35 | x = ?', expectedAnswer: 5 },
    { topicId: 'de5_2', difficulty: 3, values: [0.6, 0.2, 0.4], expectedQuestion: 'Pos. Nullstelle: f(x) = 3x² - 48 | x = ?', expectedAnswer: 4 },
    { topicId: 'de6_1', difficulty: 1, values: [0.1, 0.2, 0.5], expectedQuestion: 'Dreieck (90°): a = 9, b = 12 | c = ?', expectedAnswer: 15 },
    { topicId: 'de6_2', difficulty: 2, values: [0.6, 0.95, 0.5, 0.1], expectedQuestion: '14 · sin(0°) = ?', expectedAnswer: 0 }
  ];

  for (const spec of deterministicChecks) {
    let idx = 0;
    const seqRand = () => {
      const v = spec.values[idx % spec.values.length];
      idx += 1;
      return v;
    };
    const q = generateTopicQuestion(spec.topicId, spec.difficulty, seqRand);
    assert.equal(q.question, spec.expectedQuestion);
    assert.equal(q.answer, spec.expectedAnswer);
    assert.equal(q.correctAnswer, spec.expectedAnswer);
    verifyTopicQuestionMath(q);
    assert.equal(checkAnswer(q, String(spec.expectedAnswer)).isCorrect, true);
  }
});

test('V1.2 pickTopic und generateWeightedQuestion unterstützen Gewichtung und Randfälle', () => {
  assert.equal(pickTopic([], { de1_1: 2.0 }, () => 0.5), null);
  assert.equal(pickTopic(['nicht_existent'], { de1_1: 2.0 }, () => 0.5), null);

  // undefined nutzt alle 11 Themen gleichgewichtet
  const seenAll = new Set();
  for (let i = 0; i < TOPICS.length; i += 1) {
    const picked = pickTopic(undefined, {}, () => (i + 0.5) / TOPICS.length);
    seenAll.add(picked);
  }
  assert.equal(seenAll.size, 11);

  // Gewichtete Verteilung: 2.5 vs 1.0 ergibt ca. 71 % vs 29 %
  const weightedCounts = { de1_1: 0, de2_1: 0 };
  for (let i = 0; i < 100; i += 1) {
    const picked = pickTopic(['de1_1', 'de2_1'], { de1_1: 1.0, de2_1: 2.5 }, () => (i + 0.5) / 100);
    weightedCounts[picked] += 1;
  }
  assert.equal(weightedCounts.de1_1, 29);
  assert.equal(weightedCounts.de2_1, 71);
  assert.ok(weightedCounts.de2_1 > weightedCounts.de1_1);

  // Fehlende oder ungültige Gewichte fallen auf 1.0 zurück
  const fallbackCounts = { de1_1: 0, de2_1: 0, de3_1: 0 };
  for (let i = 0; i < 100; i += 1) {
    const picked = pickTopic(
      ['de1_1', 'de2_1', 'de3_1'],
      { de1_1: 2.0, de2_1: -5, de3_1: Number.NaN },
      () => (i + 0.5) / 100
    );
    fallbackCounts[picked] += 1;
  }
  assert.deepEqual(fallbackCounts, { de1_1: 50, de2_1: 25, de3_1: 25 });

  // generateWeightedQuestion liefert vollständige V1.2-Aufgabe oder null bei leerer Liste
  assert.equal(generateWeightedQuestion([], { de1_1: 1.5 }, 1, () => 0.5), null);

  const rand = createSeededRandom(98765);
  const active = ['de4_1', 'de5_2'];
  const weightedQ = generateWeightedQuestion(active, { de4_1: 1.0, de5_2: 2.5 }, 3, rand);
  assert.ok(weightedQ !== null);
  assert.ok(active.includes(weightedQ.topicId));
  const topicMeta = TOPICS.find((t) => t.id === weightedQ.topicId);
  assertValidV12QuestionContract(weightedQ, topicMeta.id, topicMeta.label, 3);
  verifyTopicQuestionMath(weightedQ);
});

test('V1.2 storage.js Gewichte: Initialisierung, Deltas, Rundung, Grenzen, Kaputt-JSON und getTopGaps', async () => {
  assert.equal(WEIGHT_DEFAULT, 1.0);
  assert.equal(WEIGHT_MIN, 1.0);
  assert.equal(WEIGHT_MAX, 2.5);

  await withMockLocalStorage((mockStorage) => {
    const initial = getWeights();
    assert.deepEqual(Object.keys(initial), TOPIC_IDS);
    for (const id of TOPIC_IDS) {
      assert.equal(initial[id], 1.0);
    }

    // wrong (+0.15) und Rundung auf 2 Nachkommastellen
    let w = adjustWeight('de1_1', 'wrong');
    assert.equal(w.de1_1, 1.15);
    w = adjustWeight('de1_1', 'wrong');
    assert.equal(w.de1_1, 1.3);
    w = adjustWeight('de1_1', 'wrong');
    assert.equal(w.de1_1, 1.45);

    // correct (-0.05) und Untergrenze 1.0
    w = adjustWeight('de1_1', 'correct');
    assert.equal(w.de1_1, 1.4);
    w = adjustWeight('de1_1', 'wrong');
    assert.equal(w.de1_1, 1.55);
    w = adjustWeight('de2_1', 'correct');
    assert.equal(w.de2_1, 1.0);

    // gap (+0.40) und Cap 2.5
    w = adjustWeight('de3_1', 'gap');
    assert.equal(w.de3_1, 1.4);
    w = adjustWeight('de3_1', 'gap');
    assert.equal(w.de3_1, 1.8);
    w = adjustWeight('de3_1', 'gap');
    assert.equal(w.de3_1, 2.2);
    w = adjustWeight('de3_1', 'gap');
    assert.equal(w.de3_1, 2.5);

    // Unbekannte topicId oder unbekanntes outcome verändert nichts
    const beforeRaw = mockStorage.getItem('kopfrechen_weights_v1');
    const unchangedTopic = adjustWeight('unbekannt', 'wrong');
    assert.deepEqual(unchangedTopic, w);
    assert.equal(mockStorage.getItem('kopfrechen_weights_v1'), beforeRaw);

    const unchangedOutcome = adjustWeight('de1_1', 'skip_unknown');
    assert.deepEqual(unchangedOutcome, w);
    assert.equal(mockStorage.getItem('kopfrechen_weights_v1'), beforeRaw);

    // getTopGaps: nur > 1.0, absteigend sortiert, Tie-Break nach TOPIC_IDS, Limit beachten
    adjustWeight('de5_2', 'gap'); // 1.4
    adjustWeight('de5_2', 'wrong'); // 1.55 (Gleichstand mit de1_1)
    adjustWeight('de4_2', 'wrong'); // 1.15
    assert.deepEqual(getTopGaps(), ['de3_1', 'de1_1', 'de5_2']);
    assert.deepEqual(getTopGaps(2), ['de3_1', 'de1_1']);
    assert.deepEqual(getTopGaps(10), ['de3_1', 'de1_1', 'de5_2', 'de4_2']);
    assert.deepEqual(getTopGaps(0), []);
    assert.deepEqual(getTopGaps(-3), []);

    // Kaputtes JSON und ungültige Werte sicher abfangen
    mockStorage.setItem('kopfrechen_weights_v1', '{kaputt');
    const afterCorrupt = getWeights();
    for (const id of TOPIC_IDS) {
      assert.equal(afterCorrupt[id], 1.0);
    }

    mockStorage.setItem('kopfrechen_weights_v1', JSON.stringify(['ungueltig']));
    const afterArray = getWeights();
    for (const id of TOPIC_IDS) {
      assert.equal(afterArray[id], 1.0);
    }

    mockStorage.setItem(
      'kopfrechen_weights_v1',
      JSON.stringify({ de1_1: 9.99, de2_1: 0.4, de3_1: 1.236, de4_1: 'text' })
    );
    const clamped = getWeights();
    assert.equal(clamped.de1_1, 2.5);
    assert.equal(clamped.de2_1, 1.0);
    assert.equal(clamped.de3_1, 1.24);
    assert.equal(clamped.de4_1, 1.0);
  });
});

test('V1.2 storage.js Multi-Timer-Highscores: Zeitstufen, Maximum, Migration und 60s-Sync', async () => {
  assert.equal(normalizeDuration(), 60);
  assert.equal(normalizeDuration(null), 60);
  assert.equal(normalizeDuration(''), 60);
  assert.equal(normalizeDuration(45), 60);
  assert.equal(normalizeDuration('90'), 60);
  assert.equal(normalizeDuration(Number.NaN), 60);
  assert.equal(normalizeDuration(60), 60);
  assert.equal(normalizeDuration(120), 120);
  assert.equal(normalizeDuration('300'), 300);
  assert.equal(normalizeDuration(600), 600);

  await withMockLocalStorage(async (mockStorage) => {
    assert.deepEqual(getHighScores(), { 60: 0, 120: 0, 300: 0, 600: 0 });
    assert.equal(getHighScore(), 0);

    // Bestehenden 60s-Highscore aus kopfrechen_user_data_v1 übernehmen
    mockStorage.setItem(
      'kopfrechen_user_data_v1',
      JSON.stringify({ streak: 5, highScore: 19, lastPlayedDate: '2026-11-12' })
    );
    assert.deepEqual(getHighScores(), { 60: 19, 120: 0, 300: 0, 600: 0 });
    assert.equal(getHighScore(60), 19);

    // Niedrigerer Score bei 60s überschreibt nicht
    const below60 = saveHighScore(15, 60);
    assert.deepEqual(below60, {
      durationSeconds: 60,
      highScore: 19,
      isNewHighScore: false,
      highScores: { 60: 19, 120: 0, 300: 0, 600: 0 }
    });

    // Neuer 60s-Rekord synchronisiert auch kopfrechen_user_data_v1
    const beat60 = saveHighScore(24, 60);
    assert.deepEqual(beat60, {
      durationSeconds: 60,
      highScore: 24,
      isNewHighScore: true,
      highScores: { 60: 24, 120: 0, 300: 0, 600: 0 }
    });
    assert.deepEqual(await loadUserData(), {
      streak: 5,
      highScore: 24,
      lastPlayedDate: '2026-11-12'
    });

    // Andere Zeitstufen speichern unabhängig und verändern 60s-Profil nicht
    const new120 = saveHighScore(38, 120);
    assert.deepEqual(new120, {
      durationSeconds: 120,
      highScore: 38,
      isNewHighScore: true,
      highScores: { 60: 24, 120: 38, 300: 0, 600: 0 }
    });
    assert.deepEqual(saveHighScore(38, 120), {
      durationSeconds: 120,
      highScore: 38,
      isNewHighScore: false,
      highScores: { 60: 24, 120: 38, 300: 0, 600: 0 }
    });
    assert.equal(saveHighScore(30, 120).isNewHighScore, false);
    assert.equal(getHighScore(120), 38);

    assert.equal(saveHighScore(52, 300).isNewHighScore, true);
    assert.equal(saveHighScore(88, 600).isNewHighScore, true);
    assert.deepEqual(getHighScores(), { 60: 24, 120: 38, 300: 52, 600: 88 });
    assert.equal((await loadUserData()).highScore, 24);

    // Fehlender oder ungültiger Dauer-Parameter fällt auf 60 zurück
    const defaultSaved = saveHighScore(29);
    assert.equal(defaultSaved.durationSeconds, 60);
    assert.equal(defaultSaved.isNewHighScore, true);
    assert.equal(getHighScore(), 29);

    const invalidSaved = saveHighScore(31, 999);
    assert.equal(invalidSaved.durationSeconds, 60);
    assert.equal(invalidSaved.isNewHighScore, true);
    assert.equal((await loadUserData()).highScore, 31);

    // Kaputtes JSON in kopfrechen_highscores_v1 fällt sicher auf 0 bzw. 60s-Profilwert zurück
    mockStorage.setItem('kopfrechen_highscores_v1', '{kaputt');
    assert.deepEqual(getHighScores(), { 60: 31, 120: 0, 300: 0, 600: 0 });
  });
});

test('V1.2 engine.js Session-History, Gap-Markierung, PPM und summarizeSession', () => {
  const q1 = generateTopicQuestion('de1_1', 1, () => 0.1);
  const q2 = generateTopicQuestion('de3_2', 2, () => 0.25);
  const q3 = generateTopicQuestion('de6_1', 3, () => 0.4);

  const h0 = createSessionHistory();
  assert.deepEqual(h0, []);

  // Richtige Antwort
  const h1 = recordSessionAnswer(h0, q1, checkAnswer(q1, String(q1.answer)));
  // Übersprungene Aufgabe (leere Eingabe -> userAnswer: null)
  const h2 = recordSessionAnswer(h1, q2, checkAnswer(q2, ''));
  // Falsche Zahleneingabe
  const wrongInput = q3.answer + 1;
  const h3 = recordSessionAnswer(h2, q3, checkAnswer(q3, String(wrongInput)));

  // Immutabilität prüfen
  assert.equal(h0.length, 0);
  assert.equal(h1.length, 1);
  assert.equal(h2.length, 2);
  assert.equal(h3.length, 3);

  assert.deepEqual(h3[0], {
    topicId: q1.topicId,
    topicLabel: q1.topicLabel,
    question: q1.question,
    correctAnswer: q1.answer,
    userAnswer: q1.answer,
    isCorrect: true,
    steps: q1.steps,
    markedAsGap: false
  });
  assert.deepEqual(h3[1], {
    topicId: q2.topicId,
    topicLabel: q2.topicLabel,
    question: q2.question,
    correctAnswer: q2.answer,
    userAnswer: null,
    isCorrect: false,
    steps: q2.steps,
    markedAsGap: false
  });
  assert.deepEqual(h3[2], {
    topicId: q3.topicId,
    topicLabel: q3.topicLabel,
    question: q3.question,
    correctAnswer: q3.answer,
    userAnswer: wrongInput,
    isCorrect: false,
    steps: q3.steps,
    markedAsGap: false
  });

  // Schritte werden als Kopie abgelegt
  const entryDirect = createHistoryEntry(q1, checkAnswer(q1, String(q1.answer)));
  q1.steps.push('nachträglich geändert');
  assert.equal(h3[0].steps.includes('nachträglich geändert'), false);
  assert.equal(entryDirect.steps.includes('nachträglich geändert'), false);

  // setHistoryGap markiert und entmarkiert immutabel
  const h4 = setHistoryGap(h3, 1, true);
  assert.equal(h3[1].markedAsGap, false);
  assert.equal(h4[0].markedAsGap, false);
  assert.equal(h4[1].markedAsGap, true);
  assert.equal(h4[2].markedAsGap, false);

  const h5 = setHistoryGap(h4, 1, false);
  assert.equal(h5[1].markedAsGap, false);

  assert.equal(setHistoryGap(h4, -1, true).length, 3);
  assert.equal(setHistoryGap(h4, 99, true)[1].markedAsGap, true);

  // calculatePpm über verschiedene Zeitstufen (60, 120, 300, 600) und Randfälle
  assert.equal(calculatePpm(15, 60), 15);
  assert.equal(calculatePpm(25, 120), 12.5);
  assert.equal(calculatePpm(45, 300), 9);
  assert.equal(calculatePpm(105, 600), 10.5);
  assert.equal(calculatePpm(1, 300), 0.2);
  assert.equal(calculatePpm(11, 600), 1.1);
  assert.equal(calculatePpm(7, 180), 2.3);
  assert.equal(calculatePpm(5, 180), 1.7);
  assert.equal(calculatePpm(12), 12);
  assert.equal(calculatePpm(0, 60), 0);
  assert.equal(calculatePpm(-3, 60), 0);
  assert.equal(calculatePpm(10, 0), 0);
  assert.equal(calculatePpm(10, -60), 0);

  // summarizeSession über verschiedene Zeitstufen und für leere History
  assert.deepEqual(summarizeSession(h3, 60), {
    total: 3,
    correctCount: 1,
    wrongCount: 2,
    accuracyPercent: 33,
    ppm: 1,
    durationSeconds: 60
  });
  assert.deepEqual(summarizeSession(h3, 120), {
    total: 3,
    correctCount: 1,
    wrongCount: 2,
    accuracyPercent: 33,
    ppm: 0.5,
    durationSeconds: 120
  });
  assert.deepEqual(summarizeSession(h3, 300), {
    total: 3,
    correctCount: 1,
    wrongCount: 2,
    accuracyPercent: 33,
    ppm: 0.2,
    durationSeconds: 300
  });
  assert.deepEqual(summarizeSession(h3, 600), {
    total: 3,
    correctCount: 1,
    wrongCount: 2,
    accuracyPercent: 33,
    ppm: 0.1,
    durationSeconds: 600
  });
  assert.deepEqual(summarizeSession([], 120), {
    total: 0,
    correctCount: 0,
    wrongCount: 0,
    accuracyPercent: 0,
    ppm: 0,
    durationSeconds: 120
  });
});
```

## tools/update-spiegel.mjs

```javascript
#!/usr/bin/env node
/**
 * Hilfsskript zur automatischen Spiegelung von kopfrechen-pwa:
 * - --code:  Erzeugt CODE_SPIEGEL.md aus allen aktuellen Projektdateien neu.
 * - --drive: Synchronisiert den Projektordner per rsync nach Google Drive (KI-Spiegel/kopfrechen-pwa).
 * Ohne Flag werden beide Schritte nacheinander ausgefuehrt.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODE_SPIEGEL_PATH = path.join(ROOT, 'CODE_SPIEGEL.md');

const PREFERRED_ORDER = [
  'SPEC.md',
  'AGENTS.md',
  '.gitignore',
  '.nojekyll',
  'storage.js',
  'engine.js',
  'ui.js',
  'sw.js',
  'manifest.json',
  'icon.svg',
  'index.html',
  'tests.mjs',
  'tools/update-spiegel.mjs'
];

const EXCLUDED_DIRS = new Set(['.git', 'node_modules']);
const EXCLUDED_FILES = new Set(['.DS_Store', 'CODE_SPIEGEL.md']);
const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2', '.pdf', '.zip']);

function languageForFile(relPath) {
  const base = path.basename(relPath);
  if (base === '.gitignore') return 'gitignore';
  if (base === 'pre-commit' || base === 'post-commit') return 'bash';
  const ext = path.extname(relPath).toLowerCase();
  const map = {
    '.md': 'markdown',
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.svg': 'xml',
    '.sh': 'bash',
    '.command': 'bash'
  };
  return map[ext] ?? 'text';
}

function chooseFence(content) {
  let maxRun = 0;
  for (const match of content.matchAll(/`+/g)) {
    if (match[0].length > maxRun) maxRun = match[0].length;
  }
  const length = Math.max(3, maxRun + 1);
  return '`'.repeat(length);
}

async function collectProjectFiles(dir = ROOT, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const collected = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
      collected.push(...(await collectProjectFiles(path.join(dir, entry.name), nextPrefix)));
    } else if (entry.isFile()) {
      if (EXCLUDED_FILES.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTS.has(ext)) continue;
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      collected.push(relPath);
    }
  }

  return collected;
}

async function sortProjectFiles(files) {
  const fileSet = new Set(files);
  const ordered = PREFERRED_ORDER.filter((rel) => fileSet.has(rel));
  const orderedSet = new Set(ordered);
  const remaining = files.filter((rel) => !orderedSet.has(rel)).sort();
  return [...ordered, ...remaining];
}

export async function buildCodeSpiegel() {
  const allFiles = await collectProjectFiles();
  const orderedFiles = await sortProjectFiles(allFiles);

  const sections = [
    '# CODE_SPIEGEL.md',
    '',
    `Aktueller Volltext der Kerndateien aus \`${ROOT}\`.`
  ];

  for (const relPath of orderedFiles) {
    const raw = await fs.readFile(path.join(ROOT, relPath), 'utf8');
    const trimmedEnd = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
    const lang = languageForFile(relPath);
    const fence = chooseFence(trimmedEnd);

    sections.push('', `## ${relPath}`, '');
    if (trimmedEnd.length === 0) {
      sections.push(`${fence}${lang}`, fence);
    } else {
      sections.push(`${fence}${lang}`, trimmedEnd, fence);
    }
  }

  const nextContent = `${sections.join('\n')}\n`;
  let previousContent = null;
  try {
    previousContent = await fs.readFile(CODE_SPIEGEL_PATH, 'utf8');
  } catch {
    previousContent = null;
  }

  if (previousContent !== nextContent) {
    await fs.writeFile(CODE_SPIEGEL_PATH, nextContent, 'utf8');
    console.log('CODE_SPIEGEL.md aktualisiert.');
  } else {
    console.log('CODE_SPIEGEL.md ist bereits aktuell.');
  }
}

async function findGoogleDriveRoot() {
  const cloudStorage = path.join(os.homedir(), 'Library', 'CloudStorage');
  let entries;
  try {
    entries = await fs.readdir(cloudStorage, { withFileTypes: true });
  } catch {
    return null;
  }

  const preferred = 'GoogleDrive-kovertben@gmail.com';
  const candidates = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('GoogleDrive-'))
    .map((e) => e.name)
    .sort((a, b) => (a === preferred ? -1 : b === preferred ? 1 : a.localeCompare(b)));

  for (const accountDir of candidates) {
    for (const driveName of ['Meine Ablage', 'My Drive']) {
      const candidate = path.join(cloudStorage, accountDir, driveName);
      try {
        const stat = await fs.stat(candidate);
        if (stat.isDirectory()) return candidate;
      } catch {
        // Naechsten Kandidaten pruefen.
      }
    }
  }
  return null;
}

export async function syncDriveMirror() {
  const driveRoot = await findGoogleDriveRoot();
  if (!driveRoot) {
    console.warn('Hinweis: Google-Drive-Ordner nicht gefunden, Drive-Sync uebersprungen.');
    return false;
  }

  const targetDir = path.join(driveRoot, 'KI-Spiegel', 'kopfrechen-pwa');
  await fs.mkdir(targetDir, { recursive: true });

  execFileSync(
    '/usr/bin/rsync',
    [
      '-rt',
      '--delete',
      '--exclude=.DS_Store',
      '--exclude=.git/',
      '--exclude=node_modules/',
      `${ROOT}/`,
      `${targetDir}/`
    ],
    { stdio: 'inherit' }
  );

  console.log(`Drive-Spiegel synchronisiert: ${targetDir}`);
  return true;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const runCode = args.has('--code') || args.size === 0;
  const runDrive = args.has('--drive') || args.size === 0;

  if (!runCode && !runDrive) {
    console.error('Unbekannte Option. Erlaubt: --code, --drive (oder ohne Flag fuer beides).');
    process.exit(2);
  }

  if (runCode) await buildCodeSpiegel();
  if (runDrive) await syncDriveMirror();
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
```

## Start-Lokal.command

```bash
#!/bin/bash
set -u

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

PROJECT_DIR="/Users/benkovert/kopfrechen-pwa"
PORT=8080
URL="http://localhost:$PORT"
LOG_FILE="/tmp/kopfrechen-pwa-server.log"

cd "$PROJECT_DIR" || {
  echo "Fehler: Ordner $PROJECT_DIR wurde nicht gefunden."
  exit 1
}

if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Lokaler Webserver auf Port $PORT läuft bereits."
else
  echo "Starte lokalen Webserver in $PROJECT_DIR auf Port $PORT..."
  nohup python3 -m http.server "$PORT" >"$LOG_FILE" 2>&1 </dev/null &
  SERVER_PID=$!

  i=0
  while [ "$i" -lt 20 ]; do
    if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
      break
    fi
    if ! kill -0 "$SERVER_PID" 2>/dev/null; then
      echo "Fehler: Webserver konnte nicht gestartet werden. Details in $LOG_FILE"
      exit 1
    fi
    sleep 0.1
    i=$((i + 1))
  done
fi

echo "Öffne $URL im Standardbrowser..."
open "$URL"
```

## tools/git-hooks/post-commit

```bash
#!/bin/sh
set -e
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

REPO_ROOT="$(git rev-parse --show-toplevel)"
node "$REPO_ROOT/tools/update-spiegel.mjs" --drive

# Optional: automatischer Push im Hintergrund (aktivieren per: git config kopfrechen.autoPush true)
if [ "$(git config --bool kopfrechen.autoPush 2>/dev/null || echo false)" = "true" ]; then
  nohup git -C "$REPO_ROOT" push origin main >/dev/null 2>&1 &
fi
```

## tools/git-hooks/pre-commit

```bash
#!/bin/sh
set -e
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

REPO_ROOT="$(git rev-parse --show-toplevel)"
node "$REPO_ROOT/tools/update-spiegel.mjs" --code
git add "$REPO_ROOT/CODE_SPIEGEL.md"
```
