const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  url: { type: String, required: true },
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Log = mongoose.model("Log", logSchema);

module.exports = Log;
