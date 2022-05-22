const { Bot } = require('grammy')
const createVoteBtns = require("./keyboard/vote.inline.js");
const {execFileSync} = require('node:child_process')
const {decrypter} = require("./crypto.js") ;
const path = require("path") ;
const constant = require("./constant.js");
const os = require("os") ;
const fs = require("fs");
const Logger = require("./logger.js");
const logger = Logger('bot')

module.exports =  async function startBot(config) {
	const bot = new Bot(config.bot.telegram_bot)
	const key = fs.readFileSync(path.join(os.homedir(), constant.PATH_TO_SECRET_FILE), 'utf-8')
	bot.on("callback_query:data", async (ctx) => {
		const [id, type] = ctx.callbackQuery.data.split(':');
		const feeParams = config.cosmos.fees === 'auto' ? ['--gas', 'auto'] : ['--fees', config.fees]
		execFileSync(config.cosmos.cosmos_binary,
			[
				'tx',
				'gov',
				'vote',
				id,
				type,
				'--from',
				config.cosmos.wallet,
				'--chain-id',
				config.cosmos.chain_id,
				...feeParams,
				'--node',
				config.cosmos.node_address,
				'--yes'
			], {input: decrypter(config.cosmos.keyring_passphrase, key) + '\n'})
		await ctx.api.editMessageReplyMarkup(
			ctx.msg.chat.id,
			ctx.update.callback_query.message.message_id,
			{
				reply_markup: createVoteBtns(id, type),
				parse_mode: 'Markdown',
			}
		);
		logger.info(`success proposal vote: ${id}, type: ${type}`, );
		await ctx.answerCallbackQuery('Success');
	});
	bot.catch(async err => {
		const ctx = err.ctx;
		logger.error(err);
		await ctx.api.sendMessage(ctx.msg.chat.id, 'Something went wrong, please check logs')
	})
	await bot.start();
}