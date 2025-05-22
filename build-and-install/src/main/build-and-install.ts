import {BuildAndInstall} from './build-and-install-v3';

(async () => {
	const buildAndInstall = new BuildAndInstall();
	await buildAndInstall.build();
	await buildAndInstall.run();
})()
	.catch(console.error)
	.then(() => process.exit(0));