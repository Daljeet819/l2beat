import type { Database } from '@l2beat/database'
import { type DiscoveryDiff, diffDiscovery } from '@l2beat/discovery'
import type { DiscoveryOutput } from '@l2beat/discovery-types'
import { ChainId } from '@l2beat/shared-pure'

export async function getDiff(
  db: Database,
  discovery: DiscoveryOutput,
  chainId: number,
): Promise<DiscoveryDiff[]> {
  const latest = await db.updateMonitor.findLatest(
    discovery.name,
    ChainId(chainId),
  )

  let diff: DiscoveryDiff[] = []
  if (latest?.discovery.contracts) {
    diff = diffDiscovery(discovery.contracts, latest.discovery.contracts)
  }
  return diff
}
