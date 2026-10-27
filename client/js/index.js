// Load saved heroes from the API into the existing-hero menu.
async function showHeroes() {
  var select = document.getElementById("hero-select");
  try {
    var heroes = await questApi.getHeroes();
    heroes.forEach(function (hero) {
      var option = document.createElement("option");
      option.value = hero._id;
      option.textContent = hero.avatar + "  " + hero.name + " · " + hero.heroClass;
      select.appendChild(option);
    });
    var savedHeroId = questCommon.getCurrentHeroId();
    var savedHeroExists = heroes.some(function (hero) { return hero._id === savedHeroId; });
    if (savedHeroId && savedHeroExists) {
      select.value = savedHeroId;
    } else if (savedHeroId) {
      questCommon.clearCurrentHeroId();
    }
  } catch (error) {
    questCommon.showPageMessage("hero-message", "Could not load heroes. Check that the server is running.", true);
  }
}

// Replace the landing-page demo numbers with counts from the API.
async function showStats() {
  try {
    var quests = await questApi.getQuests();
    var heroes = await questApi.getHeroes();
    var openQuests = quests.filter(function (quest) { return quest.status === "Open"; });
    document.getElementById("open-quest-count").textContent = openQuests.length;
    document.getElementById("hero-count").textContent = heroes.length;
  } catch (error) {
    document.getElementById("open-quest-count").textContent = "—";
    document.getElementById("hero-count").textContent = "—";
  }
}

// Remember the selected hero and open the quest board.
function continueAsHero(event) {
  event.preventDefault();
  var heroId = document.getElementById("hero-select").value;
  if (!heroId) {
    questCommon.showPageMessage("hero-message", "Choose a hero first, adventurer.", true);
    return;
  }
  questCommon.setCurrentHeroId(heroId);
  window.location.href = "board.html";
}

// Create a hero through the API, then select the new hero.
async function createHeroFromForm(event) {
  event.preventDefault();
  var name = document.getElementById("hero-name").value.trim();
  var heroClass = document.getElementById("hero-class").value;
  var avatar = "🦊";
  if (heroClass === "Coder") {
    avatar = "🧑‍💻";
  } else if (heroClass === "Designer") {
    avatar = "🧝";
  }
  try {
    var result = await questApi.createHero({ name: name, heroClass: heroClass, avatar: avatar });
    questCommon.setCurrentHeroId(result.hero._id);
    window.location.href = "board.html";
  } catch (error) {
    questCommon.showPageMessage("hero-message", error.message, true);
  }
}

// Connect the forms and load the current hero choices.
document.getElementById("hero-form").addEventListener("submit", continueAsHero);
document.getElementById("create-hero-form").addEventListener("submit", createHeroFromForm);
showHeroes();
showStats();
