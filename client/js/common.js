// Common UI helpers, navigation rendering, page guards, and level-up modal checker.

// Turn a level number into its game rank title.
function getRankTitle(level) {
  if (level >= 7) return "Legend";
  if (level >= 5) return "Wizard";
  if (level >= 3) return "Apprentice";
  return "Noob";
}

// Show a short message in a page element for loading and error states.
function showPageMessage(elementId, message, isError) {
  var element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.color = isError ? "#ff72c6" : "#6cf6e5";
  }
}

// Render hero classes as small colored badges.
function renderClassBadges(heroClasses) {
  if (!Array.isArray(heroClasses) || heroClasses.length === 0) return "";
  var colors = {
    Coder: "background: rgba(108, 246, 229, 0.15); color: #6cf6e5; border: 1px solid rgba(108, 246, 229, 0.4);",
    Designer: "background: rgba(255, 114, 198, 0.15); color: #ff72c6; border: 1px solid rgba(255, 114, 198, 0.4);",
    Thinker: "background: rgba(166, 139, 255, 0.15); color: #a68bff; border: 1px solid rgba(166, 139, 255, 0.4);"
  };
  return heroClasses.map(function(cls) {
    var style = colors[cls] || "background: #252d40; color: #f3f5ff;";
    return '<span class="badge me-1" style="' + style + ' font-family: var(--font-mono); font-size: 10px; padding: 3px 8px;">' + cls + '</span>';
  }).join("");
}

// Page guard: redirect to login.html if not logged in.
function requireAuthPage() {
  if (!isLoggedIn()) {
    window.location.href = "login.html";
  }
}

// Log out current user
async function logoutUser() {
  try {
    await apiRequest("/auth/logout", "POST");
  } catch (e) {
    console.error("Logout API error:", e.message);
  }
  clearSession();
  window.location.href = "login.html";
}

// Render standard site navigation across pages with user profile dropdown/avatar and logout.
async function renderNavbar() {
  var navLinksContainer = document.querySelector(".navbar-nav.ms-auto");
  if (!navLinksContainer) return;

  var loggedIn = isLoggedIn();
  var currentPath = window.location.pathname;

  if (!loggedIn) {
    navLinksContainer.innerHTML =
      '<a class="nav-link ' + (currentPath.endsWith("index.html") || currentPath.endsWith("/") ? "active" : "") + '" href="index.html">Home</a>' +
      '<a class="nav-link ' + (currentPath.endsWith("leaderboard.html") ? "active" : "") + '" href="leaderboard.html">Leaderboard</a>' +
      '<a class="nav-link btn btn-neon text-dark px-3 ms-2 py-1" href="login.html">Login / Sign up</a>';
    return;
  }

  var hero = getCurrentHero();
  var avatar = hero && hero.avatar ? hero.avatar : "🧙‍♂️";
  var username = hero && hero.username ? hero.username : "Hero";

  navLinksContainer.innerHTML =
    '<a class="nav-link ' + (currentPath.endsWith("index.html") || currentPath.endsWith("/") ? "active" : "") + '" href="index.html">Home</a>' +
    '<a class="nav-link ' + (currentPath.endsWith("board.html") ? "active" : "") + '" href="board.html">Quest board</a>' +
    '<a class="nav-link ' + (currentPath.endsWith("leaderboard.html") ? "active" : "") + '" href="leaderboard.html">Leaderboard</a>' +
    '<a class="nav-link ' + (currentPath.endsWith("profile.html") ? "active" : "") + '" href="profile.html">My profile</a>' +
    '<div class="nav-item dropdown ms-lg-3 d-flex align-items-center gap-2 mt-2 mt-lg-0">' +
      '<a class="d-flex align-items-center gap-2 text-decoration-none text-light dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">' +
        '<span style="font-size: 18px;">' + avatar + '</span>' +
        '<span style="font-family: var(--font-mono); font-size: 13px; color: var(--cyan);">@' + username + '</span>' +
      '</a>' +
      '<ul class="dropdown-menu dropdown-menu-dark dropdown-menu-end" style="background: var(--panel); border: 1px solid var(--line);">' +
        '<li><a class="dropdown-item" href="profile.html">My Profile & Quests</a></li>' +
        '<li><hr class="dropdown-divider" style="border-color: var(--line);"></li>' +
        '<li><button class="dropdown-item text-danger" id="nav-logout-btn">Log out</button></li>' +
      '</ul>' +
    '</div>';

  var logoutBtn = document.getElementById("nav-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function(e) {
      e.preventDefault();
      logoutUser();
    });
  }
}

// Check for level ups by fetching fresh hero data from /auth/me and comparing with lastSeenLevel.
async function checkLevelUp() {
  if (!isLoggedIn()) return;
  try {
    var data = await apiRequest("/auth/me", "GET");
    var freshHero = data.hero;
    if (!freshHero) return;

    var oldHero = getCurrentHero();
    if (oldHero) {
      oldHero.xp = freshHero.xp;
      oldHero.level = freshHero.level;
      localStorage.setItem("questboard_hero", JSON.stringify(oldHero));
    }

    var lastSeenLevelStr = localStorage.getItem("questboard_last_seen_level");
    var lastSeenLevel = lastSeenLevelStr ? parseInt(lastSeenLevelStr, 10) : freshHero.level;

    if (!lastSeenLevelStr) {
      localStorage.setItem("questboard_last_seen_level", freshHero.level.toString());
      return;
    }

    if (freshHero.level > lastSeenLevel) {
      localStorage.setItem("questboard_last_seen_level", freshHero.level.toString());

      var levelNumberEl = document.getElementById("level-up-number");
      var levelRankEl = document.getElementById("level-up-rank");
      if (levelNumberEl) levelNumberEl.textContent = freshHero.level;
      if (levelRankEl) levelRankEl.textContent = getRankTitle(freshHero.level);

      var levelUpModalEl = document.getElementById("levelUpModal");
      if (levelUpModalEl) {
        var modal = new bootstrap.Modal(levelUpModalEl);
        modal.show();
      }
    }
  } catch (e) {
    console.error("Level check error:", e.message);
  }
}

// Run common tasks on DOM load
document.addEventListener("DOMContentLoaded", function() {
  renderNavbar();
  if (isLoggedIn() && !window.location.pathname.endsWith("login.html")) {
    checkLevelUp();
  }
});
