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
var ObjectID = require('mongodb').ObjectID;

var limit = 12;

/* GET home page. */
router.get('/', function(req, res){
	res.render('index');
});

router.get('/query', function(req, res){
  //console.log(req);
  console.log(req.query.query);
  //res.render('search', {query: req.query.query});
  var search_results = [];
  MongoClient.connect(config.MONGO, function(error, db) {
    if (error) {
      res.json({value:""});
      return; 
    }
    main = db.collection("main");
    console.log('BBBB');
    main.find({$text: {$search: "\"" + req.query.query + "\"" }}).toArray(function(error, data){
      if (error) {
        console.log(error);
      }
      if (data) {
        search_results = prepare_typeaheads(data, req.query.query);
      }
      console.log(search_results);
      res.json(search_results);
    });
  });
});

router.get('/search', function(req, res){
  var search_results = [];
  MongoClient.connect(config.MONGO, function(error, db) {
    if (error) {
      res.render('admin/error',{message: 'Wystąpił błąd serwera. Spróbuj póżniej.'});
      return; 
    }
    main = db.collection("main");
    main.find({$text: {$search: "\"" + req.query.query + "\"" }}).toArray(function(error, data){
      if (error) {
        console.log(error);
      }
      if (data) {
        var number_of_results = countArraySize(data);
        search_results = prepare_search_results(data.splice(0,limit), req.query.query);
      }
      var result = pagination(1, number_of_results);
      res.render('search', {
        data: search_results, 
        query: req.query.query,
        total: result["total"],
        start: 1,
        page: 1,
        prev: result["prev"],
        next: result["next"]
      });
    });
  });
});

router.post('/search', function(req, res){
  res.redirect('/search?query=' + req.body.query);
});

router.get('/search/pages/:page', function(req, res){
  var search_results = [];
  var page = parseInt(req.params.page);
  MongoClient.connect(config.MONGO, function(error, db) {
    if (error) {
      res.render('error',{message: 'Wystąpił błąd serwera. Spróbuj póżniej.'});
      return; 
    }
    main = db.collection("main");
    main.find({$text: {$search: "\"" + req.query.query + "\"" }}).toArray(function(error, data){
      if (error) {
        console.log(error);
      }
      if (data) {
        var number_of_results = countArraySize(data);
        search_results = prepare_search_results(data.splice(((page-1)*limit),limit), req.query.query);
      }
      var result = pagination(page, number_of_results);
      res.render('search', {
        data: search_results, 
        query: req.query.query,
        total: result["total"],
        start: ((page-1)*limit)+1,
        page: page,
        prev: result["prev"],
        next: result["next"]
      });
    });
  });
});

router.get('/task/:task', function(req, res){
  var object = ObjectID.createFromHexString(req.params.task);
  MongoClient.connect(config.MONGO, function(error, db) {
    if (error) {
      res.render('error',{message: 'Wystąpił błąd serwera. Spróbuj póżniej.'});
      return; 
    }
    main = db.collection("main");
    main.find({'_id': object}).toArray(function(error, data){
      if (error) {
        console.log(error);
      }
      var task = {}
      task = prepare_task(data[0]);
      res.render('task', {
        task: task
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

var prepare_typeaheads = function(data, query) {
  var search_results = [];
  data.map(function(element){
    if (element['type'] == 'task') {
      var index = element["search_task_name"].indexOf(query);
      if ( index != -1 ) {   
        search_results.push({value: element["search_task_name"]});
      }
    }
    else {
      search_results.push({value: element['search_id']});
    }
  });
  return search_results;
}

var prepare_task = function(data) {
  task = {};
  if (data.type == 'task') {
    task.type = 'Nazwa zadania';
    task.name = data['Zadanie - nazwa'];
    task.value = data['Kwota [PLN]'];
    task.description = data['Opis zadania'];
    task.department = data['Wydział'];
    task.division = data['Dział - nazwa'];
    task.chapter = data['Rozdział - nazwa'];
    task.class = data['Typ'];
    task.part = data['Część'];
  }
  else {
    task.type = data.type;
    task.name = data['search_id'];
    task.value = data['value'];
  }
  return task;
}

var prepare_search_results = function(data, query) {
  var search_results = [];
  data.map(function(element){
    var row = {};
    if (element["type"] == "task") {
      var index = element["search_task_description"].indexOf(query);
      if ( index != -1 ) {
        row.text = element["search_task_description"].substr(index).split(' ').slice(0,4).join(' ');
        row.value = element['Kwota [PLN]'];
        row.type = "Opis zadania";           
        row.id = element._id;
      }
      else
      {
        row.text = element['Zadanie - nazwa'];
        row.value = element['Kwota [PLN]'];
        row.type = "Nazwa zadania";  
        row.id = element._id;
      }
    } else {
      row.text = element['search_id'];
      row.value = element['value'];
      row.id = element._id;
      if (element['type'] == "department") {
        row.type = "Wydział";             
      } else if (element['type'] == "division") {
        row.type = "Dział";
      } else {
        row.type = "Rozdział";
      }

    }
    search_results.push(row);
  });
  return search_results;
}

var pagination = function(page, numOfElements) {
  var num = page * limit;
  var result = {};
  result.total = numOfElements;
  result.pages = Math.ceil(numOfElements / limit);
  if (num < numOfElements) result.prev = true;
  if (num > limit) result.next = true;
  return result;
}

var countArraySize = function(object) {
  var result = 0;
  for (var property in object) {
    if (object.hasOwnProperty(property)) {
      result++;
    }
  }
  return result;
}

module.exports = router;