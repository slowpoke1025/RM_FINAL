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

// const clicks = [0, 0, 0, 0];
const clicks = {};
list.forEach((i) => {
  clicks[i.url] = 0;
});
let i = -1;

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

app.use((req, res, next) => {
  if (req.url == "/test") {
    const logEntry = {
      url: req.url,
      ip: req.ip,
      timestamp: new Date(),
    };
    logs.push(logEntry); // Save log entry
  }

  console.log(`\nIncoming request: ${req.url}\n`);
  console.log(`IP: ${req.ip}`);
  next();
});

app.get("/test", (req, res) => {
  let index, redirectUrl;
  const activeList = list.filter((item) => item.status === "active");

  if (req.session.url == null) {
    ++i;
    index = i % activeList.length;
    redirectUrl = activeList[index].url;
    req.session.url = redirectUrl;
    ++clicks[redirectUrl];
  } else {
    redirectUrl = req.session.url;
  }

  res.render("redirect", { redirectUrl });
  console.log(`url: ${redirectUrl}`);
  console.log(`click: ${clicks[redirectUrl]}`);
  console.log(`total click: ${i + 1}`);
});

app.get("/clear", (req, res) => {
  for (let j = 0; j < list.length; j++) {
    clicks[list.url] = 0;
  }
  logs.length = 0; // Clear logs
  i = -1;
  res.send("Clear");
});

app.get("/logs", (req, res) => {
  const linksData = list.map((item, index) => ({
    url: item.url,
    status: item.status,
    clicks: clicks[item.url],
  }));

  res.render("logs", { logs, linksData });
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
    res.redirect("/logs3"); // Redirect back to the logs page
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
