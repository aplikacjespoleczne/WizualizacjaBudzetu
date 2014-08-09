var express = require('express');
var router = express.Router();
var parseCSVFile = require('../csvParser');
var AmountProvider = require('../amountProvider').AmountProvider;
var amountProvider = new AmountProvider();
var d3 = require('d3');
var jsdom = require('jsdom');

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
	res.send("<div>Poprawnie zuploadowano plik</div><div><a href='/'>powrót</a></div>");
	process.nextTick(function(){
		parseCSVFile(req.files.inputcsv.path);
	});
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

router.get('/chart', function(req, res) {
	amountProvider.findTest(function(error, results) {
		if (error) {
			throw error;
		}
		res.writeHead(200, {'Content-Type': 'application/json'});	
		res.json(results);	
	});
	
});
router.get('/chart-test', function(req, res) {
	var htmlStructure = 
		'<html>'+
			'<head></head>'+
			'<body>'+
				'<div id="main-container"></div>'+
				'<script src="http://d3js.org/d3.v3.min.js"></script>'+
			'</body>'+
		'</html>';
	
	jsdom.env({ features : { QuerySelector : true }, html : htmlStructure, done : function(errors, window) {
		if (errors) {
			console.log(errors);
		}
		var el = window.document.querySelector('#main-container');
		var body = window.document.querySelector('body');
		
		amountProvider.findTest(function(error, results) {
			var canvas = d3.select(el)
							.append('svg:svg')
								.attr('width', 1000)
								.attr('height', 1000);
		
			var bars = canvas.selectAll("rect")
						.data(results)
						.enter()
							.append("rect")
								.attr("width", 50)
								.attr("height", function(d) { return d.value * 5;})
								.attr("x", function(d, i) { return i * 60;})
								.attr("y", function(d, i) { return 500  - d.value * 5;});

			res.send(window.document.innerHTML);					
		});
	}});
});

module.exports = router;
