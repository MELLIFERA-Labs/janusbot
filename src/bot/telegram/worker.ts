import { type NetworkService } from '../../services/network.service'
import { type DbService } from '../../services/db.service'
import {
  ProposalStatus,
  TextProposal,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov'
import { createMessageFromProposal } from './msg/vote.message'
import logger from '../../services/app-logger.service'
import { WORKER_INTERVAL } from '../../constants'
const log = logger('bot:telegram:worker')

function convertSecondsToDate(seconds: number) {
  const milliseconds = seconds * 1000
  const date = new Date(milliseconds)

  return date
}
export const startWoker = async (
  networkServices: NetworkService[],
  dbService: DbService,
): Promise<void> => {
  const IS_INFINITY = true
  while (IS_INFINITY) {
    log.info('Start tick')
    for (const networkService of networkServices) {
      log.info(`Check proposals for network: "${networkService.networkKey}"`)
      const proposalData = await networkService.queryClient.gov.proposals(
        ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD,
        '',
        '',
      )
      const dbStore = dbService.getStore(networkService.networkKey)
      for (const proposal of proposalData.proposals) {
        const proposalId = proposal.proposalId.toString()
        dbStore.read()
        const savedProposal =
          dbStore.data[`net:${networkService.networkKey}:${proposalId}`]
        if (savedProposal) {
          log.info(
            `Skip proposal: ${proposalId} for network: ${networkService.networkKey} alredy sent`,
          )
          continue
        }

        const titleProposal = proposal.content?.value
          ? TextProposal.decode(proposal.content?.value).title
          : "[ERROR: Can't process title proposal]"
        const textProposal = createMessageFromProposal(
          {
            title: titleProposal,
            proposalId: proposalId,
            votingStartTime: convertSecondsToDate(
              Number(proposal.votingStartTime.seconds.toString()),
            ).toISOString(),
            votingEndTime: convertSecondsToDate(
              Number(proposal.votingEndTime.seconds.toString()),
            ).toISOString(),
          },
          networkService.networkKey,
          networkService.networkConfig.explorer?.proposal,
        )
        const msgId = await networkService.notifier.sendMessage(textProposal)
        log.info(
          `Proposal: ${proposalId} for network: ${networkService.networkKey} sent`,
        )
        dbStore.data[`msg:${msgId}`] = {
          networkKey: networkService.networkKey,
          proposalId,
          messageId: msgId,
        }
        dbStore.data[`net:${networkService.networkKey}:${proposalId}`] = {
          messageId: msgId,
        }
        log.info(
          `Proposal: ${proposalId} for network: ${networkService.networkKey} state saved`,
        )
        dbStore.write()
      }
    }
    log.info('End tick')
    await new Promise((resolve) => setTimeout(resolve, WORKER_INTERVAL))
  }
}
