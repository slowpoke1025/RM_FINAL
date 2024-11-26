const express = require('express');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;



const list = [
  "https://tw.portal-pokemon.com/play/pokedex/0001",
  "https://tw.portal-pokemon.com/play/pokedex/0004",
  "https://tw.portal-pokemon.com/play/pokedex/0007",
  "https://tw.portal-pokemon.com/play/pokedex/0025"
]

let i = -1;


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.ip} ${req.url}`);
  next();
});



app.get('/', (req, res) => {
  i++;
  const redirectUrl = list[i % list.length];
  
  res.render('redirect', { redirectUrl,  i:i % list.length});
  console.log(`click = ${i+1}`)
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
