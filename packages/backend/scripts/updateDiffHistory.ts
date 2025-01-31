/*
  This file is a quick prototype and will be refactored if it's proven useful.

  Do not INCLUDE this file - it immediately runs `updateDiffHistoryFile()`
*/

import { execSync } from 'child_process'
import { existsSync, readFileSync, statSync, writeFileSync } from 'fs'
import {
  ConfigReader,
  type DiscoveryDiff,
  diffDiscovery,
  discover,
  discoveryDiffToMarkdown,
  getChainConfig,
} from '@l2beat/discovery'
import type { DiscoveryOutput } from '@l2beat/discovery-types'
import { assert } from '@l2beat/shared-pure'
import { rimraf } from 'rimraf'

import { updateDiffHistoryHash } from '../src/modules/update-monitor/utils/hashing'

const FIRST_SECTION_PREFIX = '# Diff at'

export async function updateDiffHistory(
  projectName: string,
  chain: string,
  description?: string,
  overwriteCache: boolean = false,
) {
  // Get discovered.json from main branch and compare to current
  console.log(`Project: ${projectName}`)
  const configReader = new ConfigReader()
  const curDiscovery = configReader.readDiscovery(projectName, chain)
  const discoveryFolder = `./discovery/${projectName}/${chain}`
  const { content: discoveryJsonFromMainBranch, mainBranchHash } =
    getFileVersionOnMainBranch(`${discoveryFolder}/discovered.json`)
  const discoveryFromMainBranch =
    discoveryJsonFromMainBranch === ''
      ? undefined
      : (JSON.parse(discoveryJsonFromMainBranch) as DiscoveryOutput)

  const saveSources = process.argv.some((a) => a === '--save-sources')

  let diff: DiscoveryDiff[] = []
  let codeDiff
  let configRelatedDiff

  if ((discoveryFromMainBranch?.blockNumber ?? 0) > curDiscovery.blockNumber) {
    throw new Error(
      `Main branch discovery block number (${discoveryFromMainBranch?.blockNumber}) is higher than current discovery block number (${curDiscovery.blockNumber})`,
    )
  }

  if ((discoveryFromMainBranch?.blockNumber ?? 0) < curDiscovery.blockNumber) {
    const rerun = await performDiscoveryOnPreviousBlock(
      discoveryFromMainBranch,
      projectName,
      chain,
      saveSources,
      overwriteCache,
    )
    codeDiff = rerun.codeDiff

    diff = diffDiscovery(
      rerun.prevDiscovery?.contracts ?? [],
      curDiscovery.contracts,
    )
    configRelatedDiff = diffDiscovery(
      discoveryFromMainBranch?.contracts ?? [],
      rerun.prevDiscovery?.contracts ?? [],
    )
  } else {
    console.log(
      'Discovery was run on the same block as main branch, skipping rerun.',
    )
    configRelatedDiff = diffDiscovery(
      discoveryFromMainBranch?.contracts ?? [],
      curDiscovery?.contracts ?? [],
    )
  }

  removeIgnoredFields(configRelatedDiff)
  configRelatedDiff = filterOutEmptyDiffs(configRelatedDiff)

  const diffHistoryPath = `${discoveryFolder}/diffHistory.md`
  const { content: historyFileFromMainBranch } =
    getFileVersionOnMainBranch(diffHistoryPath)

  let previousDescription = undefined
  const diffHistoryExists =
    existsSync(diffHistoryPath) && statSync(diffHistoryPath).isFile()
  if (diffHistoryExists) {
    const diskDiffHistory = readFileSync(diffHistoryPath, 'utf-8')
    previousDescription = findDescription(
      diskDiffHistory,
      historyFileFromMainBranch,
    )
  }

  const anyDiffs = diff.length > 0 || configRelatedDiff.length > 0
  if (!diffHistoryExists || anyDiffs) {
    const newHistoryEntry = generateDiffHistoryMarkdown(
      discoveryFromMainBranch?.blockNumber,
      curDiscovery.blockNumber,
      diff,
      configRelatedDiff,
      mainBranchHash,
      codeDiff,
      description ?? previousDescription,
    )

    const diffHistory =
      historyFileFromMainBranch === ''
        ? newHistoryEntry
        : newHistoryEntry.concat('\n' + historyFileFromMainBranch)

    writeFileSync(diffHistoryPath, diffHistory)
  } else {
    console.log('No changes found.')
    await revertDiffHistory(diffHistoryPath, historyFileFromMainBranch)
  }

  await updateDiffHistoryHash(diffHistoryPath, projectName, chain)
}

