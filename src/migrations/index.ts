import * as migration_20260723_133124 from './20260723_133124'

export const migrations = [
  {
    up: migration_20260723_133124.up,
    down: migration_20260723_133124.down,
    name: '20260723_133124',
  },
]
