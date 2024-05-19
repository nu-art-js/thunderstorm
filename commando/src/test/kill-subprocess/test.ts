import {CommandoInteractive} from '../../main/core/cli';
import {BeLogged, LogClient_Terminal, sleep} from '@nu-art/ts-common';


BeLogged.addClient(LogClient_Terminal);

const commando = CommandoInteractive
	.create();

commando
	.append('ts-node ./script-to-run.ts')
	.execute()
	.then(async () => {
		console.log('Process running');
		await sleep(5000);

	})
	.catch(err => {
		console.error('Main process error', err);
	});