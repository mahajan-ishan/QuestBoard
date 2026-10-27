// Set up quest routes and MongoDB helpers.
var express = require("express");
var ObjectId = require("mongodb").ObjectId;
var getDatabase = require("../db").getDatabase;
var router = express.Router();
var validDifficulties = ["Easy", "Medium", "Hard", "Legendary"];
var validStatuses = ["Open", "Active", "Done"];
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

// List quests and apply optional difficulty and status filters.
async function getQuests(request, response) {
  try {
    var difficulty = request.query.difficulty;
    var status = request.query.status;
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return response.status(400).json({ message: "Invalid difficulty filter" });
    }
    if (status && !validStatuses.includes(status)) {
      return response.status(400).json({ message: "Invalid status filter" });
    }
    var filter = {};
    if (difficulty) filter.difficulty = difficulty;
    if (status) filter.status = status;
    var quests = getDatabase().collection("quests");
    var results = await quests.find(filter).sort({ createdAt: -1 }).toArray();
    return response.status(200).json(results);
  } catch (error) {
    console.error("Could not list quests:", error.message);
    return response.status(500).json({ message: "Could not list quests" });
  }
}

// Validate and save a new open quest with its difficulty-based reward.
async function createQuest(request, response) {
  try {
    var body = request.body || {};
    if (!hasText(body.title) || !hasText(body.description) ||
        !validDifficulties.includes(body.difficulty) || !hasText(body.postedBy)) {
      return response.status(400).json({ message: "Enter a title, description, difficulty, and postedBy" });
    }
    var quest = {
      title: body.title.trim(),
      description: body.description.trim(),
      difficulty: body.difficulty,
      xpReward: rewards[body.difficulty],
      status: "Open",
      postedBy: body.postedBy.trim(),
      acceptedBy: null,
      createdAt: new Date()
    };
    var quests = getDatabase().collection("quests");
    var result = await quests.insertOne(quest);
    quest._id = result.insertedId;
    return response.status(201).json({ message: "Quest created", quest: quest });
  } catch (error) {
    console.error("Could not create quest:", error.message);
    return response.status(500).json({ message: "Could not create quest" });
  }
}

// Edit a posted quest, accept an open quest, or complete an active quest.
async function updateQuest(request, response) {
  try {
    var id = request.params.id;
    var body = request.body || {};
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid quest ID" });
    }
    var quest = await findQuest(id);
    if (!quest) {
      return response.status(404).json({ message: "Quest not found" });
    }
    var quests = getDatabase().collection("quests");

    if (body.action === "edit") {
      if (body.postedBy !== quest.postedBy) {
        return response.status(400).json({ message: "Only the quest poster can edit it" });
      }
      if (quest.status !== "Open") {
        return response.status(400).json({ message: "Only open quests can be edited" });
      }
      if (!hasText(body.title) || !hasText(body.description) || !validDifficulties.includes(body.difficulty)) {
        return response.status(400).json({ message: "Enter a title, description, and valid difficulty" });
      }
      quest.title = body.title.trim();
      quest.description = body.description.trim();
      quest.difficulty = body.difficulty;
      quest.xpReward = rewards[body.difficulty];
      await quests.updateOne({ _id: quest._id }, { $set: { title: quest.title, description: quest.description, difficulty: quest.difficulty, xpReward: quest.xpReward } });
      return response.status(200).json({ message: "Quest updated", quest: quest });
    }

    if (body.action === "accept") {
      if (!hasText(body.acceptedBy)) return response.status(400).json({ message: "acceptedBy is required" });
      if (quest.status !== "Open") return response.status(400).json({ message: "Only open quests can be accepted" });
      if (quest.postedBy === body.acceptedBy.trim()) return response.status(400).json({ message: "You cannot accept your own quest" });
      quest.status = "Active";
      quest.acceptedBy = body.acceptedBy.trim();
      await quests.updateOne({ _id: quest._id }, { $set: { status: quest.status, acceptedBy: quest.acceptedBy } });
      return response.status(200).json({ message: "Quest accepted", quest: quest });
    }

    if (body.action === "complete") {
      if (!hasText(body.heroId)) return response.status(400).json({ message: "heroId is required" });
      if (quest.status !== "Active" || quest.acceptedBy !== body.heroId.trim()) {
        return response.status(400).json({ message: "Only the hero who accepted an active quest can complete it" });
      }
      quest.status = "Done";
      await quests.updateOne({ _id: quest._id }, { $set: { status: quest.status } });
      return response.status(200).json({ message: "Quest completed", quest: quest });
    }

    return response.status(400).json({ message: "Choose action: edit, accept, or complete" });
  } catch (error) {
    console.error("Could not update quest:", error.message);
    return response.status(500).json({ message: "Could not update quest" });
  }
}

// Delete a quest only when the poster's ID matches the request body.
async function deleteQuest(request, response) {
  try {
    var postedBy = request.body && request.body.postedBy;
    if (!ObjectId.isValid(request.params.id)) {
      return response.status(400).json({ message: "Invalid quest ID" });
    }
    var quest = await findQuest(request.params.id);
    if (!quest) return response.status(404).json({ message: "Quest not found" });
    if (postedBy !== quest.postedBy) return response.status(400).json({ message: "Only the quest poster can delete it" });
    await getDatabase().collection("quests").deleteOne({ _id: quest._id });
    return response.status(200).json({ message: "Quest deleted" });
  } catch (error) {
    console.error("Could not delete quest:", error.message);
    return response.status(500).json({ message: "Could not delete quest" });
  }
}

// Connect each HTTP method to its matching handler function.
router.get("/", getQuests);
router.post("/", createQuest);
router.put("/:id", updateQuest);
router.delete("/:id", deleteQuest);

// Share quest routes with the Express server.
module.exports = router;
