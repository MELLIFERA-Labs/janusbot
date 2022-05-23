const prompt = require("prompts");
const ora = require("ora");
const {execFileSync} = require("node:child_process");
const { processValidate } = require('./utils.js')
const constant = require('./constant.js')
const axios = require('axios').default;
const {Bot} = require("grammy") ;

async function binaryCliHandler() {
	return  processValidate(() => prompt({
		type: 'text',
		name: 'binary',
		message: 'Enter cosmos binary path (which appd)',
		validate: value => value.length === 0 ? `empty` : true
	}, {onCancel: () => process.exit(0)}), async function (answers) {
		const spinner = ora('Check Binary').start();
		try {
			spinner.start()
			execFileSync(answers.binary, ['keys', 'show', '--help'])
			spinner.succeed("Binary detected")
			return true
		}catch {
			spinner.fail("Can't find cosmos binary, please make sure that PATH is correct")
			return false
		}
	});
}

async function telegramCliHandler() {
	const telegramQuestions = [
		{
			type: 'text',
			name: 'telegram_token',
			message: 'Enter telegram bot token:',
			validate: value => value.length === 0 ? `empty` : true
		},
		{
			type: 'text',
			name: 'telegram_chat_id',
			message: 'Enter telegram chat id:',
			validate: value => value.length === 0 ? `empty` : true
		},
	]
	return  processValidate(() => prompt(telegramQuestions, {onCancel: () => process.exit(0)}), async function (answers) {
		const spinner = ora('Check telegram').start();
		try {
			spinner.start()
			const bot = new Bot(answers['telegram_token']);
			await bot.api.sendMessage(answers['telegram_chat_id'], 'Telegram attached successfully');
			spinner.succeed("Telegram attached successfully to JANUSBOT");
			return true
		} catch(e) {
			spinner.fail("Error to connect bot, please try again")
			return false
		}
	})
}

async function walletCliHandler(binary) {
	const walletQuestions = [{
		type: 'text',
		name: 'wallet',
		message: 'Enter wallet name or address:',
	},
	{
		type: 'invisible',
		name: 'keyring_pass',
		message: 'Enter password'
	}]

	return processValidate(() => prompt(walletQuestions, {onCancel: () => process.exit(0)}), async function (answers) {
		const spinner = ora('Check wallet').start();
		try {
			const walletSTD = execFileSync(binary,  ['keys', 'show', answers.wallet, '--output', 'json'], { input: answers['keyring_pass'] + '\n', stdio: ["pipe", "pipe", "pipe"]}).toString()
			spinner.succeed('Wallet attached successfully')
			const wallet = JSON.parse(walletSTD);
			return answers.wallet === wallet.name || answers.wallet === wallet.address;

		}catch(e) {
			spinner.fail(`can\'t find wallet [${answers.wallet}] or invalid password, try again`)
			return false
		}
	})
}
async function feeHandler() {

	const feeTypeQst = {
		type: 'select',
		name: 'feeType',
		message: 'Pick a fee type',
		choices: [
			{ title: 'Gas auto', description: 'Trx fee will be calculated automatically', value: 'auto' },
			{ title: 'Static fee', description: 'You need to enter static transaction fee (e.g 1uatom )', value: 'staticFee' },
		],
		initial: 1
	}

	const feeQuestion = {
		type: 'text',
		name: 'fees',
		message: 'Enter minimal fee for tx vote',
	}
	const typeAnswer = await prompt(feeTypeQst, {onCancel: () => process.exit(0) })
	if(typeAnswer.feeType === 'staticFee') {
		const feeAnswer = await prompt(feeQuestion, {onCancel: () => process.exit(0) })
		return {
			type: 'staticFee',
			value: feeAnswer.fees
		}
	}

	return {
		type: 'autoFee',
		value: 'auto'
	}
}
async function defaultNodeCliHandler() {
	const nodeDefaultQuestion = {
		type: 'toggle',
		name: 'default_node',
		message: 'Use default node address http://127.0.0.1:26657?',
		initial: true,
		active: 'yes',
		inactive: 'no'
	}
	const customNodeAddressQuestions = {
		type: 'text',
		name: 'custom_node',
		message: 'Enter uri of node:'
	}

	const nodeDefaultAnswer = await prompt(nodeDefaultQuestion);
	if(!nodeDefaultAnswer['default_node']) {
		  let chainId = null
			const customNodeAddressAnswers = await processValidate(() => prompt(customNodeAddressQuestions, {onCancel: () => process.exit(0)}), async (answer) => {
				const spinner = ora('Check node').start()
				try {
					const networkData = await axios.get(`${answer['custom_node']}/status`);
					chainId = networkData.data.result['node_info'].network;
					spinner.succeed('Network set successfully')
					return true
				}catch (e) {
					spinner.fail('can\'t find node, please try again')
					return false
				}
			})
		return {
			nodeAddress: customNodeAddressAnswers['custom_node'],
			chainId,
		}
	}
	const nodeInfo = await fetch(`${constant.DEFAULT_NODE_ADDRESS}/status`).then(data => data.json())
	return {
		nodeAddress: constant.DEFAULT_NODE_ADDRESS,
		chainId: nodeInfo.result['node_info'].network
	}

}

module.exports = {
	binaryCliHandler,
	telegramCliHandler,
	walletCliHandler,
	feeHandler,
	defaultNodeCliHandler
}