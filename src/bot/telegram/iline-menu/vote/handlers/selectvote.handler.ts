import { voteOptionFromJSON } from 'cosmjs-types/cosmos/gov/v1beta1/gov'

import { type CtxHandler } from '../../../iline'
import cosmosRest from '../../../lib/cosmos-rest'
import { convertOptionToVoteType, getUserIdFromCtx } from '../../../lib/helper'
import { createSelectVote } from '../menu/selectvote.menu'
import {
  getGetSubsByUserIdAndNetwork,
  getMessageById,
} from '../services/resource'

export function selectVoteHandler() {
  return async (req: CtxHandler) => {
    const msg = await getMessageById(req.ctx.msg?.message_id)
    if (!msg) throw new Error('Message not found')
    const subs = await getGetSubsByUserIdAndNetwork(
      getUserIdFromCtx(req.ctx),
      msg.network_key,
    )
    if (!subs) {
      await req.ctx.resetWithText('You have no subscriptions')
      return
    }
    const subWallet = subs.find((sub) => sub._id.toString() === req.data)
    if (!subWallet) {
      await req.ctx.resetWithText('Wallet not found')
      return
    }
    const voted = await cosmosRest.restClient
      .getClient(msg.network_key)
      .vote(msg.proposal_id, subWallet.network_address)
      .catch((e) => {
        if (e?.response?.data?.message?.includes('not found for proposal'))
          return null
        throw e
      })
    const select = convertOptionToVoteType(
      voteOptionFromJSON(voted?.vote?.option),
    )
    await req.ctx.editMessageReplyMarkup({
      reply_markup: createSelectVote(req.ctx, select, subWallet._id.toString()),
    })
  }
}
