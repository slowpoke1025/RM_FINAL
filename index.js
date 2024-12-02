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
  "https://www.surveycake.com/s/1kl7x",
  "https://www.surveycake.com/s/pgY4n",
  "https://www.surveycake.com/s/ag1e4",
];
const clicks = [0, 0, 0, 0];

let i = -1;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  console.log(`\nIncoming request: ${req.url}\n`);
  next();
});

app.get("/test", (req, res) => {
  i++;
  const index = i % list.length;
  const redirectUrl = list[index];

  res.render("redirect", { redirectUrl, i: i % list.length });
  console.log(`url: ${redirectUrl}`);
  console.log(`${index}' click: ${++clicks[index]}`);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
