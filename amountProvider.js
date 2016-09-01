AmountProvider = function() {
};

AmountProvider.prototype.find = function(first, second, callback) {
	var MongoClient = require('mongodb').MongoClient, format = require('util').format;
	var config = require('./config');
	//We don't use external database for now so we connect to localhost
	// MongoClient.connect('mongodb://mo14248_wiz_budz:kdpWizualizujeBudzet123@mongo0.mydevil.net:27017/mo14248_wiz_budz', function(err, db) {
	MongoClient.connect(config.MONGO, function(err, db) {
		if (err) {
			console.log(err);
			return;
		}

		var collectionName;
		if (first == null) {
			collectionName = "null:null";
		} else if (second == null) {
			collectionName = first + ":null";
		} else {
			collectionName = first + ":" + second;
		}
		collection = db.collection(collectionName);

		collection.find({}).toArray(function(err, results) {
			if (err) {
				callback(err);
			}

			callback(null, results);
		});
	});
}

AmountProvider.prototype.findTest = function(callback) {

	var MongoClient = require('mongodb').MongoClient, format = require('util').format;
	//We don't use external database for now so we connect to localhost
	// MongoClient.connect('mongodb://mo14248_wiz_budz:kdpWizualizujeBudzet123@mongo0.mydevil.net:27017/mo14248_wiz_budz', function(err, db) {
	MongoClient.connect(config.MONGO, function(err, db) {
		if (err) throw err;
		var collectionName = 'test';
		collection = db.collection(collectionName);
	/*
collection.insert({"key": "103", "value":10}, function(err, records){
  console.log("Record added as "+records[0]._id);
});
collection.insert({"key": "104", "value":40}, function(err, records){
  console.log("Record added as "+records[0]._id);
});
collection.insert({"key": "105", "value":60}, function(err, records){
  console.log("Record added as "+records[0]._id);
});
collection.insert({"key": "106", "value":45}, function(err, records){
  console.log("Record added as "+records[0]._id);
});
collection.insert({"key": "107", "value":90}, function(err, records){
  console.log("Record added as "+records[0]._id);
});

*/
		collection.find({}).toArray(function(err, results) {
			if (err) {
				callback(err);
			}

			callback(null, results);
		});
	});

}

exports.AmountProvider = AmountProvider;
