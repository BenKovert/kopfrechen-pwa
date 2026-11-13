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
- **`CODE_SPIEGEL.md`**: Synchronisierter Volltext-Spiegel der Kerndateien im Projektordner für schnellen Kontextabgleich und externe Reviews.

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
4. **`CODE_SPIEGEL.md` synchronisieren**: Die Volltext-Spiegeldatei `CODE_SPIEGEL.md` im Projekt auf den aktuellen Stand der Kerndateien bringen (und bei Bedarf mit committen/pushen).
5. **Google-Drive-Spiegel synchronisieren**: Den kompletten Projektstand in das Spiegelverzeichnis übertragen:
   `~/Library/CloudStorage/GoogleDrive-kovertben@gmail.com/Meine Ablage/KI-Spiegel/kopfrechen-pwa/`

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
3. **Spiegel synchronisieren**:
   Direkt nach dem Commit/Push werden `CODE_SPIEGEL.md` im Projektordner und der Google-Drive-Spiegel (`~/Library/CloudStorage/GoogleDrive-kovertben@gmail.com/Meine Ablage/KI-Spiegel/kopfrechen-pwa/`) auf den aktuellen Stand gebracht.
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
 * Verwaltet ausschließlich das Lesen und Schreiben des Nutzerprofils.
 * Aktuell über LocalStorage, gekapselt hinter async-Funktionen für späteren Backend-Tausch (z. B. Supabase).
 */

const STORAGE_KEY = 'kopfrechen_user_data_v1';

const DEFAULT_USER_DATA = {
  streak: 0,
  highScore: 0,
  lastPlayedDate: null
};

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
 * Lädt das Nutzerprofil asynchron aus dem Speicher.
 * @returns {Promise<{ streak: number, highScore: number, lastPlayedDate: string | null }>}
 */
export async function loadUserData() {
  try {
    const serialized = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!serialized) {
      return { ...DEFAULT_USER_DATA };
    }
    const parsed = JSON.parse(serialized);
    return normalizeUserData(parsed);
  } catch {
    return { ...DEFAULT_USER_DATA };
  }
}

/**
 * Speichert das Nutzerprofil asynchron.
 * @param {{ streak: number, highScore: number, lastPlayedDate: string | null }} data
 * @returns {Promise<{ streak: number, highScore: number, lastPlayedDate: string | null }>}
 */
export async function saveUserData(data) {
  const normalized = normalizeUserData(data);
  globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
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

export const CATEGORIES = Object.freeze({
  SQUARES: 'Quadratzahlen',
  POWERS: 'Potenzen',
  LINEAR: 'Lineare Gleichungen',
  PERCENT: 'Prozentrechnung'
});

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
 * Zufällige Ganzzahl im Bereich [min, max] inklusive.
 * @param {number} min
 * @param {number} max
 * @param {() => number} randomFn
 * @returns {number}
 */
function randomInt(min, max, randomFn = Math.random) {
  return Math.floor(randomFn() * (max - min + 1)) + min;
}

/**
 * Wählt ein zufälliges Element aus einem Array.
 * @template T
 * @param {readonly T[]} items
 * @param {() => number} randomFn
 * @returns {T}
 */
function pickRandom(items, randomFn = Math.random) {
  return items[Math.floor(randomFn() * items.length)];
}

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
    const sign = randomFn() < 0.5 ? 1 : -1;
    b = sign * randomInt(1, 15, randomFn);
    if (a * x + b < 1) {
      b = Math.abs(b);
    }
  } else {
    a = randomInt(3, 12, randomFn);
    x = randomInt(2, 15, randomFn);
    const sign = randomFn() < 0.5 ? 1 : -1;
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
 * Generiert eine neue Mathe-Aufgabe gemäß festem Daten-Vertrag.
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
 * Prüft eine Nutzereingabe gegen die korrekte Antwort einer Aufgabe.
 * @param {{ correctAnswer: number }} question
 * @param {string | number} rawInput
 * @returns {{ isCorrect: boolean, correctAnswer: number, userAnswer: number | null }}
 */
export function checkAnswer(question, rawInput) {
  const trimmed = String(rawInput ?? '').trim();
  if (trimmed === '') {
    return {
      isCorrect: false,
      correctAnswer: question.correctAnswer,
      userAnswer: null
    };
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return {
      isCorrect: false,
      correctAnswer: question.correctAnswer,
      userAnswer: null
    };
  }

  return {
    isCorrect: parsed === question.correctAnswer,
    correctAnswer: question.correctAnswer,
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
 * Berechnet das aktualisierte Nutzerprofil (Streak & Highscore) nach Spielende.
 * Bei score === 0 bleiben streak und lastPlayedDate unverändert.
 * @param {{ streak: number, highScore: number, lastPlayedDate: string | null }} currentProfile
 * @param {number} score
 * @param {string} [todayStr=getLocalDateString()]
 * @returns {{ profile: { streak: number, highScore: number, lastPlayedDate: string | null }, isNewHighScore: boolean, streakIncreased: boolean }}
 */
export function updateUserProfile(currentProfile, score, todayStr = getLocalDateString()) {
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

  if (safeScore === 0) {
    return {
      profile: {
        streak: prevStreak,
        highScore: prevHighScore,
        lastPlayedDate: lastPlayed
      },
      isNewHighScore: false,
      streakIncreased: false
    };
  }

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

  return {
    profile: {
      streak: nextStreak,
      highScore: nextHighScore,
      lastPlayedDate: todayStr
    },
    isNewHighScore,
    streakIncreased
  };
}

/**
 * Liefert einen zufälligen Mathe-Fun-Fact aus der Liste.
 * @param {() => number} [randomFn=Math.random]
 * @returns {{ index: number, text: string }}
 */
export function getRandomFunFact(randomFn = Math.random) {
  const index = Math.floor(randomFn() * MATH_FUN_FACTS.length);
  return {
    index,
    text: MATH_FUN_FACTS[index]
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
  CATEGORIES,
  MATH_FUN_FACTS,
  generateQuestion,
  getDifficultyForScore,
  checkAnswer,
  updateUserProfile,
  getRandomFunFact
} from './engine.js';
import { loadUserData, saveUserData } from './storage.js';

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
```
