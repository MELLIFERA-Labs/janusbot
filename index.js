import {Command} from 'commander';
import TOML from '@iarna/toml';
import fs from 'fs';
import {
	binaryCliHandler,
	walletCliHandler,
	telegramCliHandler,
	defaultNodeCliHandler,
	feeHandler
} from './src/cli-handlers.js';
import os from 'os';
import path from "path";
import * as crypto from './src/crypto.js';
import constant from "./src/constant.js";
import createVoteBtns from "./src/keyboard/vote.inline.js";
import {startChecker} from "./src/checker.js";
import {createMessageFromProposal} from './src/utils.js'
import startBot from "./src/bot.js";
import {Bot} from 'grammy';
import Logger from "./src/logger.js";
const logger = Logger('cli-handlers')
const program = new Command();

program
	.name('janusbot')
	.description('Bot for easy vote as a validator')
	.version('0.0.1');

program.command('init')
	.description('Initialize application configuration files')
	.action(async (str, options) => {
		const homeDir = os.homedir();
		const appFolder = path.join(homeDir, constant.DEFAULT_APP_FOLDER);
		if (!fs.existsSync(appFolder)) {
			fs.mkdirSync(appFolder);
		}

		const secret = (() => {
			const secretFile = path.join(appFolder, constant.SECRET_FILE);
			if (!fs.existsSync(secretFile)) {
				const secret = crypto.createRandomSecret();
				fs.writeFileSync(secretFile, secret);
				return secret;
			}
			return fs.readFileSync(secretFile, 'utf-8');
		})();

		const binaryAnswer = await binaryCliHandler();
		const telegramAnswer = await telegramCliHandler();
		const walletAnswers = await walletCliHandler(binaryAnswer.binary);
		const nodeNetworkAnswer = await defaultNodeCliHandler();
		const feesData = await feeHandler();
		const tomlConfig = TOML.stringify({
			bot: {
				telegram_bot: telegramAnswer['telegram_token'],
				telegram_chat_id: telegramAnswer['telegram_chat_id'],
				proposals_check_timeout: '15 minutes'
			},
			cosmos: {
				cosmos_binary: binaryAnswer.binary,
				keyring_passphrase: crypto.encrypter(walletAnswers['keyring_pass'], secret),
				chain_id: nodeNetworkAnswer.chainId,
				wallet: walletAnswers.wallet,
				node_address: nodeNetworkAnswer.nodeAddress,
				fees: feesData.type === 'autoFee' ? feesData.value : feesData.value
			}
		});
		if (!fs.existsSync(path.join(homeDir,constant.DATA_FOLDER_PATH))) {
			fs.mkdirSync(path.join(homeDir,constant.DATA_FOLDER_PATH))
		}
		fs.writeFileSync(path.join(homeDir,constant.DATA_FILE_PATH), JSON.stringify({last_notified_proposal_id: 0}))
		fs.writeFileSync(path.join(appFolder, constant.APP_CONFIG), tomlConfig);
	});

program.command('start')
	.description('Start janus bot')
	.action(async (str, options) => {
		const homeDir = os.homedir();
		const appFile = path.join(homeDir, constant.DEFAULT_APP_FOLDER, constant.APP_CONFIG);
		if (!fs.existsSync(appFile)) {
			return console.log("Please, call `init` first");
		}
		const appConfig = TOML.parse(fs.readFileSync(appFile, 'utf-8'));
		const checker = startChecker(appConfig);
		checker.on('exit', (code) => {
			if (code !== 0) {
				console.error(code)
			}
			process.exit(0)
		});
		await startBot(appConfig)
		logger.info('bot started');

	});

program.command('dry-run')
	.description('Test janus run')
	.action(async () => {
		const homeDir = os.homedir();
		const appFile = path.join(homeDir, constant.DEFAULT_APP_FOLDER, constant.APP_CONFIG);
		if (!fs.existsSync(appFile)) {
			console.log("Please, call `init` first");
		}
		const appConfig = TOML.parse(fs.readFileSync(appFile, 'utf-8'));
		const bot = new Bot(appConfig.bot.telegram_bot);

		await bot.api.sendMessage(appConfig.bot.telegram_chat_id, createMessageFromProposal(
			{
				id: 0,
				title: 'test title',
				description: 'test description',
				startTime: '2022-05-18',
				endTime: '2022-05-18'
			}
		), {
			parse_mode: 'Markdown',
			reply_markup: createVoteBtns(0),
		});
		bot.on("callback_query:data", async (ctx) => {
			const [id, type] = ctx.callbackQuery.data.split(':');

			const actions = ['yes', 'no', 'abstain', 'no_with_veto'];
			if (!actions.includes(type)) throw 'Error';
			await ctx.api.editMessageReplyMarkup(
				ctx.msg.chat.id,
				ctx.update.callback_query.message.message_id,
				{
					reply_markup: createVoteBtns(id, type),
					parse_mode: 'Markdown',
				}
			);
			await ctx.answerCallbackQuery('Success');
			console.info('Dry run success!');
			await bot.stop();
			return process.exit(0);
		});

		await bot.start();


	});
program.parse();