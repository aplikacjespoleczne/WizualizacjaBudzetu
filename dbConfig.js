/* This is a MongoDb connection config file - change this data accordingly to the used database config */

var config = {}

// if (process.env.LOGNAME == 'aplikacje') {
// 	config.db_user = 'mo14248_wiz_budz',
// 	config.db_pass = 'kdpWizualizujeBudzet123',
// 	config.db_host = 'mongo0.mydevil.net',
// 	config.db_port = '27017',
// 	config.db_name = 'mo14248_wiz_budz'
// } else {
// 	config.db_user = 'mo14248_wiz_budz',
// 	config.db_pass = 'kdpWizualizujeBudzet123',
// 	config.db_host = 'localhost',
// 	config.db_port = '27017',
// 	config.db_name = 'mo14248_wiz_budz'
// }

	config.db_user = 'wiz_bud';
	config.db_pass = 'kdpWizBud123';
	config.db_host = 'localhost';
	config.db_port = '27017';
	config.db_name = 'wizBudDev';

config.MONGO = 'mongodb://' + config.db_user + ':'
                       		+ config.db_pass + '@'
                       		+ config.db_host + ':'
                       		+ config.db_port + '/'
                       		+ config.db_name;

module.exports = config;
