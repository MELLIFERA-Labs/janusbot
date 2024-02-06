import { type NetworkService } from '../../services/network.service'
import { type DbService } from '../../services/db.service'
import {
  ProposalStatus,
  TextProposal,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov'
import { createMessageFromProposal } from './msg/vote.message'
import { MsgSoftwareUpgrade } from 'cosmjs-types/cosmos/upgrade/v1beta1/tx'
import { HTML } from 'telegram-escape'
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
      // eslint-disable-next-line no-inner-declarations, @typescript-eslint/no-explicit-any
      function decodeAndConstractTitle(msg: any) {
        if (
          msg!.typeUrl === '/cosmos.distribution.v1beta1.MsgCommunityPoolSpend'
        ) {
          return 'Community spend proposal. See details in explorer.'
        }
        if (msg!.typeUrl === '/cosmos.upgrade.v1beta1.MsgSoftwareUpgrade') {
          const data = MsgSoftwareUpgrade.decode(msg!.value)
          return `Software upgrade proposal. New version: ${data.plan.name}`
          // return data
        }
        return TextProposal.decode(msg.value)?.title
      }
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
          ? decodeAndConstractTitle(proposal.content)
          : "[ERROR: Can't process title proposal]"
        const textProposal = createMessageFromProposal(
          {
            title: HTML`${titleProposal}`,
            type: proposal.content?.typeUrl,
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
