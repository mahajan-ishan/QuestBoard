// Demo profile data appears when a hero has not been chosen yet.
var demoHero = { id: "hero-1", name: "NovaByte", heroClass: "Coder", avatar: "🧑‍💻", xp: 260, level: 3 };
var demoAcceptedQuests = [
  { title: "Lend me your database notes", description: "In progress · +20 XP on completion", status: "Active" },
  { title: "Help debug my JavaScript loop", description: "Completed · +50 XP earned", status: "Done" }
];

// Find the saved hero selected on the home page.
function getProfileHero() {
  var heroes = JSON.parse(localStorage.getItem("questboardHeroes") || "[]");
  var heroId = localStorage.getItem("questboardCurrentHero") || "hero-1";
  return heroes.find(function (hero) { return hero.id === heroId; }) || heroes[0] || demoHero;
}

// Choose the short rank name for the hero's current level.
function getProfileRank(level) {
  if (level >= 7) return "Legend";
  if (level >= 5) return "Wizard";
  if (level >= 3) return "Apprentice";
  return "Noob";
}

// Show hero identity, level, rank, and progress to the next level.
function showProfile(hero) {
  var currentLevelXp = hero.xp % 100;
  document.getElementById("profile-avatar").textContent = hero.avatar;
  document.getElementById("profile-name").textContent = hero.name;
  document.getElementById("profile-class").textContent = hero.heroClass + " · " + getProfileRank(hero.level);
  document.getElementById("rank-title").textContent = getProfileRank(hero.level);
  document.getElementById("level-badge").textContent = "LVL " + hero.level;
  document.getElementById("xp-caption").textContent = currentLevelXp + " / 100 XP";
  document.getElementById("xp-percent").textContent = currentLevelXp + "%";
  document.getElementById("xp-progress").style.width = currentLevelXp + "%";
}

// Find accepted quests for this hero and show them as simple history cards.
function showMyQuests(hero) {
  var savedQuests = JSON.parse(localStorage.getItem("questboardQuests") || "[]");
  var acceptedQuests = savedQuests.filter(function (quest) { return quest.acceptedBy === hero.id; });
  var questHistory = acceptedQuests.map(function (quest) {
    return { title: quest.title, description: quest.status === "Done" ? "Completed quest" : "In progress · " + quest.difficulty + " quest", status: quest.status };
  });
  if (questHistory.length === 0 && hero.id === demoHero.id) {
    questHistory = demoAcceptedQuests;
  }
  var list = document.getElementById("my-quests");
  list.replaceChildren();
  questHistory.forEach(function (quest) {
    var column = document.createElement("div");
    column.className = "col-md-6";
    var card = document.createElement("article");
    card.className = "history-card";
    var title = document.createElement("h3");
    title.textContent = quest.title;
    var detail = document.createElement("p");
    detail.textContent = quest.description;
    card.append(title, detail);
    column.appendChild(card);
    list.appendChild(column);
  });
  document.getElementById("completed-count").textContent = questHistory.filter(function (quest) { return quest.status === "Done"; }).length;
  if (questHistory.length === 0) {
    list.innerHTML = '<div class="col-12"><div class="empty-state">No accepted quests yet. Find one on the quest board!</div></div>';
  }
}

// Fill the profile page with the selected demo hero.
var profileHero = getProfileHero();
showProfile(profileHero);
showMyQuests(profileHero);
