import {CommandoInteractive} from '../../main/core/cli';
import {BeLogged, LogClient_Terminal, sleep} from '@nu-art/ts-common';
import {Cli_Basic} from '../../main/cli/basic';


BeLogged.addClient(LogClient_Terminal);

const commando = CommandoInteractive
	.create(Cli_Basic);

commando
	.cd('/Users/tacb0ss/dev/quai/test/quai-web/app-advisor-backend')
	.append('array=($(lsof -ti:8302,8303,8304,8305,8306,8307,8308,8309,8310,8311))')
	.append('((${#array[@]} > 0)) && kill -9 "${array[@]}"')
	.append('firebase emulators:start &')
	.append('pid=$!')
	.append(`echo "FIREBASE PID PROCESS \${pid}"`)
	.append(`wait \$pid`)
	.execute()
	.then(async () => {
		console.log('Process running');
		await sleep(20000);
		await commando.gracefullyKill();
	})
	.catch(err => {
		console.error('Main process error', err);
	});