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
