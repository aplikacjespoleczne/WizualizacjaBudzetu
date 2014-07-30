var express = require('express');
var router = express.Router();
var parseCSVFile = require('../csvParser');
var AmountProvider = require('../amountProvider').AmountProvider;
var amountProvider = new AmountProvider();

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
        '<label for="inputcsv"><span>wprowadź plik</span><input type="file" name="inputcsv" id="inputcsv"></label><br/><br/>'+
        '<input type="submit" value="KLIK">'+
        '</form>';
    
    res.send(html);
  }
});

router.post('/file-upload', function(req, res) {
  
  //var filepath = "/usr/home/aplikacje/domains/test.aplikacje.mydevil.net/public_nodejs/"; 
  //var filepath = "/usr/home/aplikacje/domains/test.aplikacje.mydevil.net/public_nodejs/" + req.files.inputxml.path;
  //name = "" || ;
  parseCSVFile(req.files.inputcsv.path);
  res.send("<div>Poprawnie zuploadowano plik</div><div><a href='/'>powrót</a></div>");

});

///////////////////////////////getters
router.get('/get', function(req, res) {
	amountProvider.find(null, null, function(error, results) {
		if (error) {
			throw error;
		}
		res.json(results);	
	});
});

router.get('/get/:first', function(req, res) {
	amountProvider.find(req.params.first, null, function(error, results) {
		if (error) {
			throw error;
		}
		res.json(results);	
	});
});

router.get('/get/:first/:second', function(req, res) {
	amountProvider.find(req.params.first, req.params.second, function(error, results) {
		if (error) {
			throw error;
		}
		res.json(results);	
	});
});

module.exports = router;

