import { readdir, readFile } from 'fs/promises'
import { existsSync, watch } from 'fs'
import { join, basename } from 'path'
import { homedir } from 'os'

export interface SlashItem {
  name: string
  description: string
  // 'user-command' | 'project-command' loaded from .claude/commands/
  // 'user-skill'   | 'project-skill'   loaded from .claude/skills/
  type: 'user-command' | 'project-command' | 'user-skill' | 'project-skill'
}

interface Cache {
  items: SlashItem[]
  loadedAt: number
}

const TTL_MS = 5 * 60 * 1000 // 5-minute TTL; also invalidated instantly via fs.watch

// User-level caches — shared across all sessions
let userCommandCache: Cache | null = null
let userSkillCache: Cache | null = null

// Project-level caches — one entry per CWD
const projectCommandCaches = new Map<string, Cache>()
const projectSkillCaches = new Map<string, Cache>()

// Track which dirs we're already watching to avoid duplicate watchers
const watched = new Set<string>()

function isStale(cache: Cache | null): boolean {
  if (!cache) return true
  return Date.now() - cache.loadedAt > TTL_MS
}

async function loadMarkdownFiles(dir: string, type: SlashItem['type']): Promise<SlashItem[]> {
  if (!existsSync(dir)) return []
  try {
    const files = await readdir(dir)
    const mdFiles = files.filter((f) => f.endsWith('.md'))
    return Promise.all(
      mdFiles.map(async (f) => {
        const name = basename(f, '.md')
        try {
          const content = await readFile(join(dir, f), 'utf-8')
          // Use the first non-empty line as description, stripped of markdown heading markers
          const firstLine = content.split('\n').find((l) => l.trim().length > 0) ?? ''
          const description = firstLine.replace(/^#+\s*/, '').slice(0, 100)
          return { name, description, type }
        } catch {
          return { name, description: '', type }
        }
      })
    )
  } catch {
    return []
  }
}

function watchOnce(dir: string, onInvalidate: () => void): void {
  if (!existsSync(dir) || watched.has(dir)) return
  watched.add(dir)
  try {
    watch(dir, () => onInvalidate())
  } catch {
    // Ignore — watch is best-effort (e.g. dir removed after check)
    watched.delete(dir)
  }
}

const userCommandDir = join(homedir(), '.claude', 'commands')
const userSkillDir = join(homedir(), '.claude', 'skills')

// Watch user dirs once at startup
watchOnce(userCommandDir, () => { userCommandCache = null })
watchOnce(userSkillDir, () => { userSkillCache = null })

async function getUserCommands(): Promise<SlashItem[]> {
  if (!isStale(userCommandCache)) return userCommandCache!.items
  const items = await loadMarkdownFiles(userCommandDir, 'user-command')
  userCommandCache = { items, loadedAt: Date.now() }
  return items
}

async function getUserSkills(): Promise<SlashItem[]> {
  if (!isStale(userSkillCache)) return userSkillCache!.items
  const items = await loadMarkdownFiles(userSkillDir, 'user-skill')
  userSkillCache = { items, loadedAt: Date.now() }
  return items
}

async function getProjectCommands(cwd: string): Promise<SlashItem[]> {
  const cache = projectCommandCaches.get(cwd)
  if (!isStale(cache ?? null)) return cache!.items
  const dir = join(cwd, '.claude', 'commands')
  const items = await loadMarkdownFiles(dir, 'project-command')
  projectCommandCaches.set(cwd, { items, loadedAt: Date.now() })
  watchOnce(dir, () => projectCommandCaches.delete(cwd))
  return items
}

async function getProjectSkills(cwd: string): Promise<SlashItem[]> {
  const cache = projectSkillCaches.get(cwd)
  if (!isStale(cache ?? null)) return cache!.items
  const dir = join(cwd, '.claude', 'skills')
  const items = await loadMarkdownFiles(dir, 'project-skill')
  projectSkillCaches.set(cwd, { items, loadedAt: Date.now() })
  watchOnce(dir, () => projectSkillCaches.delete(cwd))
  return items
}

/**
 * Returns all slash items (commands + skills) for a given pane CWD.
 * User-level items are cached globally; project-level items are cached per CWD.
 */
export async function listSlashItems(cwd: string): Promise<SlashItem[]> {
  const [userCmds, userSkills, projectCmds, projectSkills] = await Promise.all([
    getUserCommands(),
    getUserSkills(),
    getProjectCommands(cwd),
    getProjectSkills(cwd),
  ])
  return [...userCmds, ...userSkills, ...projectCmds, ...projectSkills]
}
