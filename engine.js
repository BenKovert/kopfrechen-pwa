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
