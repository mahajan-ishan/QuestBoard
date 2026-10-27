// Set up the leaderboard route and MongoDB helper.
var express = require("express");
var getDatabase = require("../db").getDatabase;
var router = express.Router();

// Find the ten heroes with the most XP.
async function getLeaderboard(request, response) {
  try {
    var heroes = await getDatabase().collection("heroes")
      .find({})
      .sort({ xp: -1 })
      .limit(10)
      .toArray();
    return response.status(200).json(heroes);
  } catch (error) {
    console.error("Could not load leaderboard:", error.message);
    return response.status(500).json({ message: "Could not load leaderboard" });
  }
}

// Connect the leaderboard URL to its handler.
router.get("/", getLeaderboard);

// Share the leaderboard route with the Express server.
module.exports = router;
