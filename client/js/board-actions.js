// Remember which quest is being edited in the post form.
var editingQuestId = null;

// Prepare the form for a brand new quest.
function startNewQuest() {
  editingQuestId = null;
  document.getElementById("quest-form").reset();
  document.getElementById("questModalLabel").textContent = "Post a quest";
  document.getElementById("quest-submit").textContent = "Publish quest ↗";
}

// Put an owned quest into the form and open the edit modal.
function editQuest(quest) {
  editingQuestId = quest._id;
  document.getElementById("quest-title").value = quest.title;
  document.getElementById("quest-description").value = quest.description;
  document.getElementById("quest-difficulty").value = quest.difficulty;
  document.getElementById("questModalLabel").textContent = "Edit quest";
  document.getElementById("quest-submit").textContent = "Save changes";
  bootstrap.Modal.getOrCreateInstance(document.getElementById("questModal")).show();
}

// Save a new quest or edit the selected quest through the API.
async function saveQuest(event) {
  event.preventDefault();
  var title = document.getElementById("quest-title").value.trim();
  var description = document.getElementById("quest-description").value.trim();
  var difficulty = document.getElementById("quest-difficulty").value;
  try {
    if (editingQuestId) {
      await questApi.updateQuest(editingQuestId, { action: "edit", postedBy: currentHeroId, title: title, description: description, difficulty: difficulty });
    } else {
      if (!currentHeroId) {
        questCommon.showPageMessage("board-message", "Choose a hero on the home page before posting.", true);
        return;
      }
      await questApi.createQuest({ title: title, description: description, difficulty: difficulty, postedBy: currentHeroId });
    }
    editingQuestId = null;
    document.getElementById("quest-form").reset();
    bootstrap.Modal.getInstance(document.getElementById("questModal")).hide();
    await loadBoard();
  } catch (error) {
    questCommon.showPageMessage("board-message", error.message, true);
  }
}

// Accept a quest through the API and refresh the board.
async function acceptQuest(questId) {
  try {
    await questApi.updateQuest(questId, { action: "accept", acceptedBy: currentHeroId });
    await loadBoard();
  } catch (error) {
    questCommon.showPageMessage("board-message", error.message, true);
  }
}

// Ask before removing an owned quest, then refresh the board.
async function deleteQuest(questId) {
  if (!window.confirm("Delete this quest?")) {
    return;
  }
  try {
    await questApi.deleteQuest(questId, currentHeroId);
    await loadBoard();
  } catch (error) {
    questCommon.showPageMessage("board-message", error.message, true);
  }
}

// Connect the post form and the new-quest button to their actions.
document.getElementById("quest-form").addEventListener("submit", saveQuest);
document.getElementById("new-quest-button").addEventListener("click", startNewQuest);
