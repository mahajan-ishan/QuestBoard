// Keep every request to the Express API in this file.
var API_BASE = "/api";
var TOKEN_KEY = "questboard_token";
var HERO_KEY = "questboard_hero";
var LAST_SEEN_LEVEL_KEY = "questboard_last_seen_level";

// Read the saved session token.
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Read the saved hero profile.
function getCurrentHero() {
  var heroJson = localStorage.getItem(HERO_KEY);
  if (!heroJson) return null;

  try {
    return JSON.parse(heroJson);
  } catch (error) {
    console.error("Could not read the saved hero:", error.message);
    return null;
  }
}

// Check whether both parts of the login session are present.
function isLoggedIn() {
  return Boolean(getToken() && getCurrentHero());
}

// Save the login response and set the starting level for popup checks.
function saveSession(token, hero) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(HERO_KEY, JSON.stringify(hero));
  localStorage.setItem(LAST_SEEN_LEVEL_KEY, String(hero.level));
}

// Remove all saved session data.
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(HERO_KEY);
  localStorage.removeItem(LAST_SEEN_LEVEL_KEY);
}

// Send one JSON request, adding the token when available.
async function apiRequest(path, method, body) {
  var headers = { "Content-Type": "application/json" };
  var token = getToken();
  if (token) {
    headers.Authorization = token;
  }

  var options = {
    method: method || "GET",
    headers: headers
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  var response;
  try {
    response = await fetch(API_BASE + path, options);
  } catch (error) {
    console.error("API request failed:", error.message);
    throw new Error("Cannot reach the server. Check that QuestBoard is running.");
  }

  var result = {};
  try {
    result = await response.json();
  } catch (error) {
    if (response.status !== 204) {
      console.error("Could not read the API response:", error.message);
    }
  }

  if (response.status === 401 && path !== "/auth/login" && path !== "/auth/register") {
    clearSession();
    if (!window.location.pathname.endsWith("/login.html")) {
      window.location.href = "login.html";
    }
  }

  if (!response.ok) {
    var requestError = new Error(result.message || "The server could not complete the request.");
    requestError.status = response.status;
    throw requestError;
  }
  return result;
}

// Keep the existing questApi methods available while page scripts are migrated.
async function getQuests(filters) {
  var query = [];
  if (filters && filters.difficulty && filters.difficulty !== "All") {
    query.push("difficulty=" + encodeURIComponent(filters.difficulty));
  }
  if (filters && filters.status && filters.status !== "All") {
    query.push("status=" + encodeURIComponent(filters.status));
  }
  return await apiRequest("/quests" + (query.length ? "?" + query.join("&") : ""), "GET");
}

async function createQuest(quest) {
  return await apiRequest("/quests", "POST", quest);
}

async function updateQuest(id, changes) {
  return await apiRequest("/quests/" + encodeURIComponent(id), "PUT", changes);
}

async function deleteQuest(id) {
  return await apiRequest("/quests/" + encodeURIComponent(id), "DELETE");
}

async function getHeroes() {
  return await apiRequest("/heroes", "GET");
}

async function getHero(id) {
  return await apiRequest("/heroes/" + encodeURIComponent(id), "GET");
}

async function getLeaderboard() {
  return await apiRequest("/leaderboard", "GET");
}

window.questApi = {
  getQuests: getQuests,
  createQuest: createQuest,
  updateQuest: updateQuest,
  deleteQuest: deleteQuest,
  getHeroes: getHeroes,
  getHero: getHero,
  getLeaderboard: getLeaderboard
};
