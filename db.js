const mongoose = require("mongoose");

const uri =
  "mongodb+srv://slowpoke:ZyjFXQIU1pq2uOee@scrapy.dhxbc.mongodb.net/?retryWrites=true&w=majority&appName=Scrapy";
const Log = require("./models/Log");

const connectToDatabase = async () => {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.useDb("rm");
    console.log("Connected to MongoDB!");
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err.toString());
  }
};

async function addLog(logEntry) {
  try {
    const dbLog = new Log(logEntry);
    await dbLog.save();
    console.log("Log saved to MongoDB:", dbLog.url, dbLog.ip, dbLog.timestamp);
  } catch (err) {
    console.error("Error saving log to MongoDB:", err.toString());
  }
}
async function clearLogs() {
  try {
    const result = await Log.deleteMany({});
    console.log(`${result.deletedCount} logs cleared from the collection.`);
  } catch (err) {
    console.error("Error clearing logs:", err.toString());
  }
}

async function getLogs() {
  let logs;
  try {
    logs = await Log.find().sort({ timestamp: -1 }).exec();
  } catch (err) {
    console.error("Error fetching logs from MongoDB:", err.toString());
  }
  return logs;
}

// mongoose.disconnect().then((d) => {
//   console.log("db close");
// });
module.exports = { connectToDatabase, addLog, clearLogs, getLogs };
