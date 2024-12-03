const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();

const PORT = process.env.PORT || 3000;

const list = [
  { url: "https://www.surveycake.com/s/DYxaX", status: "active" },
  { url: "https://www.surveycake.com/s/PXAwM", status: "active" },
  { url: "https://www.surveycake.com/s/DYxGe", status: "active" },
  { url: "https://www.surveycake.com/s/og7N2", status: "active" },
];

const mongoose = require("mongoose");
const uri =
  "mongodb+srv://slowpoke:ZyjFXQIU1pq2uOee@scrapy.dhxbc.mongodb.net/?retryWrites=true&w=majority&appName=Scrapy";

mongoose
  .connect(uri)
  .then(() => {
    const db = mongoose.connection.useDb("rm");
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.toString());
  });

const logSchema = new mongoose.Schema({
  url: { type: String, required: true },
  ip: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});
let Log = mongoose.model("Log", logSchema);

// mongoose.disconnect().then((d) => {
//   console.log("db close");
// });
const clicks = {};
list.forEach((i) => {
  clicks[i.url] = 0;
});
let i = 0;

// Store logs
const logs = [];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", true);

// Middleware to log incoming requests

app.use(
  session({
    secret: "your-secret-key", // Replace with a strong secret
    resave: false, // Avoid resaving unchanged sessions
    saveUninitialized: false, // Avoid saving empty sessions
    cookie: {
      httpOnly: true, // Prevent client-side access to the cookie
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(async (req, res, next) => {
  console.log(`\nIncoming request: ${req.url}\n`);
  console.log(`IP: ${req.ip}`);
  next();
});

app.get("/test", async (req, res) => {
  let index, redirectUrl;
  const activeList = list.filter((item) => item.status === "active");

  if (req.session.url == null) {
    index = i % activeList.length;
    redirectUrl = activeList[index].url;
    req.session.url = redirectUrl;
    ++clicks[redirectUrl];
    ++i;
  } else {
    redirectUrl = req.session.url;
  }

  const logEntry = {
    url: redirectUrl,
    ip: req.ip,
    timestamp: new Date(),
  };
  logs.push(logEntry); // Save log entry
  try {
    const dbLog = new Log(logEntry);
    await dbLog.save();
    console.log("Log saved to MongoDB:", dbLog);
  } catch (err) {
    console.error("Error saving log:", err.toString());
  }

  res.render("redirect", { redirectUrl });
  console.log(`url: ${redirectUrl}`);
  console.log(`click: ${clicks[redirectUrl]}`);
  console.log(`total click: ${totalClick()}`);
});

app.get("/clear", async (req, res) => {
  for (let j = 0; j < list.length; j++) {
    clicks[list[j].url] = 0;
  }
  logs.length = 0; // Clear logs
  i = 0;

  try {
    // Delete all documents
    const result = await Log.deleteMany({});
    console.log(`${result.deletedCount} logs cleared from the collection.`);
  } catch (err) {
    console.error("Error clearing logs:", err.toString());
  }

  res.redirect("/logs"); // Redirect back to the logs page
});

app.get("/logs", async (req, res) => {
  const linksData = list.map((item, index) => ({
    url: item.url,
    status: item.status,
    clicks: clicks[item.url],
  }));
  let _logs;
  try {
    _logs = await Log.find().sort({ timestamp: -1 }).exec();
  } catch (err) {
    console.error("Error fetching logs:", err.toString());
    _logs = logs;
  }
  const activeList = list.filter((item) => item.status === "active");

  let nextLink = activeList[i % activeList.length].url;
  res.render("logs3", { logs: _logs, linksData, nextLink });
});

app.post(
  "/update-status",
  express.urlencoded({ extended: true }),
  (req, res) => {
    const { url, status } = req.body;

    // Validate input
    if (!url || !["active", "suspended"].includes(status)) {
      return res.status(400).send("Invalid URL or status.");
    }

    const item = list.find((item) => item.url === url);
    if (!item) {
      return res.status(404).send("URL not found.");
    }

    item.status = status; // Update the status
    res.redirect("/logs"); // Redirect back to the logs page
  }
);

function totalClick() {
  return Object.values(clicks).reduce((sum, count) => sum + count);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
