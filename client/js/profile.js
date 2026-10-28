// Profile page script: loads logged-in hero data and splits quests into posted and accepted lists.

document.addEventListener("DOMContentLoaded", async function() {
  requireAuthPage();
  var hero = getCurrentHero();
  if (!hero) return;

  try {
    var meData = await apiRequest("/auth/me", "GET");
    hero = meData.hero;

    var avatarEl = document.getElementById("profile-avatar");
    var nameEl = document.getElementById("profile-name");
    var classEl = document.getElementById("profile-class");
    if (avatarEl) avatarEl.textContent = hero.avatar;
    if (nameEl) nameEl.textContent = "@" + hero.username;
    if (classEl) {
      classEl.innerHTML = renderClassBadges(hero.heroClasses) + " <span class='ms-2 text-cyan'>" + getRankTitle(hero.level) + "</span>";
    }

    var currentLevelXp = hero.xp % 100;
    var rankTitleEl = document.getElementById("rank-title");
    var levelBadgeEl = document.getElementById("level-badge");
    var xpCaptionEl = document.getElementById("xp-caption");
    var xpPercentEl = document.getElementById("xp-percent");
    var xpProgressEl = document.getElementById("xp-progress");

    if (rankTitleEl) rankTitleEl.textContent = getRankTitle(hero.level);
    if (levelBadgeEl) levelBadgeEl.textContent = "LVL " + hero.level;
    if (xpCaptionEl) xpCaptionEl.textContent = hero.xp + " Total XP (" + currentLevelXp + " / 100 in current lvl)";
    if (xpPercentEl) xpPercentEl.textContent = currentLevelXp + "%";
    if (xpProgressEl) xpProgressEl.style.width = currentLevelXp + "%";

    var quests = await apiRequest("/quests", "GET");
    var myPosted = quests.filter(function(q) { return q.postedBy === hero._id; });
    var myAccepted = quests.filter(function(q) { return q.acceptedBy === hero._id; });

    var completedCount = myAccepted.filter(function(q) { return q.status === "Done"; }).length;
    var completedCountEl = document.getElementById("completed-count");
    if (completedCountEl) completedCountEl.textContent = completedCount;

    var acceptedList = document.getElementById("my-quests");
    if (acceptedList) {
      acceptedList.replaceChildren();
      myAccepted.forEach(function(q) {
        var col = document.createElement("div");
        col.className = "col-md-6";
        var card = document.createElement("article");
        card.className = "history-card panel p-3";
        card.innerHTML =
          '<div class="d-flex justify-content-between mb-2"><span class="difficulty difficulty-' + q.difficulty.toLowerCase() + '">' + q.difficulty + '</span><span class="status-tag status-' + q.status.toLowerCase() + '">' + q.status + '</span></div>' +
          '<h4>' + q.title + '</h4>' +
          '<p class="muted small mb-2">' + q.description + '</p>' +
          '<div class="text-cyan small font-mono">Reward: +' + q.xpReward + ' XP</div>';
        col.appendChild(card);
        acceptedList.appendChild(col);
      });
      if (myAccepted.length === 0) {
        acceptedList.innerHTML = '<div class="col-12"><div class="panel text-center py-4 muted">You haven\'t accepted any quests yet.</div></div>';
      }
    }

    var postedSection = document.getElementById("my-posted-quests-section");
    if (!postedSection) {
      var mainContainer = document.querySelector(".page-wrap");
      if (mainContainer) {
        var section = document.createElement("section");
        section.className = "panel my-quests-panel mt-4";
        section.id = "my-posted-quests-section";
        section.innerHTML = '<div class="feed-heading"><h2>Quests I posted</h2><span class="sort-label">MY BOARD</span></div><div class="row g-3" id="my-posted-list"></div>';
        mainContainer.insertBefore(section, mainContainer.querySelector("footer"));
      }
    }

    var postedList = document.getElementById("my-posted-list");
    if (postedList) {
      postedList.replaceChildren();
      myPosted.forEach(function(q) {
        var col = document.createElement("div");
        col.className = "col-md-6";
        var card = document.createElement("article");
        card.className = "history-card panel p-3";
        card.innerHTML =
          '<div class="d-flex justify-content-between mb-2"><span class="difficulty difficulty-' + q.difficulty.toLowerCase() + '">' + q.difficulty + '</span><span class="status-tag status-' + q.status.toLowerCase() + '">' + q.status + '</span></div>' +
          '<h4>' + q.title + '</h4>' +
          '<p class="muted small mb-2">' + q.description + '</p>' +
          '<div class="text-cyan small font-mono mb-2">Reward: +' + q.xpReward + ' XP</div>' +
          (q.acceptorContact ? '<div class="p-2 rounded bg-dark border border-cyan small mb-2">Accepter Contact: <strong>' + q.acceptorContact + '</strong></div>' : '');

        col.appendChild(card);
        postedList.appendChild(col);
      });
      if (myPosted.length === 0) {
        postedList.innerHTML = '<div class="col-12"><div class="panel text-center py-4 muted">You haven\'t posted any quests yet.</div></div>';
      }
    }

  } catch (err) {
    console.error("Profile load error:", err.message);
  }
});
