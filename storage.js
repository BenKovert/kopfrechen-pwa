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
