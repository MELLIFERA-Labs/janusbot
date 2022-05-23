const path = require('path')
module.exports =  {
	DEFAULT_NODE_ADDRESS:  'http://127.0.0.1:26657',
	DEFAULT_APP_FOLDER: '.janusbot',
	SECRET_FILE: '.secret',
	APP_CONFIG: 'app.toml',
	DATA_FOLDER: 'data',
	DATA_FILE: 'data.json',
	DEFAULT_TIMEOUT_PROPOSAL_CHECK: '5 minutes',
	get PATH_TO_SECRET_FILE() {
		return path.join(this.DEFAULT_APP_FOLDER, this.SECRET_FILE)
	},
	get DATA_FOLDER_PATH() {
		return path.join(this.DEFAULT_APP_FOLDER, this.DATA_FOLDER)
	},
	get DATA_FILE_PATH() {
		return path.join(this.DATA_FOLDER_PATH, this.DATA_FILE)
	}
};

