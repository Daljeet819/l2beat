import type { ProjectLinks } from '@l2beat/config'
import { compact } from 'lodash'
import type { ProjectLink } from '~/components/projects/links/types'

export function getProjectLinks(...links: ProjectLinks[]): ProjectLink[] {
  const websites = [...new Set(links.flatMap((links) => links.websites ?? []))]
  const apps = [...new Set(links.flatMap((links) => links.apps ?? []))]
  const docs = [...new Set(links.flatMap((links) => links.documentation ?? []))]
  const explorers = [
    ...new Set(links.flatMap((links) => links.explorers ?? [])),
  ]
  const repositories = [
    ...new Set(links.flatMap((links) => links.repositories ?? [])),
  ]
  const social = [...new Set(links.flatMap((links) => links.socialMedia ?? []))]
  const rollupCodes = [
    ...new Set(links.flatMap((links) => links.rollupCodes ?? []))
  ]

  return compact([
    websites.length !== 0 && { name: 'Website', links: websites },
    apps.length !== 0 && { name: 'App', links: apps },
    docs.length !== 0 && { name: 'Docs', links: docs },
    explorers.length !== 0 && { name: 'Explorer', links: explorers },
    repositories.length !== 0 && { name: 'Repository', links: repositories },
    social.length !== 0 && { name: 'Social', links: social },
    rollupCodes.length !== 0 && { name: 'rollup.codes', links: rollupCodes },
  ])
}
