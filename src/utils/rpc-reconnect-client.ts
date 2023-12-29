import {
  isJsonRpcErrorResponse,
  JsonRpcRequest,
  JsonRpcSuccessResponse,
  parseJsonRpcResponse,
} from '@cosmjs/json-rpc';
import { RpcClient } from '@cosmjs/tendermint-rpc/build/rpcclients';
import { http } from '@cosmjs/tendermint-rpc/build/rpcclients/http';
import { hasProtocol } from '@cosmjs/tendermint-rpc/build/rpcclients/rpcclient';
import EventEmitter from 'events';
async function makeRpcCall(
  url: string,
  request: JsonRpcRequest,
  headers: Record<string, string> | undefined,
) {
  const response = parseJsonRpcResponse(
    await http('POST', url, headers, request),
  );
  if (isJsonRpcErrorResponse(response)) {
    throw new Error(JSON.stringify(response.error));
  }
  return response;
}
export default class RpcReConnectClient
  extends EventEmitter
  implements RpcClient
{
  private rpcScores: Map<string, boolean>;
  protected readonly headers: Record<string, string> | undefined;

  constructor(private readonly rpcUrls: string[]) {
    super();
    this.rpcScores = new Map<string, boolean>();
    for (const rpcUrl of rpcUrls) {
      const url = hasProtocol(rpcUrl) ? rpcUrl : 'http://' + rpcUrl;
      this.rpcScores.set(url, true);
    }
  }
  async disconnect(): Promise<void> {
    /*empty*/
  }
  public async execute(
    request: JsonRpcRequest,
  ): Promise<JsonRpcSuccessResponse> {
    let countRequests = this.rpcScores.size;
    let error: unknown;
    while (countRequests > 0) {
      const rpcUrl = this.rpcScores.entries().next().value[0];
      try {
        countRequests--;
        const response = await makeRpcCall(rpcUrl, request, this.headers);
        this.rpcScores.set(rpcUrl, true);
        this.rpcScores = new Map(
          [...this.rpcScores.entries()].sort(
            (a, b) => Number(b[1]) - Number(a[1]),
          ),
        );
        this.emit('info', {
          type: 'cosmos-rpc',
          data: {
            url: rpcUrl,
            request: request,
            response: response,
            score: [...this.rpcScores.entries()],
          },
        });
        return response;
      } catch (e) {
        this.emit('warning', {
          type: 'cosmos-rpc',
          data: {
            url: rpcUrl,
            request: request,
            error: e,
            score: [...this.rpcScores.entries()],
          },
        });
        error = e;
        this.rpcScores.set(rpcUrl, false);
        this.rpcScores = new Map(
          [...this.rpcScores.entries()].sort(
            (a, b) => Number(b[1]) - Number(a[1]),
          ),
        );
      }
    }
    throw error;
  }
}
