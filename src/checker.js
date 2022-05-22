const  {Worker, isMainThread, workerData: config} = require('node:worker_threads');
const {Bot} = require('grammy') ;
const constant = require('./constant.js') ;
// const {fileURLToPath} = require('url') ;
const {execFileSync} = require("node:child_process");
const {createMessageFromProposal} = require('./utils.js');
const os = require('os');
const path = require('node:path')
const Store = require( './store.js');
const createVoteBtns = require("./keyboard/vote.inline.js");
const humanInterval = require("human-interval");
const Logger = require("./logger.js");
const logger = Logger('checker')
if (isMainThread) {
	module.exports = (config) => {
		return new Worker(__filename, {
			workerData: config
		});
	};
} else {
	(async function () {
		const time = humanInterval(config.bot.proposals_check_timeout)
		if(Number.isNaN(time) || !time) {
			console.info('Invalid `proposals_check_timeout` configuration')
			await new Promise(resolve => setTimeout(resolve, 0))
			process.exit(0)
		}
		while (true) {
			await startCheckProposals()
			await new Promise(resolve => setTimeout(resolve, time))
		}
	})().catch(logger.error)
}

async function startCheckProposals() {
	logger.info('start check')
	const bot = new Bot(config.bot.telegram_bot);

	const store = new Store(path.join(os.homedir(),constant.DATA_FILE_PATH));

	try {
		const propData = store.read();

		const proposalData = JSON.parse(execFileSync(config.cosmos.cosmos_binary, ['q',
			'gov',
			'proposals',
			'--node',
			config.cosmos.node_address,
			'--status',
			'voting_period',
			'--output',
			'json'
		], {stdio: ["pipe", "pipe", "pipe"]}).toString());
		const actualProposals = proposalData.proposals
			.filter(
				(prop) =>
					Number(prop.proposal_id) > propData['last_notified_proposal_id']
			);
		if (actualProposals.length) {
			for (const prop of actualProposals) {
				// sender.send(content)
				await bot.api.sendMessage(config.bot.telegram_chat_id, createMessageFromProposal(
					{
						id: prop.proposal_id,
						title: prop.content.title,
						description: prop.content.description,
						startTime: prop.voting_start_time,
						endTime: prop.voting_end_time,
					}), {parse_mode: "Markdown", reply_markup: createVoteBtns(prop['proposal_id'])});
				logger.info(`successfully notified! proposal number: ${prop.proposal_id}`);
			}
			const lastProp = actualProposals.sort(
				(a, b) => b.proposal_id - a.proposal_id
			)[0];
			store.save({last_notified_proposal_id: Number(lastProp.proposal_id)});
			logger.info(`successfully state updated! proposal number changed: ${lastProp.proposal_id}`);
		}
	} catch (e) {
		if (!e?.stderr?.includes('Error: no proposals found')) throw e;
	}
	logger.info('end check')

}

