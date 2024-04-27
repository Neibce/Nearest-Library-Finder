const express = require('express')
const request = require('request');
const app = express()
const port = 3000


app.use(express.static('public'))

app.get('/', (req, res) => res.send('Hello World!'))

app.get('/book-search', function(req,res){
  console.log(req._parsedUrl.path)
  var url = "https://nl.go.kr/kolisnet/openApi/open.php?collection_set=1&page="+req.query.page+"&search_field1=title&value1=" + encodeURI(req.query.title) + "&&per_page=50&sort_ksj=SORT_TITLE%20DESC";
  console.log(url)
  var options = {
    'method': 'GET',
    'url': url
  };
  request(options, function (error, response) {
    if (error){ //API 오류발생 할 경우에 대한 예외 처리
      console.log(error);
      res.send("ERR");
      return;
    }
    res.send(response.body);
  });
})

app.get('/book-detail', function(req,res){
  console.log(req._parsedUrl.path)
  var url = "https://nl.go.kr/kolisnet/openApi/open.php?rec_key=" + encodeURI(req.query.rec_key);
  console.log(url)
  var options = {
    'method': 'GET',
    'url': url
  };
  request(options, function (error, response) {
    if (error){ //API 오류발생 할 경우에 대한 예외 처리
      console.log(error);
      res.send("ERR");
      return;
    }
    res.send(response.body);
  });
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))