// Set up quest routes with authentication and ownership checks.
var express = require("express");
var ObjectId = require("mongodb").ObjectId;
var getDatabase = require("../db").getDatabase;
var requireLogin = require("../middleware/auth").requireLogin;
var router = express.Router();
var validDifficulties = ["Easy", "Medium", "Hard", "Legendary"];
var validStatuses = ["Open", "Active", "Pending", "Done"];
var rewards = { Easy: 20, Medium: 50, Hard: 100, Legendary: 200 };

// Check that a value is a non-empty string.
function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// Find a quest by its MongoDB ID.
async function findQuest(id) {
  var quests = getDatabase().collection("quests");
  return await quests.findOne({ _id: new ObjectId(id) });
}

// Remove or mask acceptorContact if the requesting user is neither the poster nor the acceptedBy hero.
function sanitizeQuestForUser(quest, currentHeroId) {
  var sanitized = Object.assign({}, quest);
  var isPoster = quest.postedBy && quest.postedBy.toString() === currentHeroId.toString();
  var isAccepter = quest.acceptedBy && quest.acceptedBy.toString() === currentHeroId.toString();

  if (!isPoster && !isAccepter) {
    delete sanitized.acceptorContact;
  }
  return sanitized;
}

// List quests and apply optional difficulty and status filters.
async function getQuests(request, response) {
  try {
    var difficulty = request.query.difficulty;
    var status = request.query.status;
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return response.status(400).json({ message: "Invalid difficulty filter." });
    }
    if (status && !validStatuses.includes(status)) {
      return response.status(400).json({ message: "Invalid status filter." });
    }
    var filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    var quests = getDatabase().collection("quests");
    var results = await quests.find(filter).sort({ createdAt: -1 }).toArray();

    var currentHeroId = request.hero._id;
    var sanitizedResults = results.map(function(q) {
      return sanitizeQuestForUser(q, currentHeroId);
    });

    return response.status(200).json(sanitizedResults);
  } catch (error) {
    console.error("Could not list quests:", error.message);
    return response.status(500).json({ message: "Could not list quests." });
  }
}

// Validate and save a new open quest with its difficulty-based reward using req.hero._id.
async function createQuest(request, response) {
  try {
    var body = request.body || {};
    if (!hasText(body.title) || !hasText(body.description) ||
        !validDifficulties.includes(body.difficulty)) {
      return response.status(400).json({ message: "Enter a title, description, and difficulty." });
    }
    var quest = {
      title: body.title.trim(),
      description: body.description.trim(),
      difficulty: body.difficulty,
      xpReward: rewards[body.difficulty],
      status: "Open",
      postedBy: request.hero._id,
      acceptedBy: null,
      acceptorContact: null,
      createdAt: new Date()
    };
    var quests = getDatabase().collection("quests");
    var result = await quests.insertOne(quest);
    quest._id = result.insertedId;
    return response.status(201).json({ message: "Quest created", quest: quest });
  } catch (error) {
    console.error("Could not create quest:", error.message);
    return response.status(500).json({ message: "Could not create quest." });
  }
}

// Edit a posted quest (only when Open and by poster).
async function editQuest(request, response) {
  try {
    var id = request.params.id;
    var body = request.body || {};
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid quest ID." });
    }
    var quest = await findQuest(id);
    if (!quest) {
      return response.status(404).json({ message: "Quest not found." });
    }

    if (quest.postedBy.toString() !== request.hero._id.toString()) {
      return response.status(403).json({ message: "Only the quest poster can edit it." });
    }
    if (quest.status !== "Open") {
      return response.status(400).json({ message: "Only open quests can be edited." });
    }
    if (!hasText(body.title) || !hasText(body.description) || !validDifficulties.includes(body.difficulty)) {
      return response.status(400).json({ message: "Enter a title, description, and valid difficulty." });
    }

    quest.title = body.title.trim();
    quest.description = body.description.trim();
    quest.difficulty = body.difficulty;
    quest.xpReward = rewards[body.difficulty];

    var quests = getDatabase().collection("quests");
    await quests.updateOne(
      { _id: quest._id },
      { $set: { title: quest.title, description: quest.description, difficulty: quest.difficulty, xpReward: quest.xpReward } }
    );
    return response.status(200).json({ message: "Quest updated", quest: quest });
  } catch (error) {
    console.error("Could not edit quest:", error.message);
    return response.status(500).json({ message: "Could not edit quest." });
  }
}

