// Keep the starter heroes in the browser so every page can share them.
var sampleHeroes = [
  { id: "hero-1", name: "NovaByte", heroClass: "Coder", avatar: "🧑‍💻", xp: 260, level: 3 },
  { id: "hero-2", name: "MiraPixel", heroClass: "Designer", avatar: "🧝", xp: 180, level: 2 },
  { id: "hero-3", name: "TheoryFox", heroClass: "Thinker", avatar: "🦊", xp: 90, level: 1 }
];

// Load the saved heroes or start with the sample heroes for this demo.
function getHeroes() {
  var savedHeroes = localStorage.getItem("questboardHeroes");
  if (savedHeroes) {
    return JSON.parse(savedHeroes);
  }
  localStorage.setItem("questboardHeroes", JSON.stringify(sampleHeroes));
  return sampleHeroes;
}

// Add each available hero to the selection menu.
function showHeroes() {
  var select = document.getElementById("hero-select");
  var heroes = getHeroes();
  heroes.forEach(function (hero) {
    var option = document.createElement("option");
    option.value = hero.id;
    option.textContent = hero.avatar + "  " + hero.name + " · " + hero.heroClass;
    select.appendChild(option);
  });
}

// Remember the chosen hero and open the quest board.
function continueAsHero(event) {
  event.preventDefault();
  var heroId = document.getElementById("hero-select").value;
  var message = document.getElementById("hero-message");
  if (!heroId) {
    message.textContent = "Choose a hero first, adventurer.";
    return;
  }
  localStorage.setItem("questboardCurrentHero", heroId);
  window.location.href = "board.html";
}

// Create a simple hero and save it for later visits.
function createHero(event) {
  event.preventDefault();
  var nameInput = document.getElementById("hero-name");
  var heroClass = document.getElementById("hero-class").value;
  var heroes = getHeroes();
  var avatar = "🦊";
  if (heroClass === "Coder") {
    avatar = "🧑‍💻";
  } else if (heroClass === "Designer") {
    avatar = "🧝";
  }
  var hero = {
    id: "hero-" + Date.now(),
    name: nameInput.value.trim(),
    heroClass: heroClass,
    avatar: avatar,
    xp: 0,
    level: 1
  };
  heroes.push(hero);
  localStorage.setItem("questboardHeroes", JSON.stringify(heroes));
  localStorage.setItem("questboardCurrentHero", hero.id);
  window.location.href = "board.html";
}

// Connect the page forms and display the starting hero list.
showHeroes();
document.getElementById("hero-form").addEventListener("submit", continueAsHero);
document.getElementById("create-hero-form").addEventListener("submit", createHero);
