import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@payloadcms/db-postgres', async () => {
  const actual = await vi.importActual<typeof import('@payloadcms/db-postgres')>(
    '@payloadcms/db-postgres',
  )

  return {
    ...actual,
    sql: (strings: TemplateStringsArray, ...values: unknown[]) =>
      strings.reduce((statement, part, index) => statement + part + (values[index] ?? ''), ''),
  }
})

import { migrations } from '@/migrations'

describe('media storage migration', () => {
  const execute = vi.fn<(statement: string) => Promise<void>>()

  beforeEach(() => {
    execute.mockReset()
    execute.mockResolvedValue(undefined)
  })

  it('adds and removes the prefix column used by the S3 adapter', async () => {
    const migration = migrations.at(-1)

    expect(migration).toBeDefined()
    if (!migration) return

    await migration.up({ db: { execute } } as never)
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE "media" ADD COLUMN "prefix" varchar'),
    )

    execute.mockClear()

    await migration.down({ db: { execute } } as never)
    expect(execute).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE "media" DROP COLUMN "prefix"'),
    )
  })
})
