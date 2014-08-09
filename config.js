var config = {}

if (process.env.LOGNAME == 'aplikacje') {
	config.db_user = 'mo14248_wiz_budz',
	config.db_pass = 'kdpWizualizujeBudzet123',
	config.db_host = 'mongo0.mydevil.net',
	config.db_port = '27017'
} else {
	config.db_user = 'mo14248_wiz_budz',
	config.db_pass = 'kdpWizualizujeBudzet123',	
	config.db_host = 'localhost',
	config.db_port = '27017'
}

config.DBNAME = 'mo14248_wiz_budz';

config.MONGO = 'mongodb://' + config.db_user + ':' 
                       		+ config.db_pass + '@' 
                       		+ config.db_host + ':' 
                       		+ config.db_port + '/'
                       		+ config.DBNAME;

module.exports = config;