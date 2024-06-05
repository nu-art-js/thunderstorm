import {BaseCommando} from '../../main/core/commando/BaseCommando';
import {Cli_Basic} from '../../main/cli/basic';
import {BeLogged, LogClient_Terminal} from '@nu-art/ts-common';
import {CommandoInteractive} from '../../main/core/commando/CommandoInteractive';


LogClient_Terminal.keepLogsNaturalColors();
BeLogged.addClient(LogClient_Terminal);

async function execute() {
	const commando1 = CommandoInteractive.create(Cli_Basic);
	const commando2 = CommandoInteractive.create(BaseCommando);
	const commando3 = CommandoInteractive.create(BaseCommando, Cli_Basic);
	const commando4 = CommandoInteractive.create(CommandoInteractive, Cli_Basic);
	const commando5 = CommandoInteractive.create(BaseCommando, CommandoInteractive, Cli_Basic);
	console.log(commando1.execute);
	console.log(commando2.execute);
	console.log(commando3.execute);
	console.log(commando4.execute);
	console.log(commando5.execute);
}

execute().then(() => {
	console.log('completed');
}).catch((err) => {
	console.error('error: ', err);
});

