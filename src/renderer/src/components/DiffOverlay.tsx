import { useRef } from 'react'
import { useUiStore } from '../stores/uiStore'
import { parseDiff } from '../utils/parseDiff'
import { DiffFileSection } from './DiffFileSection'

export function DiffOverlay(): React.JSX.Element | null {
  const diffContent = useUiStore((s) => s.diffContent)
  const diffStaged = useUiStore((s) => s.diffStaged)
  const diffCwd = useUiStore((s) => s.diffCwd)
  const setDiffContent = useUiStore((s) => s.setDiffContent)
  const setDiffStaged = useUiStore((s) => s.setDiffStaged)
  const contentRef = useRef<HTMLDivElement>(null)

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

  if (diffContent === null) return null

  const files = diffContent && diffContent !== '(no changes)' ? parseDiff(diffContent) : []

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
          <span className="pane-popup-hint">s toggle j/k d/u g/G q</span>
          <button className="pane-popup-close" onClick={closeDiff}>
            Esc
          </button>
        </div>
        <div ref={contentRef} className="pane-popup-content diff-content">
          {files.length === 0 ? (
            <div className="diff-empty">(no changes)</div>
          ) : (
            files.map((file, i) => <DiffFileSection key={i} file={file} />)
          )}
        </div>
      </div>
    </div>
  )
}
