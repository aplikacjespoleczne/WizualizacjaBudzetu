var express = require('express');
var router = express.Router();
var xml2json = require('node-xml2json');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res){
  var html = '<form method="post" enctype="multipart/form-data" action="/user">'+
      '<label for="username"><span>login</span><input type="text" name="username" id="username"></label><br/>'+
      '<label for="password"><span>hasło</span><input type="password" name="password" id="password"></label><br/><br/>'+
      '<input type="submit" value="KLIK">'+
      '</form>';
               
  res.send(html);
});

router.post('/user', function(req, res) {
  if (req.body.username != 'admin' || req.body.password != 'admin123') {
    var aaa = req.body.username;
    var bbb = req.body.password;
    res.send("<div>Wprowadzono błędne dane.</div><div><a href='/'>powrót</a></div>");
  } else {
    var html = '<form method="post" enctype="multipart/form-data" action="/file-upload">'+
        '<label for="inputxml"><span>wprowadź plik</span><input type="file" name="inputxml" id="inputxml"></label><br/><br/>'+
        '<input type="submit" value="KLIK">'+
        '</form>';
    
    res.send(html);
  }
});

router.post('/file-upload', function(req, res) {
   
  //var filepath = "/usr/home/aplikacje/domains/test.aplikacje.mydevil.net/public_nodejs/" + req.files.inputxml.path;
  var filepath = req.files.inputxml.path;
  
  fs.readFile(filepath, 'utf8', function (err, data) {
    var parsed = xml2json.parser(data);//,'','html'
    //var document = JSON.stringify(parsed);
    var inside = parsed.dokumentplanistyczny.zalaczniki.wydatki.pozycja;
    
    var MongoClient = require('mongodb').MongoClient, format = require('util').format;
    MongoClient.connect('mongodb://mo14248_wiz_budz:kdpWizualizujeBudzet123@mongo0.mydevil.net:27017/mo14248_wiz_budz', function(err, db) {
      if (err) throw err;
      var testCollection = db.collection('test');
      testCollection.remove({}, function(err, removed) {
        testCollection.insert(inside, function(err, result) {
          if (err) throw err;
          db.close();
        });
      });
    });
    res.send("<div>Poprawnie zuploadowano plik</div><div><a href='/'>powrót</a></div>");
  });
});

module.exports = router;
