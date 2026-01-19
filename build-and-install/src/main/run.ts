import {BuildAndInstall} from './BuildAndInstall.js';

(async () => {
	const buildAndInstall = new BuildAndInstall();
	await buildAndInstall.build();
	await buildAndInstall.run();
})()
	.catch((err) => {
		process.exit(2);
	})
	.then(() => process.exit(0));