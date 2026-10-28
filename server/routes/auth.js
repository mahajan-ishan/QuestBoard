// Authentication routes for register, login, logout, and get current user.
var express = require("express");
var crypto = require("crypto");
var getDatabase = require("../db").getDatabase;
var requireLogin = require("../middleware/auth").requireLogin;
var router = express.Router();

var validClasses = ["Coder", "Designer", "Thinker"];

// Check that a value is a non-empty string.
function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

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

// Register a new hero account.
async function registerHero(request, response) {
  try {
    var body = request.body || {};
    var username = body.username ? body.username.trim().toLowerCase() : "";
    var password = body.password ? body.password : "";
    var heroClasses = body.heroClasses;
    var avatar = body.avatar ? body.avatar.trim() : "";

    // Validate username format (3-20 chars, letters/numbers/underscore only)
    var usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return response.status(400).json({
        message: "Username must be 3-20 characters long and contain only letters, numbers, and underscores."
      });
    }

    // Validate password minimum length
    if (typeof password !== "string" || password.length < 4) {
      return response.status(400).json({ message: "Password must be at least 4 characters long." });
    }

    // Validate heroClasses (array containing at least one valid class, no invalid ones)
    if (!Array.isArray(heroClasses) || heroClasses.length === 0) {
      return response.status(400).json({ message: "Select at least one hero class." });
    }
    for (var i = 0; i < heroClasses.length; i++) {
      if (!validClasses.includes(heroClasses[i])) {
        return response.status(400).json({ message: "Invalid hero class: " + heroClasses[i] });
      }
    }

    // Validate avatar
    if (!hasText(avatar)) {
      return response.status(400).json({ message: "Avatar is required." });
    }

    var heroes = getDatabase().collection("heroes");

    // Check if username is already taken
    var existing = await heroes.findOne({ username: username });
    if (existing) {
      return response.status(400).json({ message: "Username is already taken. Choose another." });
    }

    // Generate login token using Node's built-in crypto module
    // crypto.randomBytes(24).toString("hex") generates a secure random 48-character hexadecimal string token.
    var token = crypto.randomBytes(24).toString("hex");

    var newHero = {
      username: username,
      password: password, // Plain text for learning only. A real app would hash passwords.
      token: token,
      heroClasses: heroClasses,
      avatar: avatar,
      xp: 0,
      level: 1,
      createdAt: new Date()
    };

    var result = await heroes.insertOne(newHero);
    newHero._id = result.insertedId;

    return response.status(201).json({
      message: "Registration successful",
      token: token,
      hero: sanitizeHero(newHero)
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    return response.status(500).json({ message: "Could not register hero." });
  }
}

// Log in an existing hero.
async function loginHero(request, response) {
  try {
    var body = request.body || {};
    var username = body.username ? body.username.trim().toLowerCase() : "";
    var password = body.password ? body.password : "";

    if (!hasText(username) || !hasText(password)) {
      return response.status(400).json({ message: "Enter both username and password." });
    }

    var heroes = getDatabase().collection("heroes");
    var hero = await heroes.findOne({ username: username });

    // Check username and plain text password
    if (!hero || hero.password !== password) {
      return response.status(401).json({ message: "Invalid username or password." });
    }

    // Generate new session token
    var token = crypto.randomBytes(24).toString("hex");
    await heroes.updateOne({ _id: hero._id }, { $set: { token: token } });
    hero.token = token;

    return response.status(200).json({
      message: "Login successful",
      token: token,
      hero: sanitizeHero(hero)
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return response.status(500).json({ message: "Could not log in." });
  }
}

// Log out by clearing the token in database.
async function logoutHero(request, response) {
  try {
    await getDatabase().collection("heroes").updateOne(
      { _id: request.hero._id },
      { $set: { token: null } }
    );
    return response.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error.message);
    return response.status(500).json({ message: "Could not log out." });
  }
}

// Return currently logged-in hero info.
async function getCurrentHero(request, response) {
  try {
    return response.status(200).json({ hero: sanitizeHero(request.hero) });
  } catch (error) {
    console.error("Get current hero error:", error.message);
    return response.status(500).json({ message: "Could not get current hero." });
  }
}

// Connect routes
router.post("/register", registerHero);
router.post("/login", loginHero);
router.post("/logout", requireLogin, logoutHero);
router.get("/me", requireLogin, getCurrentHero);

module.exports = router;
