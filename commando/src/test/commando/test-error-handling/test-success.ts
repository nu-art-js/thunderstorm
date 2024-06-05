import {Commando, CommandoInteractive} from '../../../main/core/cli';
import {Cli_Basic} from '../../../main/cli/basic';
import {BeLogged, generateHex, LogClient_Terminal} from '@nu-art/ts-common';
import {Cli_Git} from '../../../main/cli/git';


LogClient_Terminal.keepLogsNaturalColors();
BeLogged.addClient(LogClient_Terminal);

const commando = CommandoInteractive.create(Cli_Basic, Cli_Git);

async function execute() {
	commando.append('rm -rf /tmp/dev-tools');
	await commando.git_clone('git@github.com:nu-art/dev-tools.git', {outputFolder: '/tmp/dev-tools'});
	commando.append('rm -rf /tmp/dev-tools');
	await commando.git_clone('git@github.com:nu-art/dev-tool1s.git', {outputFolder: '/tmp/dev-tools'});
	await commando.git_clone('git@github.com:nu-art/dev-tool1s.git', {outputFolder: '/tmp/dev-tools'});
	await commando.git_clone('git@github.com:nu-art/dev-tools.git', {outputFolder: '/tmp/dev-tools'});
}

execute().then(() => {
	console.log('completed');
}).catch((err) => {
	console.error('error: ', err);
});
;


