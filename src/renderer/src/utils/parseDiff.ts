export interface DiffLine {
  type: 'add' | 'del' | 'context' | 'hunk'
  content: string
  oldNum: number | null
  newNum: number | null
}

export interface DiffFile {
  path: string
  additions: number
  deletions: number
  lines: DiffLine[]
}

export function parseDiff(raw: string): DiffFile[] {
  const files: DiffFile[] = []
  let current: DiffFile | null = null
  let oldLine = 0
  let newLine = 0

  for (const line of raw.split('\n')) {
    // New file section
    const fileMatch = line.match(/^diff --git .+ b\/(.+)$/)
    if (fileMatch) {
      current = {
        path: fileMatch[1],
        additions: 0,
        deletions: 0,
        lines: []
      }
      files.push(current)
      oldLine = 0
      newLine = 0
      continue
    }

    if (!current) continue

    // Skip metadata lines
    if (
      line.startsWith('index ') ||
      line.startsWith('--- ') ||
      line.startsWith('+++ ') ||
      line.startsWith('new file') ||
      line.startsWith('deleted file')
    ) {
      continue
    }

    // Hunk header
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunkMatch) {
      oldLine = parseInt(hunkMatch[1], 10)
      newLine = parseInt(hunkMatch[2], 10)
      current.lines.push({
        type: 'hunk',
        content: line,
        oldNum: null,
        newNum: null
      })
      continue
    }

    if (line.startsWith('Binary files')) {
      current.lines.push({ type: 'hunk', content: line, oldNum: null, newNum: null })
      continue
    }

    // Added line
    if (line.startsWith('+')) {
      current.lines.push({
        type: 'add',
        content: line.slice(1),
        oldNum: null,
        newNum: newLine
      })
      current.additions++
      newLine++
      continue
    }

    if (line.startsWith('\\')) {
      continue
    }

    // Deleted line
    if (line.startsWith('-')) {
      current.lines.push({
        type: 'del',
        content: line.slice(1),
        oldNum: oldLine,
        newNum: null
      })
      current.deletions++
      oldLine++
      continue
    }

    // Context line (starts with space or is empty within a hunk)
    if (line.startsWith(' ') || line === '') {
      current.lines.push({
        type: 'context',
        content: line.startsWith(' ') ? line.slice(1) : line,
        oldNum: oldLine,
        newNum: newLine
      })
      oldLine++
      newLine++
    }
  }

  return files
}
