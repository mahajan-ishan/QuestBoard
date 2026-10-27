// Hold the current API results while the player searches and filters them.
var allQuests = [];
var heroesById = {};
var currentHeroId = questCommon.getCurrentHeroId();

// Build a quest card from database data using text-only DOM elements.
function makeQuestCard(quest) {
  var owner = heroesById[quest.postedBy] || { name: "Campus Hero", avatar: "🧙" };
  var card = document.createElement("article");
  card.className = "panel quest-card";
  var top = document.createElement("div");
  var difficulty = document.createElement("span");
  difficulty.className = "difficulty difficulty-" + quest.difficulty.toLowerCase();
  difficulty.textContent = quest.difficulty;
  var status = document.createElement("span");
  status.className = "status-tag status-" + quest.status.toLowerCase();
  status.textContent = " " + quest.status;
  top.append(difficulty, status);
  var title = document.createElement("h3");
  title.textContent = quest.title;
  var description = document.createElement("p");
  description.textContent = quest.description;
  var meta = document.createElement("div");
  meta.className = "quest-meta";
  var author = document.createElement("span");
  author.className = "quest-author";
  author.textContent = owner.avatar + "  " + owner.name;
  var reward = document.createElement("span");
  reward.className = "xp-reward";
  reward.textContent = "+" + quest.xpReward + " XP";
  meta.append(author, reward);
  card.append(top, title, description, meta);
  if (quest.postedBy === currentHeroId) {
    var ownerActions = document.createElement("div");
    ownerActions.className = "d-flex gap-2 mt-3";
    if (quest.status === "Open") {
      var editButton = document.createElement("button");
      editButton.className = "btn btn-outline-neon btn-sm";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", function () { editQuest(quest); });
      ownerActions.appendChild(editButton);
    }
    var deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-outline-neon btn-sm";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () { deleteQuest(quest._id); });
    ownerActions.appendChild(deleteButton);
    card.appendChild(ownerActions);
  } else if (quest.status === "Open") {
    var acceptButton = document.createElement("button");
    acceptButton.className = "btn btn-outline-neon btn-sm mt-3";
    acceptButton.textContent = "Accept quest →";
    acceptButton.addEventListener("click", function () { acceptQuest(quest._id); });
    card.appendChild(acceptButton);
  } else if (quest.status === "Active" && quest.acceptedBy === currentHeroId) {
    var completeButton = document.createElement("button");
    completeButton.className = "btn btn-neon btn-sm mt-3";
    completeButton.textContent = "Complete quest +" + quest.xpReward + " XP";
    completeButton.addEventListener("click", function () { completeQuest(quest._id, quest.xpReward); });
    card.appendChild(completeButton);
  }
  return card;
}

// Show matching quest cards using the page search and filter controls.
function renderQuests() {
  var search = document.getElementById("search-input").value.toLowerCase();
  var difficulty = document.getElementById("difficulty-filter").value;
  var status = document.getElementById("status-filter").value;
  var visibleQuests = allQuests.filter(function (quest) {
    var matchesSearch = quest.title.toLowerCase().includes(search);
    var matchesDifficulty = difficulty === "All" || quest.difficulty === difficulty;
    var matchesStatus = status === "All" || quest.status === status;
    return matchesSearch && matchesDifficulty && matchesStatus;
  });
  var list = document.getElementById("quest-list");
  list.replaceChildren();
  visibleQuests.forEach(function (quest) {
    var column = document.createElement("div");
    column.className = "col-md-6 col-xl-4";
    column.appendChild(makeQuestCard(quest));
    list.appendChild(column);
  });
  document.getElementById("quest-count").textContent = visibleQuests.length;
  if (visibleQuests.length === 0) {
    var empty = document.createElement("div");
    empty.className = "col-12";
    empty.innerHTML = '<div class="panel empty-state">No quests match that search. Try another filter.</div>';
    list.appendChild(empty);
  }
}

// Load quests and heroes from the server before drawing the board.
async function loadBoard() {
  try {
    allQuests = await questApi.getQuests();
    var heroes = await questApi.getHeroes();
    heroesById = {};
    heroes.forEach(function (hero) { heroesById[hero._id] = hero; });
    renderQuests();
    questCommon.showPageMessage("board-message", "", false);
  } catch (error) {
    questCommon.showPageMessage("board-message", "Could not load quests. Check the server and try again.", true);
  }
}

// Select a random open quest and bring it into view.
function chooseRandomQuest() {
  var openQuests = allQuests.filter(function (quest) { return quest.status === "Open"; });
  if (openQuests.length === 0) {
    questCommon.showPageMessage("board-message", "There are no open quests right now.", false);
    return;
  }
  var chosenQuest = openQuests[Math.floor(Math.random() * openQuests.length)];
  document.getElementById("search-input").value = chosenQuest.title;
  document.getElementById("difficulty-filter").value = "All";
  document.getElementById("status-filter").value = "All";
  renderQuests();
  document.getElementById("quest-list").scrollIntoView({ behavior: "smooth" });
}

// Connect board controls and load the real quests.
document.getElementById("search-input").addEventListener("input", renderQuests);
document.getElementById("difficulty-filter").addEventListener("change", renderQuests);
document.getElementById("status-filter").addEventListener("change", renderQuests);
document.getElementById("random-button").addEventListener("click", chooseRandomQuest);
loadBoard();
