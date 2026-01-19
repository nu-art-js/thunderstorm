/**
 * Main entry point for build-and-install CLI.
 *
 * Creates a BuildAndInstall instance, builds the workspace, and executes all phases.
 * Exits with code 0 on success, or logs errors and exits with code 0 (should probably exit with 1 on error).
 */
import {BuildAndInstall} from './BuildAndInstall.js';

(async () => {
	const buildAndInstall = new BuildAndInstall();
	await buildAndInstall.build();
	await buildAndInstall.run();
})()
	.catch((err) => {
		console.error(err);
		process.exit(2);
	})
	.then(() => process.exit(0));