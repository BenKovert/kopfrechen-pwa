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