// Accept an open quest with contact info.
async function acceptQuest(request, response) {
  try {
    var id = request.params.id;
    var body = request.body || {};
    var contact = body.contact ? body.contact.trim() : "";

    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid quest ID." });
    }
    if (contact.length < 3) {
      return response.status(400).json({ message: "Contact info must be at least 3 characters." });
    }

    var quest = await findQuest(id);
    if (!quest) {
      return response.status(404).json({ message: "Quest not found." });
    }
    if (quest.status !== "Open") {
      return response.status(400).json({ message: "Only open quests can be accepted." });
    }
    if (quest.postedBy.toString() === request.hero._id.toString()) {
      return response.status(400).json({ message: "You cannot accept your own quest." });
    }

    quest.status = "Active";
    quest.acceptedBy = request.hero._id;
    quest.acceptorContact = contact;

    var quests = getDatabase().collection("quests");
    await quests.updateOne(
      { _id: quest._id },
      { $set: { status: quest.status, acceptedBy: quest.acceptedBy, acceptorContact: quest.acceptorContact } }
    );

    return response.status(200).json({ message: "Quest accepted", quest: sanitizeQuestForUser(quest, request.hero._id) });
  } catch (error) {
    console.error("Could not accept quest:", error.message);
    return response.status(500).json({ message: "Could not accept quest." });
  }
}

// Submit an active quest for review (by accepter).
async function submitQuest(request, response) {
  try {
    var id = request.params.id;
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid quest ID." });
    }

    var quest = await findQuest(id);
    if (!quest) {
      return response.status(404).json({ message: "Quest not found." });
    }
    if (quest.status !== "Active" || !quest.acceptedBy || quest.acceptedBy.toString() !== request.hero._id.toString()) {
      return response.status(403).json({ message: "Only the hero who accepted this active quest can submit it for review." });
    }

    quest.status = "Pending";
    var quests = getDatabase().collection("quests");
    await quests.updateOne({ _id: quest._id }, { $set: { status: quest.status } });

    return response.status(200).json({ message: "Quest submitted for review", quest: sanitizeQuestForUser(quest, request.hero._id) });
  } catch (error) {
    console.error("Could not submit quest:", error.message);
    return response.status(500).json({ message: "Could not submit quest." });
  }
}

// Approve a pending quest (by poster) - awards XP to accepter and recalculates level.
async function approveQuest(request, response) {
  try {
    var id = request.params.id;
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid quest ID." });
    }

    var quest = await findQuest(id);
    if (!quest) {
      return response.status(404).json({ message: "Quest not found." });
    }
    if (quest.postedBy.toString() !== request.hero._id.toString()) {
      return response.status(403).json({ message: "Only the quest poster can approve it." });
    }
    if (quest.status !== "Pending") {
      return response.status(400).json({ message: "Only pending quests can be approved." });
    }

    // Award XP to accepter
    var heroes = getDatabase().collection("heroes");
    var accepter = await heroes.findOne({ _id: new ObjectId(quest.acceptedBy) });
    if (!accepter) {
      return response.status(404).json({ message: "Accepter hero not found." });
    }

    accepter.xp += quest.xpReward;
    accepter.level = Math.floor(accepter.xp / 100) + 1;
    await heroes.updateOne(
      { _id: accepter._id },
      { $set: { xp: accepter.xp, level: accepter.level } }
    );

    quest.status = "Done";
    var quests = getDatabase().collection("quests");
    await quests.updateOne({ _id: quest._id }, { $set: { status: quest.status } });

    return response.status(200).json({ message: "Quest approved and XP awarded", quest: sanitizeQuestForUser(quest, request.hero._id) });
  } catch (error) {
    console.error("Could not approve quest:", error.message);
    return response.status(500).json({ message: "Could not approve quest." });
  }
}

