import { Bot } from 'grammy'
import createVoteBtns from "./keyboard/vote.inline.js";
import {execFileSync} from 'node:child_process'
import {decrypter} from "./crypto.js";
import path from "path";
import constant from "./constant.js";
import os from "os";
import fs from "fs";
import Logger from "./logger.js";
const logger = Logger('bot')
export default async function startBot(config) {
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