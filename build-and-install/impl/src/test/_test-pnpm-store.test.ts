import {resolve} from 'path';
import {___dirname} from '@nu-art/ts-common/esm';

/**
 * All BAI test workspaces install into one shared, git-ignored pnpm store (build-and-install/impl/.trash/test-pnpm-store),
 * so the suite never prunes or fills the global store and each run reuses the previous run's packages.
 * Mocha loads every test file before running any test, so this applies to the whole suite.
 */
process.env.BAI_PNPM_STORE_DIR ||= resolve(___dirname(import.meta.url), '../../.trash/test-pnpm-store');
