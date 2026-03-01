/*
 * Stub for stormTester so tests compile without @nu-art/thunderstorm-backend.
 * Runs config.before(), run(), config.after(). Does not initialize modules.
 * Full Firebase tests require the real storm tester (phase-03) or app to register modules.
 */

import type {PermissionsTestConfig} from './helpers.js';

export async function stormTester(config: PermissionsTestConfig, run: () => Promise<void>): Promise<void> {
	await config.before?.();
	try {
		await run();
	} finally {
		await config.after?.();
	}
}
