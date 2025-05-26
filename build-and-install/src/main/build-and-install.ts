import {BuildAndInstall} from './build-and-install-v3';

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