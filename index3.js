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
  console.log(`\nIncoming request: ${req.url}`);
  console.log(`IP: ${req.ip}\n`);
  next();
});

app.get("/test", async (req, res) => {
  try {
    let index, redirectUrl;
    const activeList = list.filter((item) => item.status === "active");

    if (req.session.url == null) {
      index = i % activeList.length;
      redirectUrl = activeList[index]?.url;

      if (!redirectUrl) {
        return res.status(500).send("No active URLs available.");
      }

      req.session.url = redirectUrl;
      clicks[redirectUrl] = (clicks[redirectUrl] || 0) + 1;
      ++i;
    } else {
      redirectUrl = req.session.url;
    }

    const logEntry = {
      url: redirectUrl,
      ip: req.ip,
      timestamp: new Date(),
    };

    try {
      const dbLog = new Log(logEntry);
      await dbLog.save();
      console.log("Log saved to MongoDB:", dbLog);
    } catch (err) {
      console.error("Error saving log to MongoDB:", err.toString());
    }

    res.render("redirect", { redirectUrl });
    console.log(`url: ${redirectUrl}`);
    console.log(`click: ${clicks[redirectUrl]}`);
    console.log(`total click: ${totalClick()}`);
  } catch (err) {
    console.error("Error in /test route:", err.toString());
    res.status(500).send("An error occurred.");
  }
});

app.get("/clear", async (req, res) => {
  try {
    for (let j = 0; j < list.length; j++) {
      clicks[list[j].url] = 0;
    }
    logs.length = 0; // Clear logs
    i = 0;

    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err.toString());
        return res.status(500).send("Failed to clear session.");
      }
      console.log("Session cleared.");
    });

    try {
      const result = await Log.deleteMany({});
      console.log(`${result.deletedCount} logs cleared from the collection.`);
    } catch (err) {
      console.error("Error clearing logs:", err.toString());
    }

    res.redirect("/logs");
  } catch (err) {
    console.error("Error in /clear route:", err.toString());
    res.status(500).send("An error occurred.");
  }
});

app.get("/logs", async (req, res) => {
  try {
    const linksData = list.map((item) => ({
      url: item.url,
      status: item.status,
      clicks: clicks[item.url] || 0,
    }));

    let _logs;
    try {
      _logs = await Log.find().sort({ timestamp: -1 }).exec();
    } catch (err) {
      console.error("Error fetching logs from MongoDB:", err.toString());
      _logs = logs; // Fallback to in-memory logs
    }

    const activeList = list.filter((item) => item.status === "active");
    const nextLink =
      activeList[i % activeList.length]?.url || "No active links";

    res.render("logs3", { logs: _logs, linksData, nextLink });
  } catch (err) {
    console.error("Error in /logs route:", err.toString());
    res.status(500).send("An error occurred.");
  }
});

app.post(
  "/update-status",
  express.urlencoded({ extended: true }),
  (req, res) => {
    try {
      const { url, status } = req.body;

      if (!url || !["active", "suspended"].includes(status)) {
        return res.status(400).send("Invalid URL or status.");
      }

      const item = list.find((item) => item.url === url);
      if (!item) {
        return res.status(404).send("URL not found.");
      }

      item.status = status;
      res.redirect("/logs");
    } catch (err) {
      console.error("Error in /update-status route:", err.toString());
      res.status(500).send("An error occurred.");
    }
  }
);

app.post("/update-url", express.urlencoded({ extended: true }), (req, res) => {
  try {
    const { oldUrl, newUrl } = req.body;

    if (!newUrl || !/^https?:\/\/.+/.test(newUrl)) {
      return res.status(400).send("Invalid URL.");
    }

    if (oldUrl === newUrl) {
      return res.status(400).send("URLs are the same.");
    }

    const item = list.find((item) => item.url === oldUrl);
    if (!item) {
      return res.status(404).send("Original URL not found.");
    }

    item.url = newUrl;
    clicks[newUrl] = clicks[oldUrl] || 0;
    delete clicks[oldUrl];

    res.redirect("/logs");
  } catch (err) {
    console.error("Error in /update-url route:", err.toString());
    res.status(500).send("An error occurred.");
  }
});

function totalClick() {
  return Object.values(clicks).reduce((sum, count) => sum + count);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
