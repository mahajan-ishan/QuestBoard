// Keep every request to the Express server in this file.
var API_BASE = "/api";

// Send one JSON request and return its response data.
async function sendRequest(path, method, body) {
  var options = {
    method: method,
    headers: { "Content-Type": "application/json" }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  try {
    var response = await fetch(API_BASE + path, options);
    var result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "The server could not complete the request");
    }
    return result;
  } catch (error) {
    console.error("API request failed:", error.message);
    throw error;
  }
}

// Get quests and add the selected filters to the URL when needed.
async function getQuests(filters) {
  var query = [];
  if (filters && filters.difficulty && filters.difficulty !== "All") {
    query.push("difficulty=" + encodeURIComponent(filters.difficulty));
  }
  if (filters && filters.status && filters.status !== "All") {
    query.push("status=" + encodeURIComponent(filters.status));
  }
  var path = "/quests";
  if (query.length > 0) {
    path += "?" + query.join("&");
  }
  return await sendRequest(path, "GET");
}

// Create a quest in the database.
async function createQuest(quest) {
  return await sendRequest("/quests", "POST", quest);
}

// Edit, accept, or complete one quest.
async function updateQuest(id, changes) {
  return await sendRequest("/quests/" + encodeURIComponent(id), "PUT", changes);
}

// Delete a quest after sending the poster's ID.
async function deleteQuest(id, postedBy) {
  return await sendRequest("/quests/" + encodeURIComponent(id), "DELETE", { postedBy: postedBy });
}

// Get all heroes or create a new one.
async function getHeroes() {
  return await sendRequest("/heroes", "GET");
}

// Create a hero in the database.
async function createHero(hero) {
  return await sendRequest("/heroes", "POST", hero);
}

// Get one hero by the MongoDB ID saved in the browser.
async function getHero(id) {
  return await sendRequest("/heroes/" + encodeURIComponent(id), "GET");
}

// Add XP to one hero through the API.
async function addHeroXp(id, xpToAdd) {
  return await sendRequest("/heroes/" + encodeURIComponent(id), "PUT", { xpToAdd: xpToAdd });
}

// Get the ten highest-XP heroes.
async function getLeaderboard() {
  return await sendRequest("/leaderboard", "GET");
}

// Make the API functions available to the other page scripts.
window.questApi = {
  getQuests: getQuests,
  createQuest: createQuest,
  updateQuest: updateQuest,
  deleteQuest: deleteQuest,
  getHeroes: getHeroes,
  createHero: createHero,
  getHero: getHero,
  addHeroXp: addHeroXp,
  getLeaderboard: getLeaderboard
};
