import { ProjectId, UnixTime } from '@l2beat/shared-pure'
import type { Layer3 } from '../../types'
import { BADGES } from '../badges'
import { underReviewL3 } from '../layer2s/templates/underReview'

export const blockfit: Layer3 = underReviewL3({
  id: 'blockfit',
  capability: 'universal',
  addedAt: new UnixTime(1739285196), // 2025-02-11T14:46:36Z
  hostChain: ProjectId('nova'),
  badges: [BADGES.Stack.Orbit, BADGES.VM.EVM, BADGES.RaaS.Zeeve],
  display: {
    name: 'BlockFit',
    slug: 'blockfit',
    description:
      'BlockFit is a scaling solution built on the Orbit stack. It aims to revolutionizing healthcare.',
    purposes: ['Universal'],
    category: 'Optimium',
    stack: 'Arbitrum',
    links: {
      websites: ['https://blockfit.io/'],
      explorers: ['https://blockfitscan.io/'],
      documentation: [],
      repositories: [],
      apps: [
        'https://bridge.blockfitscan.io/?destinationChain=BlockFit-Mainnet&sourceChain=arbitrum-nova',
      ],
      socialMedia: ['https://x.com/Fit24updates', 'https://t.me/fit24updates'],
    },
  },
  chainConfig: {
    name: 'blockfit',
    chainId: 202424,
    apis: [
      {
        type: 'rpc',
        url: 'https://rpc.blockfitscan.io',
        callsPerMinute: 1500,
      },
    ],
  },
  activityConfig: {
    type: 'block',
    startBlock: 1,
    adjustCount: { type: 'SubtractOne' },
  },
}) //no escrow since gas token is not on CoinGecko