function removeIgnoredFields(diffs: DiscoveryDiff[]) {
  const ignoredFields = [
    'derivedName', // we don't want changes to derivedName to trigger diff
  ]
  for (const diff of diffs) {
    diff.diff = diff.diff?.filter(
      (d) => d.key === undefined || !ignoredFields.includes(d.key),
    )
  }
}

function filterOutEmptyDiffs(diffs: DiscoveryDiff[]): DiscoveryDiff[] {
  return diffs.filter(
    (d) => d.type !== undefined || (d.diff !== undefined && d.diff.length > 0),
  )
}

async function revertDiffHistory(
  diffHistoryPath: string,
  historyFileFromMainBranch: string,
) {
  if (historyFileFromMainBranch.trim() !== '') {
    writeFileSync(diffHistoryPath, historyFileFromMainBranch)
  } else {
    await rimraf(diffHistoryPath)
  }
}

async function performDiscoveryOnPreviousBlock(
  discoveryFromMainBranch: DiscoveryOutput | undefined,
  projectName: string,
  chain: string,
  saveSources: boolean,
  overwriteCache: boolean,
) {
  if (discoveryFromMainBranch === undefined) {
    return { prevDiscovery: undefined, codeDiff: undefined }
  }

  // To check for changes to source code,
  // download sources for block number from main branch
  const root = `discovery/${projectName}/${chain}`
  // Remove any old sources we fetched before, so that their count doesn't grow
  await rimraf(`${root}/.code@*`, { glob: true })
  await rimraf(`${root}/.flat@*`, { glob: true })

  const blockNumberFromMainBranch = discoveryFromMainBranch.blockNumber

  await discover({
    project: projectName,
    chain: getChainConfig(chain),
    blockNumber: blockNumberFromMainBranch,
    sourcesFolder: `.code@${blockNumberFromMainBranch}`,
    flatSourcesFolder: `.flat@${blockNumberFromMainBranch}`,
    discoveryFilename: `discovered@${blockNumberFromMainBranch}.json`,
    saveSources,
    overwriteCache,
  })

  const prevDiscoveryFile = readFileSync(
    `${root}/discovered@${blockNumberFromMainBranch}.json`,
    'utf-8',
  )
  const prevDiscovery = JSON.parse(prevDiscoveryFile) as DiscoveryOutput

  // Remove discovered@... file, we don't need it
  await rimraf(`${root}/discovered@${blockNumberFromMainBranch}.json`)

  // get code diff with main branch
  const flatDiff = compareFolders(
    `${root}/.flat@${blockNumberFromMainBranch}`,
    `${root}/.flat`,
  )

  return { prevDiscovery, codeDiff: flatDiff === '' ? undefined : flatDiff }
}

function getMainBranchName(): 'main' | 'master' {
  try {
    execSync('git show-ref --verify refs/heads/master', {
      stdio: 'ignore',
    })
    return 'master'
  } catch {
    // If error, it means 'master' doesn't exist, so we'll stick with 'main'
    return 'main'
  }
}

function compareFolders(path1: string, path2: string): string {
  try {
    return execSync(`git diff --no-index --stat ${path1} ${path2}`).toString()
  } catch (error) {
    // When difference is found, git diff returns non-zero exit code
    // so execSync throws and error, which we handle here
    const execSyncError = error as {
      code?: number
      stdout?: Buffer
      stderr?: Buffer
    }
    if (execSyncError.stderr && execSyncError.stderr.toString().trim() !== '') {
      const errorMessage = `Error with git diff: ${execSyncError.stderr.toString()}`
      console.log(errorMessage)
      return errorMessage
    }
    if (execSyncError.stdout) {
      return execSyncError.stdout.toString().trim()
    }
    return 'Error with git diff: no stderr or stdout found'
  }
}

function getFileVersionOnMainBranch(filePath: string): {
  content: string
  mainBranchHash: string
} {
  const mainBranch = getMainBranchName()
  try {
    // NOTE(radomski): Node when starting a process reserves a buffer of around
    // 200KB for STDIO output. This is not enough in cases where the
    // discovered.json is really big (e.g. transporter). In that case the git
    // command fails with "ENOBUFS" and we assume that there no old
    // discovered.json. Which in turn always causes the diffHistory.md to
    // include "all" the contracts as being created. To solve this problem we
    // allocate a 10MB buffer upfront so all the data can be stored. At the
    // time of writing this (21.10.2024) discovered.json of transporter is
    // around 1.2MB.
    const BUFFER_SIZE = 10 * 1024 * 1024
    const content = execSync(`git show ${mainBranch}:${filePath} 2>/dev/null`, {
      maxBuffer: BUFFER_SIZE,
    }).toString()
    const mainBranchHash = execSync(`git rev-parse ${mainBranch}`)
      .toString()
      .trim()
    return {
      content,
      mainBranchHash,
    }
  } catch {
    console.log(`No previous version of ${filePath} found`)
    return {
      content: '',
      mainBranchHash: '',
    }
  }
}

