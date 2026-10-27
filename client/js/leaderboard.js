// Draw the three highest scoring heroes as podium cards.
function showPodium(heroes) {
  var podium = document.getElementById("podium");
  var places = ["SECOND PLACE", "CHAMPION", "THIRD PLACE"];
  var order = [heroes[1], heroes[0], heroes[2]];
  order.forEach(function (hero, index) {
    if (!hero) return;
    var column = document.createElement("div");
    column.className = "col-md-4";
    var card = document.createElement("div");
    card.className = "panel podium-card " + (index === 1 ? "first" : index === 0 ? "second" : "third");
    var avatar = document.createElement("div");
    avatar.className = "podium-avatar";
    avatar.textContent = hero.avatar;
    var rank = document.createElement("span");
    rank.className = "podium-rank";
    rank.textContent = places[index];
    var name = document.createElement("h3");
    name.textContent = hero.name;
    var title = document.createElement("p");
    title.textContent = questCommon.getRankTitle(hero.level) + " · Level " + hero.level;
    var xp = document.createElement("div");
    xp.className = "podium-xp";
    xp.textContent = hero.xp + " XP";
    card.append(avatar, rank, name, title, xp);
    column.appendChild(card);
    podium.appendChild(column);
  });
}

// Draw the full ranked list below the podium.
function showLeaderboard(heroes) {
  var body = document.getElementById("leaderboard-body");
  heroes.forEach(function (hero, index) {
    var row = document.createElement("tr");
    var rank = document.createElement("td");
    rank.className = "rank-number " + (index === 0 ? "medal-gold" : index === 1 ? "medal-silver" : index === 2 ? "medal-bronze" : "");
    rank.textContent = String(index + 1).padStart(2, "0");
    var nameCell = document.createElement("td");
    var heroName = document.createElement("span");
    heroName.className = "hero-cell";
    var avatar = document.createElement("span");
    avatar.className = "table-avatar";
    avatar.textContent = hero.avatar;
    var name = document.createElement("span");
    name.textContent = hero.name;
    heroName.append(avatar, name);
    nameCell.appendChild(heroName);
    var heroClass = document.createElement("td");
    heroClass.textContent = hero.heroClass;
    var level = document.createElement("td");
    level.textContent = "LVL " + hero.level;
    var xp = document.createElement("td");
    xp.className = "text-end xp-reward";
    xp.textContent = hero.xp.toLocaleString() + " XP";
    row.append(rank, nameCell, heroClass, level, xp);
    body.appendChild(row);
  });
}

// Load the leaderboard data from the Express API.
async function loadLeaderboard() {
  try {
    var heroes = await questApi.getLeaderboard();
    if (heroes.length === 0) {
      document.getElementById("leaderboard-message").textContent = "No heroes yet. Create the first hero to join the rankings!";
      return;
    }
    showPodium(heroes);
    showLeaderboard(heroes);
  } catch (error) {
    document.getElementById("leaderboard-message").textContent = "Could not load leaderboard. Check the server and try again.";
  }
}

// Load the real scores when the page opens.
loadLeaderboard();
