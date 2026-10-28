// Landing page script for updating stats and quick action buttons.

async function showStats() {
  try {
    var quests = await apiRequest("/quests", "GET");
    var heroes = await apiRequest("/heroes", "GET");
    var openQuests = quests.filter(function (quest) { return quest.status === "Open"; });
    document.getElementById("open-quest-count").textContent = openQuests.length;
    document.getElementById("hero-count").textContent = heroes.length;
  } catch (error) {
    document.getElementById("open-quest-count").textContent = "—";
    document.getElementById("hero-count").textContent = "—";
  }
}

document.addEventListener("DOMContentLoaded", function() {
  showStats();
  var landingActions = document.getElementById("landing-actions");
  if (landingActions && isLoggedIn()) {
    landingActions.innerHTML =
      '<a class="btn btn-neon" href="board.html">Go to board ↗</a>' +
      '<a class="subtle-link" href="profile.html">View profile <span>→</span></a>';
  }
});
