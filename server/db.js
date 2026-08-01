// Very small JSON-file "database". Good enough for a class-sized quiz app.
// Swap this out for Postgres/Mongo later if you outgrow it — every function
// below is a natural place to do that since callers only touch this module.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function loadRaw() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { users: [], quizzes: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], quizzes: [] };
  }
}

let cache = loadRaw();

function persist() {
  fs.writeFileSync(DB_PATH, JSON.stringify(cache, null, 2));
}

// ---------- Users ----------
function getUserByEmail(email) {
  return cache.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  return cache.users.find((u) => u.id === id);
}

function createUser(user) {
  cache.users.push(user);
  persist();
  return user;
}

function updateUser(id, patch) {
  const u = getUserById(id);
  if (!u) return null;
  Object.assign(u, patch);
  persist();
  return u;
}

// ---------- Quizzes ----------
function getQuizzesByTutor(tutorId) {
  return cache.quizzes.filter((q) => q.tutorId === tutorId);
}

function getQuizById(id) {
  return cache.quizzes.find((q) => q.id === id);
}

function getQuizByCode(code) {
  return cache.quizzes.find((q) => q.code.toUpperCase() === code.toUpperCase());
}

function createQuiz(quiz) {
  cache.quizzes.push(quiz);
  persist();
  return quiz;
}

function saveQuiz() {
  // call after mutating a quiz object obtained from getQuizById/getQuizByCode
  persist();
}

function deleteQuiz(id) {
  cache.quizzes = cache.quizzes.filter((q) => q.id !== id);
  persist();
}

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  getQuizzesByTutor,
  getQuizById,
  getQuizByCode,
  createQuiz,
  saveQuiz,
  deleteQuiz,
};
