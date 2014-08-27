var express = require('express');
var router = express.Router();
var csvParser = require('../csvParser');
var config = require('../config');
var AmountProvider = require('../amountProvider').AmountProvider;
var amountProvider = new AmountProvider();
var d3 = require('d3');
var jsdom = require('jsdom');
var MongoClient = require('mongodb').MongoClient;

/* GET home page. */
router.get('/', function(req, res){
	res.render('index');
});

router.get('/admin', function(req, res){
  res.render('admin/admin');
});

router.post('/admin/admin', function(req, res) {

  MongoClient.connect(config.MONGO, function(error, db) {
  	if (error) {
  		res.render('admin/error',{message: 'Wystąpił błąd serwera. Spróbuj póżniej.'});
  		return; 
  	}
	users = db.collection("users");
  	users.find().toArray(function(error, admin_data){

  		if ((req.body.username != admin_data[0]["user"]) || (req.body.password != admin_data[0]["password"])) {
   			res.render('admin/error',{message: 'Wprowadzono błędne dane.'});
  			return;  	    	
  		} else {
  			res.render('admin/file-upload');
  	  	}  	
  	});
  });
});

router.post('/admin/file-upload', function(req, res) {
	res.render('admin/file-uploaded');
  	process.stderr.write("DEBUG Invoking callback function\n");
  	process.nextTick(invokeParser(req.files.inputcsv.path));
});

router.get('/autorzy', function(req, res){
	res.render('autorzy', { title: 'Autorzy'});
});

router.get('/regulamin', function(req, res){
	res.render('regulamin', { title: 'Regulamin'});
});

router.get('/kdp_lodz', function(req, res){
	res.render('kdp_lodz', { title: 'Kdp Łódź'});
});

router.get('/faq', function(req, res){
	res.render('faq', { title: 'FAQ'});
});

router.get('/kontakt', function(req, res){
	res.render('kontakt', { title: 'Kontakt'});
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

var invokeParser = function(path){
  return function() {
    process.stderr.write("DEBUG " + path + "\n");
    process.stderr.write("Invoking parser...\n");
    csvParser.parse(path);
  }
}

module.exports = router;