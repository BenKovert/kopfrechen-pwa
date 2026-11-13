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
