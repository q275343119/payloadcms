'use client'

import type { UIFieldClientProps } from 'payload'
import { useAllFormFields } from '@payloadcms/ui'
import { useEffect, useMemo, useState } from 'react'

import './MarkdownSourceEditor.css'

type ConversionError = {
  error?: string
}

type MarkdownResponse = ConversionError & {
  markdown?: string
  warnings?: string[]
}

type LexicalResponse = ConversionError & {
  lexical?: unknown
}

const discardMessage = '存在尚未应用的 Markdown 修改，确定要放弃吗？'

async function convert(body: Record<string, unknown>) {
  const response = await fetch('/api/markdown/convert', {
    body: JSON.stringify(body),
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
    },
    method: 'POST',
  })
  const result = (await response.json()) as ConversionError

  if (!response.ok) {
    throw new Error(result.error || 'Markdown 转换失败')
  }

  return result
}

type Props = UIFieldClientProps & {
  targetPath?: string
}

export const MarkdownSourceEditor = ({ targetPath = 'content' }: Props) => {
  const [fields, dispatchFields] = useAllFormFields()
  const lexicalValue = fields[targetPath]?.value
  const [isOpen, setIsOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [loadedMarkdown, setLoadedMarkdown] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [error, setError] = useState('')
  const isDirty = useMemo(() => markdown !== loadedMarkdown, [loadedMarkdown, markdown])

  useEffect(() => {
    if (!isDirty) return

    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }

    window.addEventListener('beforeunload', preventUnload)
    return () => window.removeEventListener('beforeunload', preventUnload)
  }, [isDirty])

  const loadMarkdown = async () => {
    setError('')
    setIsBusy(true)

    try {
      if (!lexicalValue) {
        setMarkdown('')
        setLoadedMarkdown('')
        setWarnings([])
        return
      }

      const result = (await convert({
        direction: 'lexical-to-markdown',
        lexical: lexicalValue,
      })) as MarkdownResponse
      const nextMarkdown = result.markdown || ''

      setMarkdown(nextMarkdown)
      setLoadedMarkdown(nextMarkdown)
      setWarnings(result.warnings || [])
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : 'Markdown 转换失败')
    } finally {
      setIsBusy(false)
    }
  }

  const openEditor = async () => {
    setIsOpen(true)
    await loadMarkdown()
  }

  const closeEditor = () => {
    if (isDirty && !window.confirm(discardMessage)) return
    setIsOpen(false)
    setError('')
  }

  const reloadMarkdown = async () => {
    if (isDirty && !window.confirm(discardMessage)) return
    await loadMarkdown()
  }

  const applyMarkdown = async () => {
    if (!markdown.trim()) {
      setError('Markdown 正文不能为空')
      return
    }

    setError('')
    setIsBusy(true)

    try {
      const result = (await convert({
        direction: 'markdown-to-lexical',
        markdown,
      })) as LexicalResponse

      if (!result.lexical) throw new Error('转换结果缺少正文数据')

      dispatchFields({
        initialValue: result.lexical,
        path: targetPath,
        type: 'UPDATE',
        value: result.lexical,
      })
      setLoadedMarkdown(markdown)
      setWarnings([])
      setIsOpen(false)
    } catch (conversionError) {
      setError(conversionError instanceof Error ? conversionError.message : 'Markdown 转换失败')
    } finally {
      setIsBusy(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="markdown-source-editor markdown-source-editor--closed">
        <button
          className="markdown-source-editor__toggle"
          disabled={isBusy}
          onClick={openEditor}
          type="button"
        >
          使用 Markdown 编辑
        </button>
        <span>辅助编辑入口；正文仍以 Payload Lexical 格式保存。</span>
      </div>
    )
  }

  return (
    <section className="markdown-source-editor" aria-label="Markdown 辅助编辑">
      <div className="markdown-source-editor__header">
        <div>
          <strong>Markdown 源码编辑</strong>
          <p>
            支持标题、强调、列表、任务列表、引用、链接、分隔线及代码；不执行 HTML 或
            MDX，不支持表格。应用会规范化无法映射的格式，且可能不可逆。
          </p>
        </div>
        <button disabled={isBusy} onClick={closeEditor} type="button">
          收起
        </button>
      </div>

      {warnings.length > 0 ? (
        <div className="markdown-source-editor__warnings" role="status">
          <strong>应用前请注意：</strong>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="markdown-source-editor__label" htmlFor="post-markdown-source">
        Markdown 源码
      </label>
      <textarea
        aria-label="Markdown 源码"
        className="markdown-source-editor__textarea"
        disabled={isBusy}
        id="post-markdown-source"
        onChange={(event) => setMarkdown(event.target.value)}
        spellCheck={false}
        value={markdown}
      />

      {error ? (
        <p className="markdown-source-editor__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="markdown-source-editor__actions">
        <button disabled={isBusy} onClick={applyMarkdown} type="button">
          {isBusy ? '转换中…' : '应用到正文'}
        </button>
        <button disabled={isBusy} onClick={reloadMarkdown} type="button">
          从正文重新载入
        </button>
        <span>只有“应用到正文”后，修改才会进入草稿自动保存。</span>
      </div>
    </section>
  )
}