function getGitUser(): { name: string; email: string } {
  try {
    const name = execSync('git config user.name').toString().trim()
    const email = execSync('git config user.email').toString().trim()
    return { name, email }
  } catch {
    console.log('No git user found')
    return { name: 'unknown', email: 'unknown' }
  }
}

function generateDiffHistoryMarkdown(
  blockNumberFromMainBranchDiscovery: number | undefined,
  curBlockNumber: number,
  diffs: DiscoveryDiff[],
  configRelatedDiff: DiscoveryDiff[],
  mainBranchHash: string,
  codeDiff?: string,
  description?: string,
): string {
  const result = []
  const mainBranch = getMainBranchName()

  const now = new Date().toUTCString()
  result.push(`${FIRST_SECTION_PREFIX} ${now}:`)
  result.push('')
  const { name, email } = getGitUser()
  result.push(`- author: ${name} (<${email}>)`)
  if (blockNumberFromMainBranchDiscovery !== undefined) {
    result.push(
      `- comparing to: ${mainBranch}@${mainBranchHash} block: ${blockNumberFromMainBranchDiscovery}`,
    )
  }
  result.push(`- current block number: ${curBlockNumber}`)
  result.push('')
  result.push('## Description')
  if (description) {
    result.push('')
    result.push(description.trim())
    result.push('')
  } else {
    result.push('')
    if ((blockNumberFromMainBranchDiscovery ?? 0) !== curBlockNumber) {
      result.push(
        'Provide description of changes. This section will be preserved.',
      )
    } else {
      result.push(
        'Discovery rerun on the same block number with only config-related changes.',
      )
    }
    result.push('')
  }

  if (diffs.length > 0) {
    if (blockNumberFromMainBranchDiscovery === undefined) {
      result.push('## Initial discovery')
    } else {
      result.push('## Watched changes')
    }
    result.push('')
    result.push(discoveryDiffToMarkdown(diffs))
    result.push('')
  }

  if (codeDiff !== undefined) {
    result.push('## Source code changes')
    result.push('')
    result.push('```diff')
    result.push(codeDiff)
    result.push('```')
    result.push('')
  }

  if (configRelatedDiff.length > 0) {
    assert(blockNumberFromMainBranchDiscovery !== undefined)
    result.push('## Config/verification related changes')
    result.push('')
    result.push(
      `Following changes come from updates made to the config file,
or/and contracts becoming verified, not from differences found during
discovery. Values are for block ${blockNumberFromMainBranchDiscovery} (main branch discovery), not current.`,
    )
    result.push('')
    result.push(discoveryDiffToMarkdown(configRelatedDiff))
    result.push('')
  }

  return result.join('\n')
}

function findDescription(
  diskDiffHistory: string,
  masterDiffHistory: string,
): string | undefined {
  const masterDiffLines = masterDiffHistory.split('\n')
  const latestSectionIndex = masterDiffLines.findIndex((l) =>
    l.startsWith(FIRST_SECTION_PREFIX),
  )
  let lines: string[] = []
  if (latestSectionIndex >= 0) {
    const lastCommitted = masterDiffLines[latestSectionIndex]
    const diskLines = diskDiffHistory.split('\n')
    const lastCommittedIndex = diskLines.findIndex((l) => l === lastCommitted)
    assert(
      lastCommittedIndex >= 0,
      'Unexpected difference between master and disk file',
    )
    lines = diskLines.slice(0, lastCommittedIndex)
  } else {
    lines = diskDiffHistory.split('\n')
  }

  const index = lines.findIndex((l) => l === '## Description')
  if (index < 0) {
    return undefined
  }

  const followingLines = lines.slice(index + 1)
  const lastIndex = followingLines.findIndex((l) => l.startsWith('## '))
  if (lastIndex < 0) {
    return followingLines.join('\n')
  }

  return followingLines.slice(0, lastIndex).join('\n')
}
