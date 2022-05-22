const pino = require("pino");
const pretty = require('pino-pretty')
// const logger = pino().child({module: 'test'})
module.exports = function Logger(name) {
		const prettyConfig = {
			level: 'debug',
			colorize: false,
			singleLine: true,
			messageKey: 'msg',
			ignore: 'pid,hostname',
		}
		if (process.env.NODE_ENV === 'development') {
			prettyConfig.colorize = true
			delete prettyConfig.level
		}
		return  pino(pretty(prettyConfig)).child({category: name});

}
