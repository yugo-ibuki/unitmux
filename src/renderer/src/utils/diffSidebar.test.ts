import { describe, expect, it } from 'vitest'
import type { DiffFile } from './parseDiff'
import { COLLAPSE_THRESHOLD, getDiffSidebarItems, getVisibleDiffSidebarRows } from './diffSidebar'

function diffFile(path: string, additions: number, deletions: number): DiffFile {
  return {
    path,
    additions,
    deletions,
    lines: []
  }
}

describe('getDiffSidebarItems', () => {
  it('marks small files as open by default and large files as collapsed', () => {
    const items = getDiffSidebarItems([
      diffFile('src/small.ts', 2, 3),
      diffFile('src/large.ts', COLLAPSE_THRESHOLD, 1)
    ])

    expect(items).toEqual([
      {
        index: 0,
        path: 'src/small.ts',
        additions: 2,
        deletions: 3,
        totalChanges: 5,
        open: true
      },
      {
        index: 1,
        path: 'src/large.ts',
        additions: COLLAPSE_THRESHOLD,
        deletions: 1,
        totalChanges: COLLAPSE_THRESHOLD + 1,
        open: false
      }
    ])
  })

  it('uses explicit open state over the default collapse threshold', () => {
    const items = getDiffSidebarItems(
      [
        diffFile('src/forced-closed.ts', 1, 1),
        diffFile('src/forced-open.ts', COLLAPSE_THRESHOLD + 10, 0)
      ],
      {
        0: false,
        1: true
      }
    )

    expect(items.map((item) => item.open)).toEqual([false, true])
  })
})

describe('getVisibleDiffSidebarRows', () => {
  it('renders changed files as an expanded directory tree by default', () => {
    const rows = getVisibleDiffSidebarRows([
      diffFile('src/renderer/App.tsx', 2, 1),
      diffFile('src/renderer/components/DiffOverlay.tsx', 3, 0),
      diffFile('README.md', 1, 1)
    ])

    expect(rows).toEqual([
      {
        type: 'directory',
        id: 'src',
        name: 'src',
        path: 'src',
        depth: 0,
        open: true
      },
      {
        type: 'directory',
        id: 'src/renderer',
        name: 'renderer',
        path: 'src/renderer',
        depth: 1,
        open: true
      },
      {
        type: 'file',
        id: 'file:0',
        index: 0,
        name: 'App.tsx',
        path: 'src/renderer/App.tsx',
        depth: 2,
        additions: 2,
        deletions: 1,
        totalChanges: 3,
        open: true
      },
      {
        type: 'directory',
        id: 'src/renderer/components',
        name: 'components',
        path: 'src/renderer/components',
        depth: 2,
        open: true
      },
      {
        type: 'file',
        id: 'file:1',
        index: 1,
        name: 'DiffOverlay.tsx',
        path: 'src/renderer/components/DiffOverlay.tsx',
        depth: 3,
        additions: 3,
        deletions: 0,
        totalChanges: 3,
        open: true
      },
      {
        type: 'file',
        id: 'file:2',
        index: 2,
        name: 'README.md',
        path: 'README.md',
        depth: 0,
        additions: 1,
        deletions: 1,
        totalChanges: 2,
        open: true
      }
    ])
  })

  it('hides descendants of collapsed directories', () => {
    const rows = getVisibleDiffSidebarRows(
      [
        diffFile('src/renderer/App.tsx', 2, 1),
        diffFile('src/renderer/components/DiffOverlay.tsx', 3, 0),
        diffFile('README.md', 1, 1)
      ],
      {},
      {
        'src/renderer': false
      }
    )

    expect(rows.map((row) => row.id)).toEqual(['src', 'src/renderer', 'file:2'])
    expect(rows[1]).toMatchObject({
      type: 'directory',
      path: 'src/renderer',
      open: false
    })
  })
})
