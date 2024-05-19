import {sleep} from '@nu-art/ts-common';


const execute = async () => {
	console.log('STARTED');
	await sleep(10000);
	console.log('ENDED');
};

execute()
	.then(() => console.log('completed'))
	.catch(err => console.error(err));