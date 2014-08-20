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
router.get('/admin', function(req, res){
  //console.log(config.MONGO);
  var html = '<form method="post" enctype="multipart/form-data" action="/admin">'+
      '<label for="username"><span>login</span><input type="text" name="username" id="username"></label><br/>'+
      '<label for="password"><span>hasło</span><input type="password" name="password" id="password"></label><br/><br/>'+
      '<input type="submit" value="KLIK">'+
      '</form>';
               
  res.send(html);
});

router.post('/admin', function(req, res) {

  MongoClient.connect(config.MONGO, function(error, db) {
    if (error) {
      res.send("<div>Wystąpił błąd serwera. Spróbuj póżniej.</div><div><a href='/admin'>powrót</a></div>");
    }

    users = db.collection("users");
    users.find().toArray(function(error, admin_data){

      if ((req.body.username != admin_data[0]["user"]) || (req.body.password != admin_data[0]["password"])) {
        res.send("<div>Wprowadzono błędne dane.</div><div><a href='/admin'>powrót</a></div>");
      } else {
        var html = '<form method="post" enctype="multipart/form-data" action="/admin/file-upload">'+
                   '<label for="inputcsv"><span>wprowadź plik</span><input type="file" name="inputcsv" id="inputcsv"></label><br/><br/>'+
                  '<input type="submit" value="KLIK">'+
               '</form>';
          
        res.send(html);
      }    
    });
  });
});

router.post('/admin/file-upload', function(req, res) {
  
  //var filepath = "/usr/home/aplikacje/domains/test.aplikacje.mydevil.net/public_nodejs/";
  //var filepath = "/usr/home/aplikacje/domains/test.aplikacje.mydevil.net/public_nodejs/" + req.files.inputxml.path;
  //name = "" || ;

  res.send("<div>Poprawnie zuploadowano plik</div><div><a href='/admin'>powrót</a></div>");
  process.stderr.write("DEBUG Invoking callback function\n");
  process.nextTick(invokeParser(req.files.inputcsv.path));
});

//////obsluga wykresow
router.get('/', function(req, res) {
  var html = '<form method="post" action="/chart">'+
      '<label for="first"><span>dział</span><input type="text" name="first" id="first"></label><br/>'+
      '<label for="second"><span>rozdział</span><input type="text" name="second" id="second"></label><br/><br/>'+
      '<input type="submit" value="Pokaż wykres">'+
      '</form>';
               
  res.send(html);
});

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