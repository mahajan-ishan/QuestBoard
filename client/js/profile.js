// Show the hero's identity, level, and progress toward the next level.
function showProfile(hero) {
  var currentLevelXp = hero.xp % 100;
  document.getElementById("profile-avatar").textContent = hero.avatar;
  document.getElementById("profile-name").textContent = hero.name;
  document.getElementById("profile-class").textContent = hero.heroClass + " · " + questCommon.getRankTitle(hero.level);
  document.getElementById("rank-title").textContent = questCommon.getRankTitle(hero.level);
  document.getElementById("level-badge").textContent = "LVL " + hero.level;
  document.getElementById("xp-caption").textContent = currentLevelXp + " / 100 XP";
  document.getElementById("xp-percent").textContent = currentLevelXp + "%";
  document.getElementById("xp-progress").style.width = currentLevelXp + "%";
}

// Show quests accepted by this hero from the saved quest records.
function showMyQuests(quests, heroId) {
  var acceptedQuests = quests.filter(function (quest) { return quest.acceptedBy === heroId; });
  var list = document.getElementById("my-quests");
  list.replaceChildren();
  acceptedQuests.forEach(function (quest) {
    var column = document.createElement("div");
    column.className = "col-md-6";
    var card = document.createElement("article");
    card.className = "history-card";
    var title = document.createElement("h3");
    title.textContent = quest.title;
    var detail = document.createElement("p");
    detail.textContent = quest.status === "Done" ? "Completed · +" + quest.xpReward + " XP" : "In progress · " + quest.difficulty + " quest";
    card.append(title, detail);
    column.appendChild(card);
    list.appendChild(column);
  });
  var completedCount = acceptedQuests.filter(function (quest) { return quest.status === "Done"; }).length;
  document.getElementById("completed-count").textContent = completedCount;
  if (acceptedQuests.length === 0) {
    var empty = document.createElement("div");
    empty.className = "col-12 empty-state";
    empty.textContent = "No accepted quests yet. Find one on the quest board!";
    list.appendChild(empty);
  }
}

// Load the selected hero and their quest history from the API.
async function loadProfile() {
  var heroId = questCommon.getCurrentHeroId();
  if (!heroId) {
    document.getElementById("profile-name").textContent = "No hero selected";
    questCommon.showPageMessage("profile-class", "Choose a hero on the home page to view your profile.", true);
    return;
  }
  try {
    var hero = await questApi.getHero(heroId);
    var quests = await questApi.getQuests();
    showProfile(hero);
    showMyQuests(quests, heroId);
  } catch (error) {
    questCommon.showPageMessage("profile-class", "Could not load your profile. Check the server and try again.", true);
  }
}

// Load the real profile when the page opens.
loadProfile();
