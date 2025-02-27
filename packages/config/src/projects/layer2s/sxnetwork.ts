import { UnixTime } from '@l2beat/shared-pure'
import { REASON_FOR_BEING_OTHER } from '../../common'

import { ProjectDiscovery } from '../../discovery/ProjectDiscovery'
import type { Layer2 } from '../../types'
import { BADGES } from '../badges'
import { AnytrustDAC } from '../da-beat/templates/anytrust-template'
import { orbitStackL2 } from './templates/orbitStack'

const discovery = new ProjectDiscovery('sxnetwork', 'ethereum')

export const sxnetwork: Layer2 = orbitStackL2({
  addedAt: new UnixTime(1722430544), // 2024-07-31T12:55:44Z
  discovery,
  gasTokens: { tracked: ['SX'] },
  additionalBadges: [BADGES.RaaS.Gelato],
  additionalPurposes: ['Betting'],
  reasonsForBeingOther: [
    REASON_FOR_BEING_OTHER.CLOSED_PROOFS,
    REASON_FOR_BEING_OTHER.SMALL_DAC,
  ],
  display: {
    name: 'SX Network',
    slug: 'sxnetwork',
    description:
      "SX Network is an Orbit stack Optimium, built to scale the SX team's existing sports betting platform.",
    links: {
      websites: ['https://sx.technology/'],
      apps: [
        'https://sx.bet/wallet/bridge',
        'https://bridge.gelato.network/bridge/sx-rollup',
      ],
      documentation: ['https://docs.sx.technology/'],
      explorers: ['https://explorerl2.sx.technology/'],
      socialMedia: [
        'https://x.com/SX_Network',
        'https://discord.com/invite/sxnetwork',
      ],
    },
  },
  isNodeAvailable: 'UnderReview',
  bridge: discovery.getContract('Bridge'),
  rollupProxy: discovery.getContract('RollupProxy'),
  sequencerInbox: discovery.getContract('SequencerInbox'),
  associatedTokens: ['SX'],
  chainConfig: {
    name: 'sxnetwork',
    chainId: 4162,
    apis: [
      {
        type: 'rpc',
        url: 'https://rpc.sx-rollup.gelato.digital',
        callsPerMinute: 1500,
      },
    ],
  },
  activityConfig: {
    type: 'block',
    adjustCount: { type: 'SubtractOne' },
    startBlock: 1,
  },
  customDa: AnytrustDAC({ discovery }),
})
