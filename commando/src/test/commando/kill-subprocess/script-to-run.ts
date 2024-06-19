import {sleep} from '@nu-art/ts-common';


const execute = async () => {
	console.log('STARTED');
	await sleep(1000000);
	console.log('ENDED');
};

// process.on('SIGINT', () => {
// 	console.log('Received SIGINT in child process.');
//
// });

execute()
	.then(() => console.log('completed'))
	.catch(err => console.error(err));