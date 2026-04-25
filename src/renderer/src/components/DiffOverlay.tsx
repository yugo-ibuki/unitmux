import { useEffect, useRef, useState } from 'react'
import { useUiStore } from '../stores/uiStore'
import { COLLAPSE_THRESHOLD, getVisibleDiffSidebarRows } from '../utils/diffSidebar'
import { parseDiff } from '../utils/parseDiff'
import { DiffFileSection } from './DiffFileSection'

export function DiffOverlay(): React.JSX.Element | null {
  const diffContent = useUiStore((s) => s.diffContent)
  const diffStaged = useUiStore((s) => s.diffStaged)
  const diffCwd = useUiStore((s) => s.diffCwd)
  const setDiffContent = useUiStore((s) => s.setDiffContent)
  const setDiffStaged = useUiStore((s) => s.setDiffStaged)

  if (diffContent === null) return null

  return (
    <DiffOverlayContent
      key={`${diffStaged}:${diffContent}`}
      diffContent={diffContent}
      diffStaged={diffStaged}
      diffCwd={diffCwd}
      setDiffContent={setDiffContent}
      setDiffStaged={setDiffStaged}
    />
  )
}

function DiffOverlayContent({
  diffContent,
  diffStaged,
  diffCwd,
  setDiffContent,
  setDiffStaged
}: {
  diffContent: string
  diffStaged: boolean
  diffCwd: string
  setDiffContent: (value: string | null) => void
  setDiffStaged: (value: boolean) => void
}): React.JSX.Element {
  const contentRef = useRef<HTMLDivElement>(null)

  const [openFiles, setOpenFiles] = useState<Record<number, boolean>>({})
  const [openDirectories, setOpenDirectories] = useState<Record<string, boolean>>({})
  const [focusedFile, setFocusedFile] = useState(-1)
  const [focusedSidebarRow, setFocusedSidebarRow] = useState(0)
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const hunkIndexRef = useRef(-1)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const files = diffContent && diffContent !== '(no changes)' ? parseDiff(diffContent) : []
  const sidebarRows = getVisibleDiffSidebarRows(files, openFiles, openDirectories)
  const visibleFileRows = sidebarRows.filter((row) => row.type === 'file')

  useEffect(() => {
    return () => {
      if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
    }
  }, [])

  const isFileOpen = (i: number): boolean =>
    openFiles[i] ?? files[i].additions + files[i].deletions < COLLAPSE_THRESHOLD

  const toggleFile = (i: number): void => {
    setOpenFiles((prev) => ({ ...prev, [i]: !isFileOpen(i) }))
  }

  const isDirectoryOpen = (path: string): boolean => openDirectories[path] ?? true

  const toggleDirectory = (path: string): void => {
    setOpenDirectories((prev) => ({ ...prev, [path]: !isDirectoryOpen(path) }))
  }

  const scrollToFile = (index: number): void => {
    const el = contentRef.current?.querySelector(`[data-file-index="${index}"]`)
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const focusFile = (index: number): void => {
    setFocusedFile(index)
    const sidebarRowIndex = sidebarRows.findIndex(
      (row) => row.type === 'file' && row.index === index
    )
    if (sidebarRowIndex >= 0) setFocusedSidebarRow(sidebarRowIndex)
    scrollToFile(index)
  }

  const activateSidebarRow = (index: number): void => {
    const row = sidebarRows[index]
    if (!row) return
    if (row.type === 'directory') {
      toggleDirectory(row.path)
    } else {
      toggleFile(row.index)
    }
  }

  const focusRelativeFile = (direction: 1 | -1): void => {
    if (visibleFileRows.length === 0) return
    const currentIndex = visibleFileRows.findIndex((row) => row.index === focusedFile)
    const nextIndex =
      currentIndex === -1
        ? direction === 1
          ? 0
          : visibleFileRows.length - 1
        : Math.max(0, Math.min(currentIndex + direction, visibleFileRows.length - 1))
    focusFile(visibleFileRows[nextIndex].index)
  }

  const jumpToHunk = (direction: 'next' | 'prev'): void => {
    const hunks = contentRef.current?.querySelectorAll('[data-hunk-id]')
    if (!hunks || hunks.length === 0) return

    if (direction === 'next') {
      hunkIndexRef.current = Math.min(hunkIndexRef.current + 1, hunks.length - 1)
    } else {
      hunkIndexRef.current = Math.max(hunkIndexRef.current - 1, 0)
    }

    hunks[hunkIndexRef.current]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const closeDiff = (): void => {
    setDiffContent(null)
    requestAnimationFrame(() => {
      document.querySelector<HTMLTextAreaElement>('.textarea')?.focus()
    })
  }

  const toggleStaged = async (): Promise<void> => {
    const next = !diffStaged
    setDiffStaged(next)
    const result = await window.api.gitDiff(diffCwd, next)
    setDiffContent(result || '(no changes)')
  }

  return (
    <div
      className="pane-overlay"
      tabIndex={-1}
      ref={(el) => {
        if (el && !el.dataset.focused) {
          el.focus()
          el.dataset.focused = 'true'
        }
      }}
      onClick={closeDiff}
      onKeyDown={(e) => {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'BUTTON') return
        const el = contentRef.current
        if (!el) return

        // Handle two-key sequences (]c / [c)
        if (pendingKey) {
          const combo = pendingKey + e.key
          setPendingKey(null)
          if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
          if (combo === ']c') {
            jumpToHunk('next')
            e.preventDefault()
            return
          }
          if (combo === '[c') {
            jumpToHunk('prev')
            e.preventDefault()
            return
          }
          // Not a valid combo, fall through to normal handling
        }

        if (e.key === ']' || e.key === '[') {
          setPendingKey(e.key)
          if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current)
          pendingTimerRef.current = setTimeout(() => setPendingKey(null), 500)
          e.preventDefault()
          return
        }

        const line = 16
        const half = el.clientHeight / 2
        switch (e.key) {
          case 'j':
            el.scrollBy(0, line)
            break
          case 'k':
            el.scrollBy(0, -line)
            break
          case 'd':
            el.scrollBy(0, half)
            break
          case 'u':
            el.scrollBy(0, -half)
            break
          case 'g':
            el.scrollTo(0, 0)
            break
          case 'G':
            el.scrollTo(0, el.scrollHeight)
            break
          case 'n':
            focusRelativeFile(1)
            break
          case 'N':
            focusRelativeFile(-1)
            break
          case 'Enter':
          case 'o':
            activateSidebarRow(focusedSidebarRow)
            break
          case 's':
            e.preventDefault()
            toggleStaged()
            break
          case 'Escape':
          case 'q':
            closeDiff()
            break
          default:
            return
        }
        e.preventDefault()
      }}
    >
      <div className="pane-popup" onClick={(e) => e.stopPropagation()}>
        <div className="pane-popup-header">
          <span className="pane-popup-title">
            Diff {diffStaged ? '(staged)' : '(unstaged)'}
            <span className="diff-file-count">{files.length} files</span>
          </span>
          <span className="pane-popup-hint">j/k d/u scroll n/N file g/G ]c [c o s q</span>
          <button className="pane-popup-close" onClick={closeDiff}>
            Esc
          </button>
        </div>
        <div className="diff-layout">
          <aside className="diff-sidebar" aria-label="Changed files">
            {sidebarRows.length === 0 ? (
              <div className="diff-sidebar-empty">No files</div>
            ) : (
              sidebarRows.map((row, i) => (
                <button
                  key={row.id}
                  className={`diff-sidebar-row diff-sidebar-row-${row.type}${i === focusedSidebarRow ? ' diff-sidebar-row-active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (row.type === 'directory') {
                      setFocusedSidebarRow(i)
                      toggleDirectory(row.path)
                    } else {
                      focusFile(row.index)
                    }
                  }}
                  style={{ paddingLeft: `${8 + row.depth * 14}px` }}
                >
                  <span className="diff-sidebar-status">
                    {row.type === 'directory' ? (row.open ? '▾' : '▸') : row.open ? '•' : '◦'}
                  </span>
                  <span className="diff-sidebar-path" title={row.path}>
                    {row.name}
                  </span>
                  {row.type === 'file' && (
                    <span className="diff-sidebar-stats">
                      {row.additions > 0 && <span className="diff-stat-add">+{row.additions}</span>}
                      {row.deletions > 0 && <span className="diff-stat-del">-{row.deletions}</span>}
                    </span>
                  )}
                </button>
              ))
            )}
          </aside>
          <div ref={contentRef} className="pane-popup-content diff-content">
            {files.length === 0 ? (
              <div className="diff-empty">(no changes)</div>
            ) : (
              files.map((file, i) => (
                <DiffFileSection
                  key={i}
                  file={file}
                  open={isFileOpen(i)}
                  onToggle={() => toggleFile(i)}
                  focused={i === focusedFile}
                  fileIndex={i}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
