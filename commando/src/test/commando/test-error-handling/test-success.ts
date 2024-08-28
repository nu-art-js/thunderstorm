import {Commando, CommandoInteractive} from '../../../main/core/cli';
import {Commando_Basic} from '../../../main/shell/plugins/basic';
import {BeLogged, generateHex, LogClient_Terminal} from '@thunder-storm/common';
import {Commando_Git} from '../../../main/shell/plugins/git';


LogClient_Terminal.keepLogsNaturalColors();
BeLogged.addClient(LogClient_Terminal);

const commando = CommandoInteractive.create(Commando_Basic, Commando_Git);

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


