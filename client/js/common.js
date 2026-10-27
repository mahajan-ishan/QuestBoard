// Use one browser storage key for the current hero on every page.
var CURRENT_HERO_KEY = "questboardCurrentHero";

// Read the selected MongoDB hero ID from localStorage.
function getCurrentHeroId() {
  return localStorage.getItem(CURRENT_HERO_KEY);
}

// Save the selected hero ID so it stays selected across pages.
function setCurrentHeroId(id) {
  localStorage.setItem(CURRENT_HERO_KEY, id);
}

// Clear the selected hero when the player switches characters.
function clearCurrentHeroId() {
  localStorage.removeItem(CURRENT_HERO_KEY);
}

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

// Make the shared browser helpers available to page scripts.
window.questCommon = {
  getCurrentHeroId: getCurrentHeroId,
  setCurrentHeroId: setCurrentHeroId,
  clearCurrentHeroId: clearCurrentHeroId,
  getRankTitle: getRankTitle,
  showPageMessage: showPageMessage
};
