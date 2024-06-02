import {Cli_Basic} from '../../main/cli/basic';
import {BeLogged, LogClient_Terminal} from '@nu-art/ts-common';
import {CommandoInteractive} from '../../main/shell';


LogClient_Terminal.keepLogsNaturalColors();
BeLogged.addClient(LogClient_Terminal);

async function execute() {
	const commando = CommandoInteractive.create(Cli_Basic);
	commando.echo('hello world 0', {escape: true});
	commando.echo('hello world 1', {escape: true});
	commando.echo('hello world 2', {escape: true});
	commando.echo('hello world 3', {escape: true});
	commando.echo('hello world 4', {escape: true});
	commando.echo('hello world 5', {escape: true});
	commando.echo('hello world 6', {escape: true});
	commando.echo('hello world 7', {escape: true})
		.debug();
	await commando.execute();
	// commando.kill('SIGINT');
}

execute().then(() => {
	console.log('completed');
}).catch((err) => {
	console.error('error: ', err);
});

