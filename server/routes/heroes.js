// Set up hero routes and MongoDB helpers.
var express = require("express");
var ObjectId = require("mongodb").ObjectId;
var getDatabase = require("../db").getDatabase;
var router = express.Router();
var validClasses = ["Coder", "Designer", "Thinker"];

// Check that a value is a non-empty string.
function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

// List all saved heroes.
async function getHeroes(request, response) {
  try {
    var heroes = await getDatabase().collection("heroes").find({}).toArray();
    return response.status(200).json(heroes);
  } catch (error) {
    console.error("Could not list heroes:", error.message);
    return response.status(500).json({ message: "Could not list heroes" });
  }
}

// Validate and save a new hero with the starting XP and level.
async function createHero(request, response) {
  try {
    var body = request.body || {};
    if (!hasText(body.name) || body.name.trim().length > 24 ||
        !validClasses.includes(body.heroClass) || !hasText(body.avatar)) {
      return response.status(400).json({ message: "Enter a name, valid heroClass, and avatar" });
    }
    var hero = {
      name: body.name.trim(),
      heroClass: body.heroClass,
      avatar: body.avatar.trim(),
      xp: 0,
      level: 1,
      createdAt: new Date()
    };
    var result = await getDatabase().collection("heroes").insertOne(hero);
    hero._id = result.insertedId;
    return response.status(201).json({ message: "Hero created", hero: hero });
  } catch (error) {
    console.error("Could not create hero:", error.message);
    return response.status(500).json({ message: "Could not create hero" });
  }
}

// Find one hero by its MongoDB ID.
async function getHero(request, response) {
  try {
    var id = request.params.id;
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid hero ID" });
    }
    var hero = await getDatabase().collection("heroes").findOne({ _id: new ObjectId(id) });
    if (!hero) {
      return response.status(404).json({ message: "Hero not found" });
    }
    return response.status(200).json(hero);
  } catch (error) {
    console.error("Could not find hero:", error.message);
    return response.status(500).json({ message: "Could not find hero" });
  }
}

// Add XP to a hero and calculate the new level from the total.
async function addHeroXp(request, response) {
  try {
    var id = request.params.id;
    var xpToAdd = request.body && request.body.xpToAdd;
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid hero ID" });
    }
    if (!Number.isInteger(xpToAdd) || xpToAdd <= 0) {
      return response.status(400).json({ message: "xpToAdd must be a positive whole number" });
    }
    var heroes = getDatabase().collection("heroes");
    var hero = await heroes.findOne({ _id: new ObjectId(id) });
    if (!hero) {
      return response.status(404).json({ message: "Hero not found" });
    }
    hero.xp += xpToAdd;
    hero.level = Math.floor(hero.xp / 100) + 1;
    await heroes.updateOne({ _id: hero._id }, { $set: { xp: hero.xp, level: hero.level } });
    return response.status(200).json({ message: "Hero XP updated", hero: hero });
  } catch (error) {
    console.error("Could not update hero XP:", error.message);
    return response.status(500).json({ message: "Could not update hero XP" });
  }
}

// Connect each hero URL to its matching handler.
router.get("/", getHeroes);
router.post("/", createHero);
router.get("/:id", getHero);
router.put("/:id", addHeroXp);

// Share hero routes with the Express server.
module.exports = router;
