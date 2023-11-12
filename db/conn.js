// ewentualnie uzyc mongoose
const { MongoClient } = require("mongodb");
const Db = process.env.MONGO_URI;
console.log(Db);
const client = new MongoClient(Db);

var _db;

module.exports = {
  connectToServer: async function (callback) {
    try {
      await client.connect();
      _db = client.db("products");
      console.log("Successfully connected to MongoDB database:", _db.databaseName);
      callback(null);
    } catch (err) {
      console.error("Error connecting to MongoDB:", err);
      callback(err);
    }
  },

  getDb: function () {
    return _db;
  },

  closeConnection: function () {
    if (client && client.topology && client.topology.isConnected()) {
      console.log("Closing MongoDB connection...");
      client.close();
    }
  }
};