// Set up the leaderboard route with sanitization.
var express = require("express");
var getDatabase = require("../db").getDatabase;
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

// Find the ten heroes with the most XP.
async function getLeaderboard(request, response) {
  try {
    var heroes = await getDatabase().collection("heroes")
      .find({})
      .sort({ xp: -1 })
      .limit(10)
      .toArray();
    var sanitized = heroes.map(function(h) { return sanitizeHero(h); });
    return response.status(200).json(sanitized);
  } catch (error) {
    console.error("Could not load leaderboard:", error.message);
    return response.status(500).json({ message: "Could not load leaderboard." });
  }
}

// Connect the leaderboard URL to its handler.
router.get("/", getLeaderboard);

// Share the leaderboard route with the Express server.
module.exports = router;
