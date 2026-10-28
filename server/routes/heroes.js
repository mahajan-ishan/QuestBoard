// Set up hero routes with authentication and multi-class support.
var express = require("express");
var ObjectId = require("mongodb").ObjectId;
var getDatabase = require("../db").getDatabase;
var requireLogin = require("../middleware/auth").requireLogin;
var router = express.Router();

// Remove sensitive fields before sending hero data in responses.
function sanitizeHero(hero) {
  return {
    _id: hero._id,
    username: hero.username,
    heroClasses: hero.heroClasses,
    avatar: hero.avatar,
    xp: hero.xp,
    level: hero.level,
    createdAt: hero.createdAt
  };
}

// List all saved heroes (publicly visible profile summaries).
async function getHeroes(request, response) {
  try {
    var heroes = await getDatabase().collection("heroes").find({}).toArray();
    var sanitized = heroes.map(function(h) { return sanitizeHero(h); });
    return response.status(200).json(sanitized);
  } catch (error) {
    console.error("Could not list heroes:", error.message);
    return response.status(500).json({ message: "Could not list heroes." });
  }
}

// Find one hero by ID (publicly visible profile summary).
async function getHero(request, response) {
  try {
    var id = request.params.id;
    if (!ObjectId.isValid(id)) {
      return response.status(400).json({ message: "Invalid hero ID." });
    }
    var hero = await getDatabase().collection("heroes").findOne({ _id: new ObjectId(id) });
    if (!hero) {
      return response.status(404).json({ message: "Hero not found." });
    }
    return response.status(200).json(sanitizeHero(hero));
  } catch (error) {
    console.error("Could not find hero:", error.message);
    return response.status(500).json({ message: "Could not find hero." });
  }
}

// Connect routes (require login for listing and viewing individual hero profiles)
router.get("/", requireLogin, getHeroes);
router.get("/:id", requireLogin, getHero);

// Share hero routes with the Express server.
module.exports = router;
