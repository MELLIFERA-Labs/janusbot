import { suffixJanusStatelessHTML } from '../utils/stateless-text'
const voteUrlConstruct = (voteUrl: string, proposalId: string) =>
  `<a href="${voteUrl.replace(
    ':id',
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    proposalId,
  )}">Link to full proposal</a>`
export function createMessageFromProposal(
  proposal: {
    title: string
    proposalId: string
    votingStartTime: string
    votingEndTime: string
  },
  network: string,
  voteUrl?: string,
): string {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return `New proposal #${proposal?.proposalId} in <b>${network}</b> \n\n  <b>\n${
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    proposal.title
  }</b>\n\n\nStart: ${
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    proposal.votingStartTime.split('T')[0]
  }\nEnd: ${
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    proposal.votingEndTime.split('T')[0]
  } \n\n${
    voteUrl ? voteUrlConstruct(voteUrl, proposal.proposalId) : ''
  }${suffixJanusStatelessHTML(network)}`
}
