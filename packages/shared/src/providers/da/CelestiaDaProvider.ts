import { assert } from '@l2beat/shared-pure'
import type { CelestiaRpcClient } from '../../clients/rpc-celestia/CelestiaRpcClient'
import type { DaBlob, DaProvider } from './DaProvider'

export type CelestiaBlob = DaBlob & {
  namespace: string
}

export class CelestiaDaProvider implements DaProvider {
  constructor(private readonly rpcClient: CelestiaRpcClient) {}

  async getBlobs(from: number, to: number): Promise<CelestiaBlob[]> {
    const blobs: CelestiaBlob[] = []

    for (let i = from; i <= to; i++) {
      const blobsFromBlock = await this.getBlobsFromBlock(i)
      blobs.push(...blobsFromBlock)
    }

    return blobs
  }

  private async getBlobsFromBlock(
    blockNumber: number,
  ): Promise<CelestiaBlob[]> {
    const [block, blockTimestamp] = await Promise.all([
      this.rpcClient.getBlockResult(blockNumber),
      this.rpcClient.getBlockTimestamp(blockNumber),
    ])

    if (block.txs_results === null) {
      return []
    }

    const blobEvents = block.txs_results
      .flatMap(({ log }) => log.flatMap(({ events }) => events))
      .filter(({ type }) => type === 'celestia.blob.v1.EventPayForBlobs')

    const blobs: CelestiaBlob[] = blobEvents.flatMap((blobEvent) => {
      const namespaces = getAttributeValue<string[]>(blobEvent, 'namespaces')
      const sizes = getAttributeValue<number[]>(blobEvent, 'blob_sizes')

      assert(
        namespaces.length === sizes.length,
        'Namespaces and sizes should be equal length',
      )

      return namespaces.map((namespace, i) => ({
        namespace,
        blockTimestamp,
        size: BigInt(sizes[i]),
      }))
    })

    return blobs
  }
}

function getAttributeValue<T>(
  event: { attributes: { key: string; value?: string }[] },
  key: string,
): T {
  const attribute = event.attributes.find((a) => a.key === key)
  assert(attribute && attribute.value, `${key} should be defined`)
  return JSON.parse(attribute.value) as T
}
