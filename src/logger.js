import pino from "pino";
// const logger = pino().child({module: 'test'})
export default function Logger(name) {
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
