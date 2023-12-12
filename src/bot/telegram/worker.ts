import { type NetworkService } from '../../services/network.service'
import { type DbService } from '../../services/db.service'
import { ProposalStatus } from 'cosmjs-types/cosmos/gov/v1beta1/gov'
export const excuteWorker = async (
  networkServices: NetworkService[],
  dbService: DbService,
): Promise<void> => {
  // 1. Check proposals for networks
  for (const networkService of networkServices) {
    // todo: add logger
    console.log(`Check proposals for network: "${networkService.networkKey}"`)
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
        console.log(
          `Proposal: ${proposalId} in network: ${networkService.networkKey} alredy sent`,
        )
      }
      await networkService.notifier.sendMessage('proposalId')
      dbStore.data[`msg:${123}`] = {
        networkKey: networkService.networkKey,
        proposalId,
        messageId: '1',
      }
      dbStore.data[`net:${networkService.networkKey}:${proposalId}`] = {
        messageId: '1',
      }
      dbStore.write()
    }
  }
}
