import { type StdFee } from '@cosmjs/amino/build/signdoc'
import {
  checkFeeGrant,
  checkVoteGrant,
  constants,
  gasEstimation,
  utils,
  type NetworkType,
} from '@wow-signal/common'
import {
  ProposalStatus,
  proposalStatusFromJSON,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov'
import { MsgVote } from 'cosmjs-types/cosmos/gov/v1beta1/tx'

import { type CtxHandler } from '../../../iline'
import cosmos from '../../../lib/cosmos-rest'
import cosmosRpcQuery from '../../../lib/cosmos-rpc-query'
import cosmosRpc from '../../../lib/cosmos-rpc-sign'
import { convertTypeToVote, getUserIdFromCtx } from '../../../lib/helper'
import {
  getGetSubsByUserIdAndNetwork,
  getMessageById,
} from '../services/resource'

export function voteHandler() {
  return async (req: CtxHandler) => {
    const [voteType, walletId] = req.data.split(':')
    const msg = await getMessageById(req.ctx?.msg?.message_id)
    if (!msg) throw new Error('Message not found')
    const network = cosmos.networks.find(
      (network) => network.network_key === msg?.network_key,
    )
    if (!network) {
      await req.ctx.resetWithText('Network not found')
      return
    }
    const subs = await getGetSubsByUserIdAndNetwork(
      getUserIdFromCtx(req.ctx),
      msg.network_key,
    )
    if (!subs) {
      await req.ctx.resetWithText('You have no subscriptions')
      return
    }
    const subWallet = subs.find((sub) => sub._id.toString() === walletId)
    if (!subWallet) {
      await req.ctx.resetWithText('Wallet not found')
      return
    }

    // process vote
    if (network.grant_type === 'fee') {
      const feeGrant = await checkFeeGrant(
        // todo: remove useless params
        {
          address: subWallet.network_address,
          network_key: network.network_key,
        },
        () =>
          // have to use rpc query because they don't implement method in cosmos rest
          cosmosRpcQuery.queryClient
            .getClient(network.network_key)
            .feegrant.allowance(
              subWallet.network_address,
              network.grant_wallet,
            ),
      )

      const voteGrant = await checkVoteGrant(
        // todo: remove useless params
        {
          address: subWallet.network_address,
          network_key: network.network_key,
        },
        () =>
          cosmos.restClient
            .getClient(network.network_key)
            .authzGrants(
              subWallet.network_address,
              network.grant_wallet,
              constants.VOTE_TYPE_MSG,
            ),
      )

      if (!voteGrant || !feeGrant) {
        await req.ctx.resetWithText('You have not enough grants')
        return
      }
    } else {
      const voteGrant = await checkVoteGrant(
        {
          address: subWallet.network_address,
          network_key: network.network_key,
        },
        () =>
          cosmos.restClient
            .getClient(network.network_key)
            .authzGrants(
              subWallet.network_address,
              network.grant_wallet,
              constants.VOTE_TYPE_MSG,
            ),
      )

      if (!voteGrant) {
        await req.ctx.resetWithText('You have not enough grants')
        return
      }
    }

    const clientGrantee = await cosmosRpc.rpcClient.getClient(
      network.network_key,
    )

    const executeVoteGrantMsg = {
      typeUrl: '/cosmos.authz.v1beta1.MsgExec',
      value: {
        grantee: network.grant_wallet,
        msgs: [
          {
            typeUrl: constants.VOTE_TYPE_MSG,
            value: MsgVote.encode(
              MsgVote.fromPartial({
                proposalId: msg.proposal_id,
                option: convertTypeToVote(voteType),
                voter: subWallet.network_address,
              }),
            ).finish(),
          },
        ],
      },
    }

    async function getFeeNetwork(network: NetworkType): Promise<StdFee> {
      if (network.grant_type === 'fee') {
        const fee = await gasEstimation(
          clientGrantee,
          network.grant_wallet,
          [executeVoteGrantMsg],
          utils.helper.minGasPrice({
            denom: network.denom,
            decimals: network.decimals,
          }),
        )
        return {
          amount: fee.amount,
          gas: fee.gas,
          granter: subWallet?.network_address,
        }
      }
      if (network.grant_type === 'vote') {
        const fee = await gasEstimation(
          clientGrantee,
          network.grant_wallet,
          [executeVoteGrantMsg],
          utils.helper.minGasPrice({
            denom: network.denom,
            decimals: network.decimals,
          }),
        )
        return {
          amount: fee.amount,
          gas: fee.gas,
        }
      }
      if (network.grant_type === 'zero_vote') {
        return {
          amount: [
            {
              amount: '0',
              denom: network.denom,
            },
          ],
          // todo: fix gas
          gas: '200000',
        }
      }
      throw new Error('Grant type not found')
    }
    const fee = await getFeeNetwork(network)
    // check if proposal is active
    const proposal = await cosmos.restClient
      .getClient(network.network_key)
      .proposal(msg.proposal_id)

    if (
      proposalStatusFromJSON(proposal?.proposal?.status) !==
      ProposalStatus.PROPOSAL_STATUS_VOTING_PERIOD
    ) {
      await req.ctx.reply('Proposal is not active')
      return
    }
    const result = await clientGrantee.signAndBroadcast(
      network.grant_wallet,
      [executeVoteGrantMsg],
      fee,
    )
    await req.ctx.reply(
      `Vote transaction: ${network.explorer.transaction
        .replace(':network_key', network.meta.path_explorer_key)
        .replace(':hash', result.transactionHash)}`,
    )
    await clientGrantee.disconnect()

    await req.ctx.reset()
  }
}
