var Converter = require('csvtojson').core.Converter;
var fs = require('fs');

exports.parseCSVFile = function(filepath) {

  var fileStream = fs.createReadStream(filepath);
  var param = {
    "quote": "\""
  };
  var csvConverter = new Converter(param);
  var level1_hash = {};

  fileStream.pipe(csvConverter);

  csvConverter.on("end_parsed", function(jsonObj) {
    var key;

    var MongoClient = require('mongodb').MongoClient, format = require('util').format;
    MongoClient.connect('mongodb://mo14248_wiz_budz:kdpWizualizujeBudzet123@mongo0.mydevil.net:27017/mo14248_wiz_budz', function(err, db) {
         
      var collection = db.collection("main");
      collection.remove({}, function(err, removed) {
        collection.insert(jsonObj, function(err, result) {
          if (err) throw err;
          db.close();
        });
      });
      
      for (var element in jsonObj) {
        console.log(jsonObj[element]);
        key = parseInt(jsonObj[element]['Dzial - numer']);
       
        if (level1_hash.hasOwnProperty(key)) {
          level1_hash[key] = level1_hash[key] + parseInt((jsonObj[element]['Kwota [PLN]']).replace(' ',''));
        } else {
          level1_hash[key] = parseInt((jsonObj[element]['Kwota [PLN]']).replace(' ',''));
        }    
      }

      collection = db.collection("null:null");
      collection.insert(level1_hash, function(err, result) {
        if (err) throw err;
        db.close();
      });  

    /*
      console.log(level1_hash); 
      for (key in level1_hash) {
        get_level2(jsonObj, key);
      }
    */
      for (main_key in level1_hash) {
        for (var element in jsonObj) {
          if (parseInt(jsonObj[element]['Dzial - numer']) == main_key){
            key = parseInt(main_hash[element]['Rozdzial - numer']);
            if (level2_hash.hasOwnProperty(key)) {
              level2_hash[key] = level2_hash[key] + parseInt((main_hash[element]['Kwota [PLN]']).replace(' ',''));
            } else {
              level2_hash[key] = parseInt((main_hash[element]['Kwota [PLN]']).replace(' ',''));
            }
          }
        }
        name = key + ":null";
        collection = db.collection(name);
        collection.insert(level1_hash, function(err, result) {
          if (err) throw err;
          db.close();
        }); 
      }
      db.close();
    });
  });
}

/* Seems not needed but let's wait a while to see 
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