import { bignumber, format, multiply, pow } from 'mathjs'
import { EncodeObject } from '@cosmjs/proto-signing'
import { calculateFee, GasPrice, SigningStargateClient } from '@cosmjs/stargate'

export function minGasPrice({
  denom,
  decimals,
}: {
  denom: string
  decimals: number
}) {
  const fee = multiply(0.000000025, pow(10, decimals)).toString()
  return (
    format(bignumber(fee), {
      notation: 'fixed',
      precision: 4,
    }) + denom
  )
}

async function calcFee(
  gasEstimation: number,
  fee: 'auto' | number,
  gasPrice: string,
) {
  const price = GasPrice.fromString(gasPrice)
  const multiplier = typeof fee === 'number' ? fee : 1.5
  return calculateFee(Math.round(gasEstimation * multiplier), price)
}

export async function gasEstimation(
  client: SigningStargateClient,
  address: string,
  txs: EncodeObject[],
  gasPrice: string,
) {
  const gasEstimation = await client.simulate(address, txs, undefined)
  return calcFee(gasEstimation, 'auto', gasPrice)
}
