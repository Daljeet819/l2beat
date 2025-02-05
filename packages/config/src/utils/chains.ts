import type {
  BaseProject,
  Bridge,
  Layer2,
  Layer3,
  ProjectContract,
} from '../types'

/**
 * This function is used by checkVerifiedContracts.ts script to know on which
 * chains to check the contracts.
 *
 * @param projects
 * @returns chain names of all the contracts and escrows in the provided projects.
 */
export function getChainNames(
  ...projects: (Layer2 | Layer3 | Bridge)[]
): string[] {
  return projects
    .flatMap(getProjectDevIds)
    .filter((x, i, a) => a.indexOf(x) === i)
}

function getProjectDevIds(project: Layer2 | Layer3 | Bridge): string[] {
  const escrowContracts = project.config.escrows.flatMap(
    (escrow): ProjectContract[] => {
      if (!escrow.contract) {
        return []
      }
      return [{ address: escrow.address, ...escrow.contract }]
    },
  )
  const permissions = []
  if (project.permissions !== 'UnderReview') {
    for (const perChain of Object.values(project.permissions ?? {})) {
      const all = [...(perChain?.roles ?? []), ...(perChain?.actors ?? [])]
      const filtered = all.filter((p) => {
        const nonEoaAddresses = p.accounts.filter((a) => a.type !== 'EOA')
        return nonEoaAddresses.length > 0
      })
      permissions.push(...filtered)
    }
  }

  const allContracts = [
    ...escrowContracts,
    ...Object.values(project.contracts?.addresses ?? {}).flat(),
    ...permissions,
  ]
  const devIds = allContracts.map((c) => c.chain)

  return devIds
}

export function getChainNamesForDA(...projects: BaseProject[]): string[] {
  return projects
    .flatMap(getProjectDevIdsForDA)
    .filter((x, i, a) => a.indexOf(x) === i)
}

function getProjectDevIdsForDA(p: BaseProject): string[] {
  const addresses =
    p.daBridges?.flatMap((b) =>
      Object.values(b.contracts?.addresses ?? {}).flat(),
    ) ?? []

  const permissions =
    p.daBridges?.flatMap((b) => {
      const result = []
      if (b.permissions && b.permissions !== 'UnderReview') {
        const values = Object.values(b.permissions)
          .flatMap((p) => [...(p?.roles ?? []), ...(p?.actors ?? [])])
          .filter((p) => {
            const nonEoaAddresses = p.accounts.filter((a) => a.type !== 'EOA')
            return nonEoaAddresses.length > 0
          })
        result.push(...values)
      }
      return result
    }) ?? []

  const devIds = [...addresses, ...permissions].map((c) => c.chain)

  return devIds
}
