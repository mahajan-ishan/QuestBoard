// Load Express, CORS, and the quest routes for the API server.
var express = require("express");
var cors = require("cors");
var questsRoutes = require("./routes/quests");
var heroesRoutes = require("./routes/heroes");
var leaderboardRoutes = require("./routes/leaderboard");
var connectDatabase = require("./db").connectDatabase;

// Create the Express application and choose its local port.
var app = express();
var PORT = 3000;

// Let the browser call the API and read JSON request bodies.
app.use(cors());
app.use(express.json());

// Mount all quest endpoints below the shared API address.
app.use("/api/quests", questsRoutes);

// Mount the hero endpoints below their own API address.
app.use("/api/heroes", heroesRoutes);

// Mount the top-ten heroes endpoint.
app.use("/api/leaderboard", leaderboardRoutes);

// Give a simple response when someone opens the server home page.
function showServerMessage(request, response) {
  response.status(200).json({ message: "QuestBoard API is running" });
}

// Connect the health check route to its handler function.
app.get("/", showServerMessage);

// Connect to MongoDB before accepting requests.
async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, function reportServerIsReady() {
      console.log("QuestBoard API is running at http://localhost:" + PORT);
    });
  } catch (error) {
    console.error("QuestBoard could not start:", error.message);
    process.exit(1);
  }
}

// Start the API as soon as this file runs.
startServer();
