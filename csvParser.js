var Converter = require('csvtojson').core.Converter;
var fs = require('fs');
var async = require("async");

module.exports = function(filepath) {

  var fileStream = fs.createReadStream(filepath);
  var param = {
    "delimiter": "\;",
    "quote": "\""
  };
  var csvConverter = new Converter(param);
  var level1_hash = {};

  fileStream.pipe(csvConverter);

  var async_level3 = function(jsonObj, db, main_key, sec_key, callback) {
    process.nextTick(function(){
      var level3_hash = {};
      for (var element in jsonObj) {
        if (parseInt(jsonObj[element]['Dział - numer']) == main_key){
          if (parseInt(jsonObj[element]['Rozdział - numer']) == sec_key) {
            key = parseInt(jsonObj[element]['Zadanie - numer']);
            if (level3_hash.hasOwnProperty(key)) {
              console.log("Real shit!!!!!!!!!!!!!!!!!!!!!")
            } else {
              level3_hash[key] = parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
            }                      
          }
        }
      }
      callback(level3_hash);
    });
  };

  csvConverter.on("end_parsed", function(jsonObj) {
    
    var key;
    
    var MongoClient = require('mongodb').MongoClient, format = require('util').format;
    MongoClient.connect('mongodb://mo14248_wiz_budz:kdpWizualizujeBudzet123@mongo0.mydevil.net:27017/mo14248_wiz_budz', function(err, db) {
     
      async.series([
        function(callback){
          process.stderr.write("STEP 1\n");
          collection = db.collection("main");
          collection.remove({}, function(err, removed) {
            if (err) throw err;
            collection.insert(jsonObj, function(){
              callback(null, 1);
            });
          });        
        },
        function(callback) {
          
          process.stderr.write("STEP 2\n");

          for (var element in jsonObj) {
            //console.log(jsonObj[element]);
            key = parseInt(jsonObj[element]['Dział - numer']);
            if (level1_hash.hasOwnProperty(key)) {
              level1_hash[key] = level1_hash[key] + parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
            } else {
              level1_hash[key] = parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
            }    
          }
          console.log(level1_hash);
          collection = db.collection("null:null");
          collection.remove({}, function(err, removed) {
            if (err) throw err;
            collection.insert(level1_hash, function(err, result) {
              if (err) throw err;
              process.stderr.write("STEP 3\n");  
              callback(null, 2);
            }); 
          });
        },
        function(callback) {
          for (main_key in level1_hash) {
            var level2_hash = {};
            if (main_key != "_id" ) {
              for (var element in jsonObj) {
                if (parseInt(jsonObj[element]['Dział - numer']) == main_key){
                  key = parseInt(jsonObj[element]['Rozdział - numer']);
                  if (level2_hash.hasOwnProperty(key)) {
                    level2_hash[key] = level2_hash[key] + parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
                  } else {
                    level2_hash[key] = parseInt((jsonObj[element]['Kwota [PLN]']).replace(/\s+/g,''));
                  }
                }
              }
              name = main_key + ":null";
              console.log(main_key + " ----------------------");
              console.log(level2_hash);
              collection = db.collection(name);
              collection.insert(level2_hash, function(err, result) {
                if (err) throw err;
              });
              for (var l2_key in level2_hash){
                async_level3(jsonObj, db, main_key, l2_key, function(level3_hash){
                  
                  name = main_key + ":" + l2_key;
                  console.log(main_key + " - " + l2_key);
                  console.log(level3_hash);
                  collection = db.collection(name);
                  collection.insert(level3_hash, function(err, result) {
                    if (err) throw err;
                  }); 
                });
              }                     
            }
          }
          callback(null, 3);
          console.log("DONE!");
        }
      ], function(error, results) {
        console.log(results); 
      });  
      
      /*
      console.log(level1_hash); 
      for (key in level1_hash) {
        get_level2(jsonObj, key);
      }
      */
    }); 
  });
}

/*  
Seems not needed but let's wait a while to see 
function get_level3(main_hash, lev1_num, lev2_num) {

  var level3_hash = {};

  for (var element in main_hash) {
    if (parseInt(main_hash[element]['Dzial - numer']) == lev1_num){
      if (parseInt(main_hash[element]['Rozdzial - numer']) == lev2_num){
        key = parseInt(main_hash[element]['Zadanie - numer']);
        if (level3_hash.hasOwnProperty(key)) {
          level3_hash[key] = level3_hash[key] + parseInt((main_hash[element]['Kwota [PLN]']).replace(' ',''));
        } else {
          level3_hash[key] = parseInt((main_hash[element]['Kwota [PLN]']).replace(' ',''));
        }
      }
    }
  }
  console.log(lev1_num, ' ', lev2_num);
  console.log('-----------------------------------------------------------------------------');
  console.log(level3_hash);
  console.log('-----------------------------------------------------------------------------');
}

*/
