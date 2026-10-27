// Use a small set of sample quests until the project has a server.
var sampleQuests = [
  { id: "quest-1", title: "Find a hackathon teammate", description: "Looking for someone who loves building useful little tools. Any skill level is welcome.", difficulty: "Hard", status: "Open", postedBy: "hero-2", acceptedBy: null },
  { id: "quest-2", title: "Explain recursion like I'm five", description: "I have a data structures quiz coming up. A simple example would save me.", difficulty: "Medium", status: "Open", postedBy: "hero-3", acceptedBy: null },
  { id: "quest-3", title: "Share your neatest Figma trick", description: "Show me one shortcut or workflow that makes your design process faster.", difficulty: "Easy", status: "Open", postedBy: "hero-1", acceptedBy: null },
  { id: "quest-4", title: "Find me a React teammate", description: "Dreaming up a campus events app for the weekend build sprint. Let's make it real.", difficulty: "Legendary", status: "Open", postedBy: "hero-3", acceptedBy: null },
  { id: "quest-5", title: "Lend me your database notes", description: "Missed one lecture on MongoDB. Happy to return the favor before exams.", difficulty: "Easy", status: "Active", postedBy: "hero-2", acceptedBy: "hero-1" },
  { id: "quest-6", title: "Review my portfolio homepage", description: "A second pair of eyes on the layout and wording would be amazing.", difficulty: "Medium", status: "Done", postedBy: "hero-1", acceptedBy: "hero-2" }
];

// Load saved quests or initialize this browser with the demo quests.
function getQuests() {
  var savedQuests = localStorage.getItem("questboardQuests");
  if (savedQuests) {
    return JSON.parse(savedQuests);
  }
  localStorage.setItem("questboardQuests", JSON.stringify(sampleQuests));
  return sampleQuests;
}

// Find the hero currently using this browser.
function getCurrentHero() {
  var heroes = JSON.parse(localStorage.getItem("questboardHeroes") || "[]");
  var heroId = localStorage.getItem("questboardCurrentHero") || "hero-1";
  return heroes.find(function (hero) { return hero.id === heroId; }) || heroes[0] || { id: "hero-1", name: "NovaByte", avatar: "🧑‍💻" };
}

// Turn a quest into a card using DOM elements and safe text content.
function makeQuestCard(quest) {
  var heroes = JSON.parse(localStorage.getItem("questboardHeroes") || "[]");
  var owner = heroes.find(function (hero) { return hero.id === quest.postedBy; }) || { name: "Campus Hero", avatar: "🧙" };
  var card = document.createElement("article");
  card.className = "panel quest-card";
  var top = document.createElement("div");
  var difficultyBadge = document.createElement("span");
  difficultyBadge.className = "difficulty difficulty-" + quest.difficulty.toLowerCase();
  difficultyBadge.textContent = quest.difficulty;
  var statusBadge = document.createElement("span");
  statusBadge.className = "status-tag status-" + quest.status.toLowerCase();
  statusBadge.textContent = " " + quest.status;
  top.append(difficultyBadge, statusBadge);
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
  reward.textContent = "+" + getReward(quest.difficulty) + " XP";
  meta.append(author, reward);
  card.append(top, title, description, meta);
  if (quest.status === "Open" && quest.postedBy !== getCurrentHero().id) {
    var acceptButton = document.createElement("button");
    acceptButton.className = "btn btn-outline-neon btn-sm mt-3";
    acceptButton.textContent = "Accept quest →";
    acceptButton.addEventListener("click", function () { acceptQuest(quest.id); });
    card.appendChild(acceptButton);
  }
  return card;
}

// Return the demo XP reward for each difficulty.
function getReward(difficulty) {
  var rewards = { Easy: 20, Medium: 50, Hard: 100, Legendary: 200 };
  return rewards[difficulty] || 0;
}

// Draw the cards that match the search box and selected filters.
function renderQuests() {
  var allQuests = getQuests();
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
    list.innerHTML = '<div class="col-12"><div class="panel empty-state">No quests match that search. Try another filter.</div></div>';
  }
}

// Let the current hero accept an open quest in the local demo.
function acceptQuest(questId) {
  var quests = getQuests();
  quests.forEach(function (quest) {
    if (quest.id === questId) {
      quest.status = "Active";
      quest.acceptedBy = getCurrentHero().id;
    }
  });
  localStorage.setItem("questboardQuests", JSON.stringify(quests));
  renderQuests();
}

// Save a new demo quest from the post form.
function postQuest(event) {
  event.preventDefault();
  var title = document.getElementById("quest-title").value.trim();
  var description = document.getElementById("quest-description").value.trim();
  var difficulty = document.getElementById("quest-difficulty").value;
  var quests = getQuests();
  quests.unshift({ id: "quest-" + Date.now(), title: title, description: description, difficulty: difficulty, status: "Open", postedBy: getCurrentHero().id, acceptedBy: null });
  localStorage.setItem("questboardQuests", JSON.stringify(quests));
  document.getElementById("quest-form").reset();
  bootstrap.Modal.getInstance(document.getElementById("questModal")).hide();
  renderQuests();
}

// Pick a random open quest and briefly highlight its card.
function chooseRandomQuest() {
  var openQuests = getQuests().filter(function (quest) { return quest.status === "Open"; });
  if (openQuests.length === 0) {
    return;
  }
  var chosenQuest = openQuests[Math.floor(Math.random() * openQuests.length)];
  document.getElementById("search-input").value = chosenQuest.title;
  document.getElementById("difficulty-filter").value = "All";
  document.getElementById("status-filter").value = "All";
  renderQuests();
  document.getElementById("quest-list").scrollIntoView({ behavior: "smooth" });
}

// Connect the page controls and show the sample quest cards.
document.getElementById("search-input").addEventListener("input", renderQuests);
document.getElementById("difficulty-filter").addEventListener("change", renderQuests);
document.getElementById("status-filter").addEventListener("change", renderQuests);
document.getElementById("quest-form").addEventListener("submit", postQuest);
document.getElementById("random-button").addEventListener("click", chooseRandomQuest);
renderQuests();
