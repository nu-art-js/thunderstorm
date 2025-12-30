/**
 * Main entry point for build-and-install CLI.
 * 
 * Creates a BuildAndInstall instance, builds the workspace, and executes all phases.
 * Exits with code 0 on success, or logs errors and exits with code 0 (should probably exit with 1 on error).
 */
import {BuildAndInstall} from './build-and-install-v3.js';

(async () => {
	const buildAndInstall = new BuildAndInstall();
	await buildAndInstall.build();
	await buildAndInstall.run();
})()
	.catch(console.error)
	.then(() => process.exit(0));

// .execute()
// 	.then(() => {
// 	})
// 	.catch(err => {
// 		process.on('SIGINT', () => {
// 			console.log('Failed with error: ', err);
// 			return process.exit(1);
// 		});
// 	});