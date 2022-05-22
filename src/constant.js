import path from 'path'
export default {
	DEFAULT_NODE_ADDRESS:  'https://gravitychain.io:26657',
	DEFAULT_APP_FOLDER: '.janusbot',
	SECRET_FILE: '.secret',
	APP_CONFIG: 'app.toml',
	DATA_FOLDER: 'data',
	DATA_FILE: 'data.json',
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

