import { VoteOption } from 'cosmjs-types/cosmos/gov/v1beta1/gov';
import { bignumber, format, multiply, pow } from 'mathjs';

export function convertOptionToVoteType(option: VoteOption | undefined) {
  switch (option) {
    case VoteOption.VOTE_OPTION_YES:
      return 'yes';
    case VoteOption.VOTE_OPTION_NO:
      return 'no';
    case VoteOption.VOTE_OPTION_NO_WITH_VETO:
      return 'no_with_veto';
    case VoteOption.VOTE_OPTION_ABSTAIN:
      return 'abstain';
    default:
      return null;
  }
}
export function convertTypeToVote(type: string) {
  switch (type) {
    case 'yes':
      return VoteOption.VOTE_OPTION_YES;
    case 'no':
      return VoteOption.VOTE_OPTION_NO;
    case 'no_with_veto':
      return VoteOption.VOTE_OPTION_NO_WITH_VETO;
    case 'abstain':
      return VoteOption.VOTE_OPTION_ABSTAIN;
    default:
      throw new Error('invalid type');
  }
}

export function minGasPrice({
  denom,
  decimals,
}: {
  denom: string;
  decimals: number;
}) {
  const fee = multiply(0.000000025, pow(10, decimals)).toString();
  return (
    format(bignumber(fee), {
      notation: 'fixed',
      precision: 4,
    }) + denom
  );
}

import { EncodeObject } from '@cosmjs/proto-signing';
import {
  calculateFee,
  GasPrice,
  SigningStargateClient,
} from '@cosmjs/stargate';

async function calcFee(
  gasEstimation: number,
  fee: 'auto' | number,
  gasPrice: string,
) {
  const price = GasPrice.fromString(gasPrice);
  const multiplier = typeof fee === 'number' ? fee : 1.5;
  return calculateFee(Math.round(gasEstimation * multiplier), price);
}

export async function gasEstimation(
  client: SigningStargateClient,
  address: string,
  txs: EncodeObject[],
  gasPrice: string,
) {
  const gasEstimation = await client.simulate(address, txs, undefined);
  return calcFee(gasEstimation, 'auto', gasPrice);
}
