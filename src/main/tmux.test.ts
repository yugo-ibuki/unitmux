import { describe, it, expect } from 'vitest'
import { _testInternals } from './tmux'

const { parseChoices, detectStatusClaude, trimCliFooter } = _testInternals

describe('parseChoices', () => {
  it('detects marker-style choices (❯ 1. Yes / 2. No)', () => {
    const content = [
      'Do you want to proceed?',
      ' ❯ 1. Yes',
      '   2. No'
    ].join('\n')

    const choices = parseChoices(content)
    expect(choices).toEqual([
      { number: '1', label: 'Yes' },
      { number: '2', label: 'No' }
    ])
  })

  it('detects colon-separated inline choices', () => {
    const content = [
      'Pick a deployment target:',
      '  1: staging    2: production   3: dev'
    ].join('\n')

    const choices = parseChoices(content)
    expect(choices).toEqual([
      { number: '1', label: 'staging' },
      { number: '2', label: 'production' },
      { number: '3', label: 'dev' }
    ])
  })

  it('ignores session rating feedback prompt', () => {
    const content = [
      '● How is Claude doing this session? (optional)',
      '  1: Bad    2: Fine   3: Good   0: Dismiss'
    ].join('\n')

    expect(parseChoices(content)).toEqual([])
  })

  it('detects dot-separated choices with ● marker', () => {
    const content = [
      'Some prompt text',
      ' ● 1. Option A',
      '   2. Option B',
      '   3. Option C'
    ].join('\n')

    const choices = parseChoices(content)
    expect(choices).toEqual([
      { number: '1', label: 'Option A' },
      { number: '2', label: 'Option B' },
      { number: '3', label: 'Option C' }
    ])
  })

  it('returns empty for content without choices', () => {
    const content = [
      '⏺ Here is a normal response.',
      '',
      'Some more text.'
    ].join('\n')

    expect(parseChoices(content)).toEqual([])
  })

  it('only looks at the last 20 lines', () => {
    const filler = Array(25).fill('filler line').join('\n')
    const content = filler + '\n ❯ 1. Yes\n   2. No'

    const choices = parseChoices(content)
    expect(choices).toEqual([
      { number: '1', label: 'Yes' },
      { number: '2', label: 'No' }
    ])
  })

  it('handles Bash tool permission prompt format', () => {
    const content = [
      ' Bash command',
      '',
      '   node -e "some code"',
      '',
      ' Command contains consecutive quote characters',
      '',
      ' Do you want to proceed?',
      ' ❯ 1. Yes',
      '   2. No'
    ].join('\n')

    const choices = parseChoices(content)
    expect(choices).toEqual([
      { number: '1', label: 'Yes' },
      { number: '2', label: 'No' }
    ])
  })
})

describe('detectStatusClaude', () => {
  it('returns waiting with choices when ✳ title and choices present', () => {
    const content = [
      'Some question?',
      ' ❯ 1. Yes',
      '   2. No'
    ].join('\n')

    const result = detectStatusClaude('✳ Claude Code', content)
    expect(result.status).toBe('waiting')
    expect(result.choices).toHaveLength(2)
  })

  it('detects choices even when title shows busy (⠂)', () => {
    // Permission prompts appear while title is still ⠂
    const content = [
      ' Do you want to proceed?',
      ' ❯ 1. Yes',
      '   2. No'
    ].join('\n')

    const result = detectStatusClaude('⠂ Claude Code', content)
    expect(result.status).toBe('waiting')
    expect(result.choices).toEqual([
      { number: '1', label: 'Yes' },
      { number: '2', label: 'No' }
    ])
  })

  it('returns busy when title is ⠂ and no choices', () => {
    const content = '⏺ Working on something...\n'

    const result = detectStatusClaude('⠂ Claude Code', content)
    expect(result.status).toBe('busy')
    expect(result.choices).toEqual([])
  })

  it('returns idle when ✳ title, no choices, no waiting patterns', () => {
    const content = 'Some past output\n'

    const result = detectStatusClaude('✳ Claude Code', content)
    expect(result.status).toBe('idle')
    expect(result.choices).toEqual([])
  })

  it('returns waiting for y/n prompts with ✳ title', () => {
    const content = 'Do you want to continue? (y/n)\n'

    const result = detectStatusClaude('✳ Claude Code', content)
    expect(result.status).toBe('waiting')
  })
})

describe('trimCliFooter', () => {
  it('removes CLI footer (separator + status lines)', () => {
    const content = [
      '⏺ Some response text',
      '',
      '─────────────────────────────────────',
      '❯ ',
      '─────────────────────────────────────',
      '  Session ID: abc123 | ⎇ main',
      '  Model: Opus 4.6',
      ''
    ].join('\n')

    const result = trimCliFooter(content)
    expect(result).toBe('⏺ Some response text\n')
  })

  it('preserves content when no footer present', () => {
    const content = '⏺ Just some text\nMore text\n'

    const result = trimCliFooter(content)
    expect(result).toBe('⏺ Just some text\nMore text\n')
  })

  it('preserves choices above the footer', () => {
    const content = [
      '● How is Claude doing this session?',
      '  1: Bad    2: Fine   3: Good   0: Dismiss',
      '',
      '─────────────────────────────────────',
      '❯ ',
      '─────────────────────────────────────',
      '  Session ID: abc123',
      ''
    ].join('\n')

    const result = trimCliFooter(content)
    expect(result).toContain('1: Bad')
    expect(result).toContain('3: Good')
    expect(result).not.toContain('Session ID')
  })

  it('does not strip content that contains ─ as part of normal text', () => {
    const content = '⏺ Some text\n── heading ──\nMore text\n'

    // Short separator within content (< 5 chars) should not trigger trimming
    // but this one has 2 ─ which is less than 5, so it won't match
    const result = trimCliFooter(content)
    expect(result).toContain('heading')
  })
})
