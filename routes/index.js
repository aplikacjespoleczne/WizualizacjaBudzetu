var express = require('express');
var async = require("async");
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

router.get('/query', function(req, res){
  //console.log(req);
  console.log(req.query.query);
  //res.render('search', {query: req.query.query});
  res.json({value:"kasza"});
});

router.post('/search', function(req, res){
  console.log(req.body.query);
  var search_results = [];
  MongoClient.connect(config.MONGO, function(error, db) {
    if (error) {
      res.render('admin/error',{message: 'Wystąpił błąd serwera. Spróbuj póżniej.'});
      return; 
    }
    async.series([
      function(callback){
        main = db.collection("main");
        main.find({$text: {$search: req.body.query }}).toArray(function(error, data){
          data.map(function(element){
            var index = element["Opis zadania"].indexOf(req.body.query);
            if ( index != -1 ) {
              element["id"] = element["Opis zadania"].substr(index).split(' ').slice(0,4).join(' ');
              element["value"] = element['Kwota [PLN]'];
              element["type"] = "Opis zadania";
            }
            else
            {
              element["type"] = "Nazwa zadania";
            }
            search_results.push(element);
          });
          callback(null,1);
        });
      },
      function(callback){
        search = db.collection("search");
        search.find({$text: {$search: req.body.query }}).toArray(function(error, data){
          data.map(function(element){
            search_results.push(element);
          });
          callback(null,2);    
        });        
      },
    ], function(error, results){
      console.log(search_results);
      res.render('search', {
        data: search_results, 
        query: req.body.query
      }); 
    });
  });
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

///obsluga wykresow
/*
router.get('/', function(req, res) {
  var html = '<form method="post" action="/chart">'+
      '<label for="first"><span>dział</span><input type="text" name="first" id="first"></label><br/>'+
      '<label for="second"><span>rozdział</span><input type="text" name="second" id="second"></label><br/><br/>'+
      '<input type="submit" value="Pokaż wykres">'+
      '</form>';
               
  res.send(html);
});
*/

router.post('/chart', function(req, res) {
  var first = req.body.first;
  var second = req.body.second;
  if (first == '') {
    first = null;
  }
  if (second == '') {
    second = null;
  }
  
  var htmlStructure =
    '<html>'+
      '<head><title>wykres</title></head>'+
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
    
    amountProvider.find(first, second, function(error, results) {
      
      if (error) throw error;
      
      if (results.length == 0) {
        res.send('<div><span>Nie znaleziono wpisów w bazie danych</span></div>'+
                 '<div><a href="/">Wróć i spróbuj ponownie</a></div>');
      }
      
      var highestResult = 0;
      var resultsCount = 0;
      var maxHeight = 800;
      var divide = 1;

      var items = Object.keys(results);
      items.forEach(function(item) {
        resultsCount = resultsCount + 1;
        if ((results[item].value) > highestResult) {
          highestResult = results[item].value;
          divide = (results[item].value) / maxHeight;
        }       
      });

      var canvas = d3.select(el)
              .append('svg:svg')
                .attr('width', resultsCount * 60)
                .attr('height', maxHeight + 100);
    
      var bars = canvas.selectAll("rect")
            .data(results)
            .enter()
              .append("rect")
                .attr("width", 50)
                .attr("height", function(d) { return d.value / divide;})
                .attr("x", function(d, i) { return i * 60;})
                .attr("y", function(d, i) { return maxHeight - d.value / divide;});
       
      var labels = canvas.selectAll("text")
          .data(results)
          .enter()
          .append("text");

      var textElements = labels
          .attr("x", function(d, i) { return i * 60;})
          .attr("y", function(d, i) { return maxHeight + 30;})
          .attr("font-family", "Arial Black")
          .attr("font-size", "10px")
          .attr("fill", "red")
          .append('svg:tspan')
          .attr("x", function(d, i) { return i * 60;})
          .attr("y", function(d, i) { return maxHeight + 30;})
          .text(function(d) { return d.id; })
          .append('svg:tspan')
          .attr("x", function(d, i) { return i * 60;})
          .attr("y", function(d, i) { return maxHeight + 50;})
          .attr("fill", "blue")
          .text(function(d) { return d.value; });    
     
      res.send(window.document.innerHTML);        
    });
  }});
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

router.get('/chart-test2', function(req, res) {
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