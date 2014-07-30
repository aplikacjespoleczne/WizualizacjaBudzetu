AmountProvider = function() {
};

AmountProvider.prototype.find = function(first, second, callback) {
	var MongoClient = require('mongodb').MongoClient, format = require('util').format;
	MongoClient.connect('mongodb://mo14248_wiz_budz:kdpWizualizujeBudzet123@mongo0.mydevil.net:27017/mo14248_wiz_budz', function(err, db) {
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

exports.AmountProvider = AmountProvider;
