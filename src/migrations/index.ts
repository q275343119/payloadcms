import * as migration_20260723_133124 from './20260723_133124'
import * as migration_20260813_101042_media_prefix from './20260813_101042_media_prefix'

export const migrations = [
  {
    up: migration_20260723_133124.up,
    down: migration_20260723_133124.down,
    name: '20260723_133124',
  },
  {
    up: migration_20260813_101042_media_prefix.up,
    down: migration_20260813_101042_media_prefix.down,
    name: '20260813_101042_media_prefix',
  },
]
