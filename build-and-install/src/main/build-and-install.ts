import {BuildAndInstall} from './build-and-install-v3';
import {CommandoPool} from '@nu-art/commando/shell/core/CommandoPool';

(async () => {
	process.on('SIGINT', () => {
		console.log('GOT KILL SIGNAL');
		CommandoPool.killAll();
		return process.exit(0);
	});

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