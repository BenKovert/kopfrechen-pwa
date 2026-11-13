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