// Reject a pending quest (by poster) - returns to Active.
async function rejectQuest(request, response) {
  try {
    var id = request.params.id;
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid quest ID." });
    }

    var quest = await findQuest(id);
    if (!quest) {
      return response.status(404).json({ message: "Quest not found." });
    }
    if (quest.postedBy.toString() !== request.hero._id.toString()) {
      return response.status(403).json({ message: "Only the quest poster can reject it." });
    }
    if (quest.status !== "Pending") {
      return response.status(400).json({ message: "Only pending quests can be rejected." });
    }

    quest.status = "Active";
    var quests = getDatabase().collection("quests");
    await quests.updateOne({ _id: quest._id }, { $set: { status: quest.status } });

    return response.status(200).json({ message: "Quest rejected, returned to active", quest: sanitizeQuestForUser(quest, request.hero._id) });
  } catch (error) {
    console.error("Could not reject quest:", error.message);
    return response.status(500).json({ message: "Could not reject quest." });
  }
}

// Give up an active quest (by accepter) - returns to Open.
async function giveupQuest(request, response) {
  try {
    var id = request.params.id;
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid quest ID." });
    }

    var quest = await findQuest(id);
    if (!quest) {
      return response.status(404).json({ message: "Quest not found." });
    }
    if (quest.status !== "Active" || !quest.acceptedBy || quest.acceptedBy.toString() !== request.hero._id.toString()) {
      return response.status(403).json({ message: "Only the hero who accepted this active quest can give up." });
    }

    quest.status = "Open";
    quest.acceptedBy = null;
    quest.acceptorContact = null;

    var quests = getDatabase().collection("quests");
    await quests.updateOne(
      { _id: quest._id },
      { $set: { status: quest.status, acceptedBy: quest.acceptedBy, acceptorContact: quest.acceptorContact } }
    );

    return response.status(200).json({ message: "Quest given up, returned to open", quest: sanitizeQuestForUser(quest, request.hero._id) });
  } catch (error) {
    console.error("Could not give up quest:", error.message);
    return response.status(500).json({ message: "Could not give up quest." });
  }
}

// Delete a quest (only when Open and by poster).
async function deleteQuest(request, response) {
  try {
    var id = request.params.id;
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid quest ID." });
    }
    var quest = await findQuest(id);
    if (!quest) {
      return response.status(404).json({ message: "Quest not found." });
    }
    if (quest.postedBy.toString() !== request.hero._id.toString()) {
      return response.status(403).json({ message: "Only the quest poster can delete it." });
    }
    if (quest.status !== "Open") {
      return response.status(400).json({ message: "Only open quests can be edited/deleted." });
    }

    await getDatabase().collection("quests").deleteOne({ _id: quest._id });
    return response.status(200).json({ message: "Quest deleted." });
  } catch (error) {
    console.error("Could not delete quest:", error.message);
    return response.status(500).json({ message: "Could not delete quest." });
  }
}

// Connect routes
router.get("/", requireLogin, getQuests);
router.post("/", requireLogin, createQuest);
router.put("/:id", requireLogin, editQuest);
router.put("/:id/accept", requireLogin, acceptQuest);
router.put("/:id/submit", requireLogin, submitQuest);
router.put("/:id/approve", requireLogin, approveQuest);
router.put("/:id/reject", requireLogin, rejectQuest);
router.put("/:id/giveup", requireLogin, giveupQuest);
router.delete("/:id", requireLogin, deleteQuest);

// Share quest routes with the Express server.
module.exports = router;
