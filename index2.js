const express = require("express");
const path = require("path");
// const cookieParser = require("cookie-parser");
const session = require("express-session");

const app = express();

const PORT = process.env.PORT || 3000;

const list = [
  "https://www.surveycake.com/s/DYxaX",
  "https://www.surveycake.com/s/PXAwM",
  "https://www.surveycake.com/s/DYxGe",
  //   "https://www.surveycake.com/s/og7N2",
];

const clicks = [0, 0, 0, 0];

let i = -1;

// Store logs
const logs = [];

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", true);

// app.use(cookieParser("your-secret-key"));

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
  if (req.session.index == null) {
    ++i;
    index = i % list.length;
    redirectUrl = list[index];
    req.session.index = index;
    ++clicks[index];
  } else {
    index = req.session.index;
    redirectUrl = list[index];
  }

  res.render("redirect", { redirectUrl });
  console.log(`url: ${redirectUrl}`);
  console.log(`${index}' click: ${clicks[index]}`);
  console.log(`total click: ${i + 1}`);
});

app.get("/res", (req, res) => {
  const result = {};
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    result[i] = { url: list[i], click: clicks[i] };
    total += clicks[i];
  }
  result["total"] = total;
  console.log(result);
  res.json(result);
});

app.get("/clear", (req, res) => {
  for (let i = 0; i < clicks.length; i++) {
    clicks[i] = 0;
  }
  logs.length = 0; // Clear logs
  res.send("Clear");
});

app.get("/logs", (req, res) => {
  const linksData = list.map((url, index) => ({
    url,
    clicks: clicks[index],
  }));

  res.render("logs", { logs, linksData });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
