var Converter = require('csvtojson').core.Converter;
var fs = require('fs');
var async = require("async");
var config = require('./config');
var MongoClient = require('mongodb').MongoClient, format = require('util').format;

var parse = function(filepath) {

  var fileStream = fs.createReadStream(filepath);
  var param = {
    "delimiter": "\;",
    "quote": "\""
  };
  var csvConverter = new Converter(param);
  var level1_hash = {};

  fileStream.pipe(csvConverter);
  
  csvConverter.on("end_parsed", function(jsonObj) {
    
    var key;
    
    MongoClient.connect(config.MONGO, function(err, db) {
     
      async.series([
        function(callback){
          cleanDB(function(){
            callback(null, 1);
          });
        },
        function(callback){
          process.stderr.write("Injecting pure data into database..........");
          collection = db.collection("main");
          collection.insert(jsonObj, function(){
            process.stderr.write("done\n");
            callback(null, 2);
          });        
        },
        function(callback){
          process.stderr.write("Creating 1st level of structure..........");
          createStructureLevel1(jsonObj, function(result_hash){
            level1_hash = result_hash;
            injectDatabase(db, "null:null", level1_hash);
            process.stderr.write("done\n");
            callback(null, 3);            
          });
        },
        function(callback) {
          process.stderr.write("Creating 2nd and 3rd level of structure..........");
          for (main_key in level1_hash) {
            if (main_key != "_id" ) {
              key1 = main_key;
              process.nextTick(createStructureLevel2(jsonObj, key1, function(result_hash, key1){
                name = key1 + ":null";
                injectDatabase(db, name, result_hash);               
                level2_hash = result_hash;
                for (var l2_key in level2_hash){
                  if (l2_key != "_id" ){ 
                    key2 = l2_key;
                    process.nextTick(createStructureLevel3(jsonObj, key1, key2, function(result_hash, key1, key2){
                      name = key1 + ":" + key2;
                      injectDatabase(db, name, result_hash);               
                    }));
                  }
                }                  
              }));
            }
          }
          process.stderr.write("done\n");
          callback(null, 4); 
        },
        function(callback) {
          process.stderr.write("Creating search structure..........");
          createSearchStructure(jsonObj, function(result_hash){
            level0_hash = result_hash;
            injectDatabase(db, "search", level0_hash);
            process.stderr.write("done\n");
            callback(null, 5);            
          });      
        },       
        function(callback) {
          process.stderr.write("Indexing text fields in the main collection of DB...");
          collection = db.collection("main");
          collection.ensureIndex({
            "Zadanie - nazwa": "text",
            "Opis zadania": "text"
          }, function(){
            process.stderr.write("done\n");
            callback(null, 8);
          });
        },
        function(callback) {
          process.stderr.write("Indexing text fields in search collection of DB...");
          collection = db.collection("search");
          collection.ensureIndex({
            "id": "text",
          }, function(){
            process.stderr.write("done\n");
            callback(null, 9);
          });
        }    
      ], function(error, results) {
        process.stderr.write("Creating of structure finished.\n"); 
      });  
    }); 
  });
}

var createSearchStructure = function(jsonObj, callback) {
  var result_hash = {};
  for (var element in jsonObj) {
    key = jsonObj[element]['Wydział'];
    if (result_hash.hasOwnProperty(key)) {
      result_hash[key]["value"] = result_hash[key]["value"] + parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
    } else {
      result_hash[key] = {
        "id": key,
        "type" : "Nazwa wydziału",
        "value" : parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''))
      }
    }
    key = jsonObj[element]["Dział - nazwa"];
    if (result_hash.hasOwnProperty(key)) {
      result_hash[key]["value"] = result_hash[key]["value"] + parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
    } else {
      result_hash[key] = {
        "id": key,
        "type" : "Nazwa działu",
        "value" : parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,'')),
        "department" : jsonObj[element]["Wydział"]
      }
    }
    key = jsonObj[element]["Rozdział - nazwa"];
    if (result_hash.hasOwnProperty(key)) {
      result_hash[key]["value"] = result_hash[key]["value"] + parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
    } else {
      result_hash[key] = {
        "id": key,
        "type" : "Nazwa rodziału",
        "value" : parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,'')),
        "department" : jsonObj[element]["Wydział"],
        "division" : jsonObj[element]["Dział"]
      }
    }
  }
  callback(result_hash);
}

var createStructureLevel1 = function(jsonObj, callback) {
  var result_hash = {};
  for (var element in jsonObj) {
    key = parseInt(jsonObj[element]['Dział - numer']);
    if (result_hash.hasOwnProperty(key)) {
      result_hash[key]["value"] = result_hash[key]["value"] + parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
    } else {
      result_hash[key] = {
        "id": key,
        "value" : parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,'')),
        "description" : jsonObj[element]["Dział - nazwa"]
      }
    }
  }
  callback(result_hash);
}

var createStructureLevel2 = function(jsonObj, main_key, callback){
  return function() {
    var result_hash = {};
    for (var element in jsonObj) {
      if (parseInt(jsonObj[element]['Dział - numer']) == main_key){
        key = parseInt(jsonObj[element]['Rozdział - numer']);
        if (result_hash.hasOwnProperty(key)) {
          result_hash[key]["value"] = result_hash[key]["value"] + parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
        } else {
          result_hash[key] = {
            "id": key,
            "value" : parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,'')),
            "description" : jsonObj[element]["Rozdział - nazwa"]
          }
        }
      }
    }
    callback(result_hash, main_key);
  }
}

var createStructureLevel3 = function(jsonObj, main_key, sec_key, callback) {
  return function() {
    var result_hash = {};
    for (var element in jsonObj) {
      if (parseInt(jsonObj[element]['Dział - numer']) == main_key){
        if (parseInt(jsonObj[element]['Rozdział - numer']) == sec_key) {
          key = parseInt(jsonObj[element]['Zadanie - numer']);
          result_hash[key] = {
            "id": key,
            "value" : parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,'')),
            "description" : jsonObj[element]["Zadanie - nazwa"]
          }          
        }
      }
    }
    callback(result_hash, main_key, sec_key);
  }
}

var cleanDB = function(callback) {
  process.stderr.write("Cleaning data base...........");
  MongoClient.connect(config.MONGO, function(err, db) {
    db.collectionNames(function(err, collections) {
      collections.forEach(function(c){
        var name = c.name.substring(config.DBNAME.length + 1);
        if (name != "users") {
          db.dropCollection(name);
        }
      });
      process.stderr.write("done\n");
      callback();
    });
  });
}

var injectDatabase = function(db, name, hash) {
  collection = db.collection(name);
  for (var key in hash) {
    collection.insert(hash[key], function(err, result) {
      if (err) throw err;
    });
  }
}

exports.parse = parse;