// Leaderboard page script: renders podium and ranked heroes table with sanitization and badge support.

document.addEventListener("DOMContentLoaded", async function() {
  requireAuthPage();

  try {
    var heroes = await apiRequest("/leaderboard", "GET");
    if (!Array.isArray(heroes) || heroes.length === 0) {
      var msgEl = document.getElementById("leaderboard-message");
      if (msgEl) msgEl.textContent = "No heroes yet. Register the first hero to join the rankings!";
      return;
    }

    showPodium(heroes);
    showLeaderboard(heroes);
  } catch (err) {
    var msgEl = document.getElementById("leaderboard-message");
    if (msgEl) msgEl.textContent = "Could not load leaderboard: " + err.message;
  }
});

function showPodium(heroes) {
  var podium = document.getElementById("podium");
  if (!podium) return;
  podium.replaceChildren();

  var order = [heroes[1], heroes[0], heroes[2]];
  var places = ["SECOND PLACE", "CHAMPION", "THIRD PLACE"];

  order.forEach(function(hero, index) {
    if (!hero) return;
    var col = document.createElement("div");
    col.className = "col-md-4";
    var card = document.createElement("div");
    card.className = "panel podium-card " + (index === 1 ? "first" : index === 0 ? "second" : "third");

    card.innerHTML =
      '<div class="podium-avatar">' + hero.avatar + '</div>' +
      '<span class="podium-rank">' + places[index] + '</span>' +
      '<h3>@' + hero.username + '</h3>' +
      '<p class="mb-2">' + renderClassBadges(hero.heroClasses) + '</p>' +
      '<p class="text-muted small">' + getRankTitle(hero.level) + ' · Level ' + hero.level + '</p>' +
      '<div class="podium-xp">' + hero.xp + ' XP</div>';

    col.appendChild(card);
    podium.appendChild(col);
  });
}

function showLeaderboard(heroes) {
  var body = document.getElementById("leaderboard-body");
  if (!body) return;
  body.replaceChildren();

  heroes.forEach(function(hero, index) {
    var row = document.createElement("tr");

    var rankTd = document.createElement("td");
    rankTd.className = "rank-number " + (index === 0 ? "medal-gold" : index === 1 ? "medal-silver" : index === 2 ? "medal-bronze" : "");
    rankTd.textContent = String(index + 1).padStart(2, "0");

    var nameTd = document.createElement("td");
    nameTd.innerHTML = '<span class="hero-cell"><span class="table-avatar">' + hero.avatar + '</span><span>@' + hero.username + '</span></span>';

    var classTd = document.createElement("td");
    classTd.innerHTML = renderClassBadges(hero.heroClasses);

    var levelTd = document.createElement("td");
    levelTd.textContent = "LVL " + hero.level;

    var xpTd = document.createElement("td");
    xpTd.className = "text-end xp-reward text-cyan font-mono";
    xpTd.textContent = hero.xp.toLocaleString() + " XP";

    row.append(rankTd, nameTd, classTd, levelTd, xpTd);
    body.appendChild(row);
  });
}
