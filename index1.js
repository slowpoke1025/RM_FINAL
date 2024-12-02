const express = require("express");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;

// const list = [
//   "https://tw.portal-pokemon.com/play/pokedex/0001",
//   "https://tw.portal-pokemon.com/play/pokedex/0004",
//   "https://tw.portal-pokemon.com/play/pokedex/0007",
//   "https://tw.portal-pokemon.com/play/pokedex/0025"
// ]

const list = [
  "https://www.surveycake.com/s/DYxaX",
  "https://www.surveycake.com/s/PXAwM",
  "https://www.surveycake.com/s/DYxGe",
  "https://www.surveycake.com/s/og7N2",
];

const record = {};
const clicks = [0, 0, 0, 0];

let i = 0;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("trust proxy", true);

app.use((req, res, next) => {
  console.log(`\nIncoming request: ${req.url}`);
  console.log(`IP: ${req.ip}\n`);
  next();
});

app.get("/test", (req, res) => {
  let index, redirectUrl;
  if (record[req.ip] == null) {
    index = i % list.length;
    record[req.ip] = index;
    console.log(record);
    ++i;
  } else {
    index = record[req.ip];
  }
  redirectUrl = list[index];

  res.render("redirect", { redirectUrl });
  console.log(`url: ${redirectUrl}`);
  console.log(`${index}' click: ${++clicks[index]}`);
  console.log(`total click: ${i}`);
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
  res.send("Clear");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
