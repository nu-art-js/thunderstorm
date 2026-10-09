import {resolve} from 'path';
import {existsSync, linkSync, lstatSync, mkdirSync, readdirSync} from 'fs';
import {___dirname} from '@nu-art/ts-common/esm';

/**
 * All BAI test workspaces install into one shared, git-ignored pnpm store (build-and-install/impl/.trash/test-pnpm-store),
 * so the suite never prunes or fills the global store and each run reuses the previous run's packages.
 * Mocha loads every test file before running any test, so this applies to the whole suite.
 */
process.env.BAI_PNPM_STORE_DIR ||= resolve(___dirname(import.meta.url), '../../.trash/test-pnpm-store');

/**
 * install() runs `pnpm store prune` before installing, and test workspaces are deleted between tests, so the prune
 * would empty the shared store and every install would download everything again. pnpm prunes store files that
 * nothing else hard-links to, so after each test hard-link every store file into a sibling git-ignored pin folder.
 * Test-only: BAI's install/prune behavior is unchanged.
 */
const storeDir = process.env.BAI_PNPM_STORE_DIR;
const pinDir = `${storeDir}-pin`;

function pinStoreFiles(dir: string, pinned: string) {
	if (!existsSync(dir))
		return;

	for (const name of readdirSync(dir)) {
		if (name === 'projects' || name === 'tmp')
			continue;

		const source = resolve(dir, name);
		const target = resolve(pinned, name);
		const stat = lstatSync(source);
		if (stat.isDirectory()) {
			mkdirSync(target, {recursive: true});
			pinStoreFiles(source, target);
		} else if (stat.isFile() && !existsSync(target))
			linkSync(source, target);
	}
}

before(() => pinStoreFiles(storeDir, pinDir));
afterEach(() => pinStoreFiles(storeDir, pinDir));
