import { type LowSync } from 'lowdb'
import { JSONSyncPreset } from 'lowdb/node'
import path from 'path'
interface MsgEntity {
  networkKey: string
  proposalId: string
  messageId: number
}
interface ProposalEntity {
  messageId: number
}
interface DatabaseObjectType {
  [key: `net:${string}:${string}`]: ProposalEntity | undefined
  [key: `msg:${string}`]: MsgEntity | undefined
}

const DefaultData = {}

export class DbService {
  databases: Map<string, LowSync<DatabaseObjectType>>
  storeKeys: string[]
  pathDb: string
  constructor(pathDb: string, storeKeys: string[]) {
    this.pathDb = pathDb
    this.storeKeys = storeKeys
    this.databases = storeKeys.reduce((acc, storeKey) => {
      acc.set(
        storeKey,
        JSONSyncPreset<DatabaseObjectType>(
          path.join(this.pathDb, `${storeKey}.json`),
          DefaultData,
        ),
      )
      return acc
    }, new Map())
  }

  getStore(storeKey: string): LowSync<DatabaseObjectType> {
    const store = this.databases.get(storeKey)
    if (!store) {
      return JSONSyncPreset<DatabaseObjectType>(
        path.join(this.pathDb, `${storeKey}.json`),
        DefaultData,
      )
    }
    return store
  }
}
