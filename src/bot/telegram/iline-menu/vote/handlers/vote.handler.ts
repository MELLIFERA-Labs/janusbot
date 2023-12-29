import { type StdFee } from '@cosmjs/amino/build/signdoc'
import {
  ProposalStatus,
  proposalStatusFromJSON,
} from 'cosmjs-types/cosmos/gov/v1beta1/gov'
import { getJanusMessageEntity } from '../../../utils/stateless-text'
import { type CtxHandler } from '../../../iline'
export const VOTE_TYPE_MSG = '/cosmos.gov.v1beta1.MsgVote';
import { Network } from '../../../../../types/config'
import { convertTypeToVote } from '../../../../../utils/vote-convert'
import { gasEstimation, minGasPrice } from '../../../../../utils/gas-estimation'

export function voteHandler() {
  return async (req: CtxHandler) => {
    const [voteType, walletId] = req.data.split(':')
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
      await req.ctx.resetWithText('Can not find network')
      return
    }
    const client = networkService.keys.find(
      (k) => k.key === walletId
    )
    if (!client) {
      await req.ctx.resetWithText('Can not find wallet')
      return
    }
    const voteTrx = {
      typeUrl: VOTE_TYPE_MSG,
      value: {
        proposalId: Number(message.proposalId),
        option: convertTypeToVote(voteType),
        voter: client.address
      }
    }
    async function getFeeNetwork(address: string, netoworConfig: Network): Promise<StdFee> {
      const fee = await gasEstimation(
       client!.cosmClient,
       address,
        [voteTrx],
        minGasPrice({
          denom: netoworConfig.denom,
          decimals: netoworConfig.decimals,
        }),
      );
      return {
          amount: fee.amount,
          gas: fee.gas,
      };
    }
    const fee = await getFeeNetwork(client.address, networkService.networkConfig);
    const result = await client.cosmClient.signAndBroadcast(client.address, [voteTrx], fee)
    const voteResult = networkService.networkConfig.explorer?.trx ? 
    networkService.networkConfig.explorer?.trx.replace(':hash', result.transactionHash)
    : result.transactionHash
    
  await req.ctx.reply(`NetworkKey: ${networkKey}\nProposalId: ${message.proposalId}\nVote: ${voteType}\nWallet: ${walletId}\nVote result: ${voteResult}`)
  await req.ctx.reset()    
 }
}
