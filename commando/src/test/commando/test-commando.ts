import {Cli_Basic} from '../../main/cli/basic';
import {BeLogged, LogClient_Terminal} from '@nu-art/ts-common';
import {CommandoInteractive} from '../../main/shell';


LogClient_Terminal.keepLogsNaturalColors();
BeLogged.addClient(LogClient_Terminal);

async function execute() {
	const commando = CommandoInteractive.create(Cli_Basic);
	const commando1 = commando.append('asdas');
	const commando2 = commando1.echo('hello world');
	await commando2.execute();
	commando2.kill('SIGINT');
}

execute().then(() => {
	console.log('completed');
}).catch((err) => {
	console.error('error: ', err);
});

