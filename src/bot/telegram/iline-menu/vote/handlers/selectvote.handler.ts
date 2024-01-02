import { voteOptionFromJSON } from 'cosmjs-types/cosmos/gov/v1beta1/gov'
import { convertOptionToVoteType } from '../../../../../utils/vote-convert'

import { type CtxHandler } from '../../../iline'
import { createSelectVote } from '../menu/selectvote.menu'
import { getJanusMessageEntity } from '../../../utils/stateless-text'

export function selectVoteHandler() {
  return async (req: CtxHandler) => {
    const networkKey = getJanusMessageEntity(req.ctx)
    if (!networkKey) {
      await req.ctx.resetWithText('Can not find network key')
      return
    }
    const store = req.ctx.services.dbService.getStore(networkKey)
    const message = store.data[`msg:${req!.ctx!.msg!.message_id}`]
    if (!message) {
      await req.ctx.resetWithText('Can not find message')
      return
    }
    const networkService = req.ctx.services.networkServices.find(
      (network) => network.networkKey === networkKey,
    )
    if (!networkService) {
      await req.ctx.resetWithText('Can not find wallets')
      return
    }
    const client = networkService.keys.find((k) => k.key === req.data)
    if (!client) {
      await req.ctx.resetWithText('Can not find client')
      return
    }
    // const address = await client.cosmClient.
    const voted = await networkService.queryClient.gov
      .vote(Number(message.proposalId), client.address)
      .catch((e) => {
        if (e.message.includes('not found for proposal')) return null
        throw e
      })
    // todo: use options insted of option
    const select = convertOptionToVoteType(
      voteOptionFromJSON(voted?.vote?.option),
    )
    await req.ctx.editMessageReplyMarkup({
      reply_markup: createSelectVote(req.ctx, select, client.key),
    })
  }
}
