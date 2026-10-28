// Authentication middleware to verify token and load logged-in hero.
var getDatabase = require("../db").getDatabase;

// Verify the Authorization header token and attach the hero to the request object.
async function requireLogin(request, response, next) {
  try {
    var authHeader = request.headers.authorization;
    if (!authHeader) {
      return response.status(401).json({ message: "Authentication required. Please log in." });
    }

    // Expect header format: "<token>"
    var token = authHeader.trim();
    if (!token) {
      return response.status(401).json({ message: "Invalid authentication token." });
    }

    var hero = await getDatabase().collection("heroes").findOne({ token: token });
    if (!hero) {
      return response.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }

    // Attach hero to request for downstream handlers
    request.hero = hero;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    return response.status(500).json({ message: "Internal server error during authentication." });
  }
}

module.exports = {
  requireLogin: requireLogin
};
