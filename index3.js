const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();

const PORT = process.env.PORT || 3000;

const list = [
  { url: "https://www.surveycake.com/s/gAkaB", status: "active" },
  { url: "https://www.surveycake.com/s/D6RXz", status: "active" },
  { url: "https://www.surveycake.com/s/gAzD8", status: "active" },
  { url: "https://www.surveycake.com/s/G6q1P", status: "active" },
];

const { connectToDatabase, addLog, clearLogs, getLogs } = require("./db");
connectToDatabase();

const clicks = {};
list.forEach((i) => {
  clicks[i.url] = 0;
});
let i = 0;

const logs = [];
let randomFlag = false;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", true);

app.use(
  session({
    secret: "my-secret-key", // Replace with a strong secret
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

    if (activeList.length == 0) {
      return res.status(500).send("No active URLs available.");
    }

    if (req.session.url == null) {
      index = randomFlag
        ? getRandomInt(0, activeList.length)
        : i % activeList.length;

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
    logs.push(logEntry); // state
    addLog(logEntry); // db

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
    clearLogs(); // db

    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err.toString());
        return res.status(500).send("Failed to clear session.");
      }
      console.log("Session cleared.");
    });

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

    let _logs = await getLogs(); //db
    if (_logs == null) _logs = logs; // Fallback to in-memory logs

    const activeList = list.filter((item) => item.status === "active");
    const nextLink =
      activeList[i % activeList.length]?.url || "No active links";

    res.render("logs3", { logs: _logs, linksData, nextLink, randomFlag });
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
app.post("/toggle-random-flag", express.json(), (req, res) => {
  try {
    randomFlag = req.body.randomFlag;
    res.json({ success: true, randomFlag });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "No data provided or randomFlag missing. Expected a boolean.",
    });
  }

  // Update the flag and respond with success
});

function totalClick() {
  return Object.values(clicks).reduce((sum, count) => sum + count);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
