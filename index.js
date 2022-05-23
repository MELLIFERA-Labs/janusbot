const {Command} = require('commander');
const TOML = require('@iarna/toml') ;
const fs = require('fs');
const {
	binaryCliHandler,
	walletCliHandler,
	telegramCliHandler,
	defaultNodeCliHandler,
	feeHandler
} = require('./src/cli-handlers.js') ;
const os = require('os');
const path = require("path");
const crypto = require('./src/crypto.js');
const constant = require("./src/constant.js") ;
const createVoteBtns = require("./src/keyboard/vote.inline.js");
const startChecker = require("./src/checker.js");
const {createMessageFromProposal} = require('./src/utils.js')
const startBot = require("./src/bot.js") ;
const {Bot} = require('grammy');
const Logger = require("./src/logger.js");
const logger = Logger('cli-handlers')
const program = new Command();
const appInfo = require('./package.json')

program
	.name(appInfo.name)
	.description(appInfo.description)
	.version(appInfo.version);

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
				proposals_check_timeout: constant.DEFAULT_TIMEOUT_PROPOSAL_CHECK
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
		checker.on('error', logger.error)
		checker.on('exit', (code) => {
			if (code !== 0) {
				logger.error(`checker exit with status code: ${code}`)
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