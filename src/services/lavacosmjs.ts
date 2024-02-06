import type { JsonRpcRequest, JsonRpcSuccessResponse } from '@cosmjs/json-rpc'
import type { RpcClient } from '@cosmjs/tendermint-rpc'
import { LavaSDK, type LavaSDKOptions } from '@lavanet/lava-sdk'

export class LavaCosmJsRPCClient implements RpcClient {
  private lavaSdkOptions: LavaSDKOptions
  public lavaSdk: LavaSDK | undefined

  constructor(options: LavaSDKOptions) {
    this.lavaSdkOptions = options
  }

  async init() {
    this.lavaSdk = await LavaSDK.create(this.lavaSdkOptions)
  }

  static async create(options: LavaSDKOptions) {
    const client = new LavaCosmJsRPCClient(options)
    await client.init()
    return client
  }

  async execute(request: JsonRpcRequest): Promise<JsonRpcSuccessResponse> {
    if (!this.lavaSdk) {
      console.log('Lava SDK not initialized, initiating now')
      await this.init()
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    delete request.params.height

    return this.lavaSdk?.sendRelay({
      method: request.method,
      params: request.params as unknown[],
    })
  }

  disconnect(): void {
    return
  }
}
