const pino = require("pino");
// const logger = pino().child({module: 'test'})
module.exports = function Logger(name) {
	if (process.env.NODE_ENV === 'development')
		return pino({
			transport: {
				target: 'pino-pretty',
				options: {
					colorize: true
				}
			}
		}).child({category: name});
	return pino({level: 'debug'}).child({category: name});
}
