// Load MongoDB's official client for the local database connection.
var MongoClient = require("mongodb").MongoClient;
var MONGO_URI = "mongodb://127.0.0.1:27017";
var client = new MongoClient(MONGO_URI);
var database = null;

// Connect to MongoDB and select the QuestBoard database.
async function connectDatabase() {
  try {
    await client.connect();
    database = client.db("QuestBoardDB");
    console.log("Connected to MongoDB: QuestBoardDB");
    return database;
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    throw error;
  }
}

// Give route files the database after the connection is ready.
function getDatabase() {
  if (!database) {
    throw new Error("The database connection is not ready");
  }
  return database;
}

// Share only the connection functions with the rest of the server.
module.exports = {
  connectDatabase: connectDatabase,
  getDatabase: getDatabase
};
