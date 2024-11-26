const express = require('express');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;



const list = [
  "https://cdnfinance.technews.tw/page/2/",
  "https://cdnfinance.technews.tw/page/3/",
  "https://cdnfinance.technews.tw/page/4/",
  "https://cdnfinance.technews.tw/page/5/"
]

let i = -1;


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



app.get('/test', (req, res) => {
  i++;
  const redirectUrl = list[i % list.length];
  
  res.render('redirect', { redirectUrl,  i:i % list.length});

});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
