// Frontend Board script: fully wired up with auth, contact modals, and status review actions.

var allQuests = [];
var heroesById = {};
var currentHero = null;
var randomQuestId = null;
var activeQuestToAcceptId = null;

document.addEventListener("DOMContentLoaded", async function() {
  requireAuthPage();
  currentHero = getCurrentHero();

  ensureModalsExist();

  document.getElementById("search-input").addEventListener("input", renderQuests);
  document.getElementById("difficulty-filter").addEventListener("change", renderQuests);
  document.getElementById("status-filter").addEventListener("change", renderQuests);
  document.getElementById("random-button").addEventListener("click", chooseRandomQuest);

  var questForm = document.getElementById("quest-form");
  if (questForm) {
    questForm.addEventListener("submit", handlePostOrEditQuest);
  }

  var acceptContactForm = document.getElementById("accept-contact-form");
  if (acceptContactForm) {
    acceptContactForm.addEventListener("submit", handleConfirmAcceptQuest);
  }

  await loadBoard();
});

// Ensure required modals exist in the DOM
function ensureModalsExist() {
  var modalContainer = document.getElementById("dynamic-modals");
  if (!modalContainer) {
    modalContainer = document.createElement("div");
    modalContainer.id = "dynamic-modals";
    document.body.appendChild(modalContainer);
  }

  modalContainer.innerHTML = `
    <!-- Accept Contact Modal -->
    <div class="modal fade" id="acceptModal" tabindex="-1" aria-labelledby="acceptModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content game-modal">
          <div class="modal-header">
            <div><p class="eyebrow">ACCEPT QUEST</p><h2 class="modal-title" id="acceptModalLabel">Provide contact info</h2></div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <form id="accept-contact-form">
            <div class="modal-body">
              <label class="form-label" for="accept-contact-input">How can the poster reach you?</label>
              <input class="form-control game-input mb-2" id="accept-contact-input" required placeholder="e.g. Phone, Email, Discord, or Instagram">
              <p class="muted small mb-0">Your contact info will only be visible to the quest poster.</p>
              <p class="form-message mt-2" id="accept-modal-message"></p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-quiet" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-neon">Confirm & Accept ↗</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

// Load quests and heroes from API
async function loadBoard() {
  try {
    var questsRes = await apiRequest("/quests", "GET");
    var heroesRes = await apiRequest("/heroes", "GET");
    allQuests = questsRes;
    heroesById = {};
    heroesRes.forEach(function(h) { heroesById[h._id] = h; });
    renderQuests();
    showPageMessage("board-message", "", false);
  } catch (err) {
    showPageMessage("board-message", "Could not load quests: " + err.message, true);
  }
}

// Build a quest card
function makeQuestCard(quest) {
  var poster = heroesById[quest.postedBy] || { username: "Hero", avatar: "🧙‍♂️", heroClasses: [] };
  var accepter = quest.acceptedBy ? (heroesById[quest.acceptedBy] || { username: "Accepter", avatar: "🛡️" }) : null;

  var card = document.createElement("article");
  card.className = "panel quest-card";
  card.dataset.questId = quest._id;
  if (quest._id === randomQuestId) {
    card.classList.add("random-quest-highlight");
  }

  var top = document.createElement("div");
  top.className = "d-flex justify-content-between align-items-center mb-2";

  var diffSpan = document.createElement("span");
  diffSpan.className = "difficulty difficulty-" + quest.difficulty.toLowerCase();
  diffSpan.textContent = quest.difficulty;

  var statusSpan = document.createElement("span");
  statusSpan.className = "status-tag status-" + quest.status.toLowerCase();
  statusSpan.textContent = quest.status;
  top.append(diffSpan, statusSpan);

  var title = document.createElement("h3");
  title.textContent = quest.title;

  var desc = document.createElement("p");
  desc.textContent = quest.description;

  var meta = document.createElement("div");
  meta.className = "quest-meta d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-secondary";

  var authorDiv = document.createElement("div");
  authorDiv.className = "d-flex align-items-center gap-2";
  authorDiv.innerHTML = '<span style="font-size: 18px;">' + poster.avatar + '</span><div><div style="font-size: 13px; font-weight: 600;">@' + poster.username + '</div><div>' + renderClassBadges(poster.heroClasses) + '</div></div>';

  var rewardSpan = document.createElement("span");
  rewardSpan.className = "xp-reward text-cyan";
  rewardSpan.style.fontFamily = "var(--font-mono)";
  rewardSpan.style.fontWeight = "600";
  rewardSpan.textContent = "+" + quest.xpReward + " XP";

  meta.append(authorDiv, rewardSpan);

  card.append(top, title, desc, meta);

  if (quest.acceptorContact && (quest.postedBy === currentHero._id || quest.acceptedBy === currentHero._id)) {
    var contactDiv = document.createElement("div");
    contactDiv.className = "mt-3 p-2 rounded" + (quest.postedBy === currentHero._id ? " bg-dark border border-cyan" : " bg-dark");
    contactDiv.style.fontSize = "12px";
    contactDiv.innerHTML = '<span class="text-cyan">Contact Info:</span> <strong>' + quest.acceptorContact + '</strong>';
    card.appendChild(contactDiv);
  }

  var actionsDiv = document.createElement("div");
  actionsDiv.className = "d-flex flex-wrap gap-2 mt-3";

  var isPoster = quest.postedBy === currentHero._id;
  var isAccepter = quest.acceptedBy === currentHero._id;

  if (quest.status === "Open") {
    if (isPoster) {
      var editBtn = document.createElement("button");
      editBtn.className = "btn btn-outline-neon btn-sm";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", function() { openEditModal(quest); });

      var delBtn = document.createElement("button");
      delBtn.className = "btn btn-outline-danger btn-sm";
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", function() { deleteQuest(quest._id); });

      actionsDiv.append(editBtn, delBtn);
    } else {
      var acceptBtn = document.createElement("button");
      acceptBtn.className = "btn btn-neon btn-sm";
      acceptBtn.textContent = "Accept quest →";
      acceptBtn.addEventListener("click", function() { promptAcceptQuest(quest._id); });
      actionsDiv.appendChild(acceptBtn);
    }
  } else if (quest.status === "Active") {
    if (isAccepter) {
      var submitBtn = document.createElement("button");
      submitBtn.className = "btn btn-neon btn-sm";
      submitBtn.textContent = "Submit for review";
      submitBtn.addEventListener("click", function() { submitQuest(quest._id); });

      var giveupBtn = document.createElement("button");
      giveupBtn.className = "btn btn-outline-danger btn-sm";
      giveupBtn.textContent = "Give up";
      giveupBtn.addEventListener("click", function() { giveupQuest(quest._id); });

      actionsDiv.append(submitBtn, giveupBtn);
    } else if (isPoster) {
      var acceptedInfo = document.createElement("span");
      acceptedInfo.className = "muted small";
      acceptedInfo.textContent = "Accepted by @" + (accepter ? accepter.username : "hero");
      actionsDiv.appendChild(acceptedInfo);
    } else {
      var activeSpan = document.createElement("span");
      activeSpan.className = "muted small";
      activeSpan.textContent = "In progress by another hero";
      actionsDiv.appendChild(activeSpan);
    }
  } else if (quest.status === "Pending") {
    if (isPoster) {
      var approveBtn = document.createElement("button");
      approveBtn.className = "btn btn-neon btn-sm";
      approveBtn.textContent = "Approve (+" + quest.xpReward + " XP)";
      approveBtn.addEventListener("click", function() { approveQuest(quest._id); });

      var rejectBtn = document.createElement("button");
      rejectBtn.className = "btn btn-outline-danger btn-sm";
      rejectBtn.textContent = "Reject";
      rejectBtn.addEventListener("click", function() { rejectQuest(quest._id); });

      actionsDiv.append(approveBtn, rejectBtn);
    } else if (isAccepter) {
      var waitingSpan = document.createElement("span");
      waitingSpan.className = "text-cyan small";
      waitingSpan.textContent = "Waiting for poster to approve review...";
      actionsDiv.appendChild(waitingSpan);
    } else {
      var pendingSpan = document.createElement("span");
      pendingSpan.className = "muted small";
      pendingSpan.textContent = "Pending poster review";
      actionsDiv.appendChild(pendingSpan);
    }
  } else if (quest.status === "Done") {
    var doneSpan = document.createElement("span");
    doneSpan.className = "badge bg-success text-dark font-mono";
    doneSpan.textContent = "Completed & Rewarded";
    actionsDiv.appendChild(doneSpan);
  }

  if (actionsDiv.children.length > 0) {
    card.appendChild(actionsDiv);
  }

  return card;
}

// Filter and render quests
function renderQuests() {
  var search = document.getElementById("search-input").value.toLowerCase();
  var difficulty = document.getElementById("difficulty-filter").value;
  var status = document.getElementById("status-filter").value;

  var visibleQuests = allQuests.filter(function(quest) {
    var matchesSearch = quest.title.toLowerCase().includes(search) || quest.description.toLowerCase().includes(search);
    var matchesDiff = difficulty === "All" || quest.difficulty === difficulty;
    var matchesStatus = status === "All" || quest.status === status;
    return matchesSearch && matchesDiff && matchesStatus;
  });

  var list = document.getElementById("quest-list");
  list.replaceChildren();

  visibleQuests.forEach(function(quest) {
    var col = document.createElement("div");
    col.className = "col-md-6 col-xl-4";
    col.appendChild(makeQuestCard(quest));
    list.appendChild(col);
  });

  document.getElementById("quest-count").textContent = visibleQuests.length;

  if (visibleQuests.length === 0) {
    var emptyCol = document.createElement("div");
    emptyCol.className = "col-12";
    var emptyPanel = document.createElement("div");
    emptyPanel.className = "panel text-center py-5 muted";
    emptyPanel.textContent = allQuests.length === 0 ? "No quests yet — be the first to post one!" : "No quests match your filter criteria.";
    emptyCol.appendChild(emptyPanel);
    list.appendChild(emptyCol);
  }
}

// Random quest picker
function chooseRandomQuest() {
  var openQuests = allQuests.filter(function(q) { return q.status === "Open"; });
  if (openQuests.length === 0) {
    showPageMessage("board-message", "No open quests available right now.", true);
    return;
  }
  var chosen = openQuests[Math.floor(Math.random() * openQuests.length)];
  randomQuestId = chosen._id;
  document.getElementById("search-input").value = chosen.title;
  document.getElementById("difficulty-filter").value = "All";
  document.getElementById("status-filter").value = "Open";
  renderQuests();
  document.getElementById("quest-list").scrollIntoView({ behavior: "smooth" });
}

var editingQuestId = null;
function openEditModal(quest) {
  editingQuestId = quest._id;
  document.getElementById("questModalLabel").textContent = "Edit quest";
  document.getElementById("quest-title").value = quest.title;
  document.getElementById("quest-description").value = quest.description;
  document.getElementById("quest-difficulty").value = quest.difficulty;
  document.getElementById("quest-submit").textContent = "Save changes ↗";
  var modal = new bootstrap.Modal(document.getElementById("questModal"));
  modal.show();
}

var newQuestBtn = document.getElementById("new-quest-button");
if (newQuestBtn) {
  newQuestBtn.addEventListener("click", function() {
    editingQuestId = null;
    document.getElementById("questModalLabel").textContent = "Post a quest";
    document.getElementById("quest-title").value = "";
    document.getElementById("quest-description").value = "";
    document.getElementById("quest-difficulty").value = "Medium";
    document.getElementById("quest-submit").textContent = "Publish quest ↗";
  });
}

async function handlePostOrEditQuest(e) {
  e.preventDefault();
  var title = document.getElementById("quest-title").value.trim();
  var description = document.getElementById("quest-description").value.trim();
  var difficulty = document.getElementById("quest-difficulty").value;

  try {
    if (editingQuestId) {
      await apiRequest("/quests/" + editingQuestId, "PUT", {
        action: "edit",
        title: title,
        description: description,
        difficulty: difficulty
      });
    } else {
      await apiRequest("/quests", "POST", {
        title: title,
        description: description,
        difficulty: difficulty
      });
    }

    var modalEl = document.getElementById("questModal");
    var modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    await loadBoard();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function deleteQuest(questId) {
  if (!confirm("Are you sure you want to delete this open quest?")) return;
  try {
    await apiRequest("/quests/" + questId, "DELETE");
    await loadBoard();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

function promptAcceptQuest(questId) {
  activeQuestToAcceptId = questId;
  document.getElementById("accept-contact-input").value = "";
  var msgEl = document.getElementById("accept-modal-message");
  if (msgEl) msgEl.textContent = "";
  var modal = new bootstrap.Modal(document.getElementById("acceptModal"));
  modal.show();
}

async function handleConfirmAcceptQuest(e) {
  e.preventDefault();
  var contact = document.getElementById("accept-contact-input").value.trim();
  if (contact.length < 3) {
    showPageMessage("accept-modal-message", "Contact info must be at least 3 characters.", true);
    return;
  }

  try {
    await apiRequest("/quests/" + activeQuestToAcceptId + "/accept", "PUT", { contact: contact });
    var modalEl = document.getElementById("acceptModal");
    var modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    await loadBoard();
  } catch (err) {
    showPageMessage("accept-modal-message", err.message, true);
  }
}

async function submitQuest(questId) {
  try {
    await apiRequest("/quests/" + questId + "/submit", "PUT");
    await loadBoard();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function giveupQuest(questId) {
  if (!confirm("Are you sure you want to give up this quest? It will become open for other heroes.")) return;
  try {
    await apiRequest("/quests/" + questId + "/giveup", "PUT");
    await loadBoard();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function approveQuest(questId) {
  try {
    await apiRequest("/quests/" + questId + "/approve", "PUT");
    await loadBoard();
    checkLevelUp();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function rejectQuest(questId) {
  try {
    await apiRequest("/quests/" + questId + "/reject", "PUT");
    await loadBoard();
  } catch (err) {
    alert("Error: " + err.message);
  }
}
