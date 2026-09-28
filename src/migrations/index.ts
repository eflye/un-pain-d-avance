import * as migration_20260927_200804_initial from './20260927_200804_initial';

export const migrations = [
  {
    up: migration_20260927_200804_initial.up,
    down: migration_20260927_200804_initial.down,
    name: '20260927_200804_initial'
  },
];
