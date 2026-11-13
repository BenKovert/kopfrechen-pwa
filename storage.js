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
