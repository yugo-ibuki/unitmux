import type { DiffFile } from './parseDiff'

export const COLLAPSE_THRESHOLD = 50

export interface DiffSidebarItem {
  index: number
  path: string
  additions: number
  deletions: number
  totalChanges: number
  open: boolean
}

export interface DiffSidebarDirectoryRow {
  type: 'directory'
  id: string
  name: string
  path: string
  depth: number
  open: boolean
}

export interface DiffSidebarFileRow extends DiffSidebarItem {
  type: 'file'
  id: string
  name: string
  depth: number
}

export type DiffSidebarRow = DiffSidebarDirectoryRow | DiffSidebarFileRow

interface DiffSidebarDirectoryNode {
  name: string
  path: string
  directories: Map<string, DiffSidebarDirectoryNode>
  children: Array<DiffSidebarDirectoryNode | DiffSidebarFileRow>
}

export function getDiffSidebarItems(
  files: DiffFile[],
  openFiles: Record<number, boolean> = {}
): DiffSidebarItem[] {
  return files.map((file, index) => {
    const totalChanges = file.additions + file.deletions

    return {
      index,
      path: file.path,
      additions: file.additions,
      deletions: file.deletions,
      totalChanges,
      open: openFiles[index] ?? totalChanges < COLLAPSE_THRESHOLD
    }
  })
}

export function getVisibleDiffSidebarRows(
  files: DiffFile[],
  openFiles: Record<number, boolean> = {},
  openDirectories: Record<string, boolean> = {}
): DiffSidebarRow[] {
  const root: DiffSidebarDirectoryNode = {
    name: '',
    path: '',
    directories: new Map(),
    children: []
  }

  for (const item of getDiffSidebarItems(files, openFiles)) {
    const parts = item.path.split('/').filter(Boolean)
    const fileName = parts.pop() ?? item.path
    let current = root
    let currentPath = ''

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      let next = current.directories.get(part)
      if (!next) {
        next = {
          name: part,
          path: currentPath,
          directories: new Map(),
          children: []
        }
        current.directories.set(part, next)
        current.children.push(next)
      }
      current = next
    }

    current.children.push({
      ...item,
      type: 'file',
      id: `file:${item.index}`,
      name: fileName,
      depth: parts.length
    })
  }

  return flattenDirectory(root, 0, openDirectories)
}

function flattenDirectory(
  directory: DiffSidebarDirectoryNode,
  depth: number,
  openDirectories: Record<string, boolean>
): DiffSidebarRow[] {
  const rows: DiffSidebarRow[] = []

  for (const child of directory.children) {
    if (isDirectoryNode(child)) {
      const open = openDirectories[child.path] ?? true
      rows.push({
        type: 'directory',
        id: child.path,
        name: child.name,
        path: child.path,
        depth,
        open
      })

      if (open) {
        rows.push(...flattenDirectory(child, depth + 1, openDirectories))
      }
    } else {
      rows.push(child)
    }
  }

  return rows
}

function isDirectoryNode(
  row: DiffSidebarDirectoryNode | DiffSidebarFileRow
): row is DiffSidebarDirectoryNode {
  return 'directories' in row
}
