const pino = require("pino");
// const logger = pino().child({module: 'test'})
module.exports = function Logger(name) {
		return pino({
			level: 'debug',
			transport: {
				target: 'pino-pretty',
				options: {
					colorize: false,
					singleLine: true,
					messageKey: 'msg',
					ignore: 'pid,hostname',
				}
			}
		}).child({category: name});
}
