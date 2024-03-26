import {Commando} from '../../main/core/cli';
import {Cli_Basic} from '../../main/cli/basic';
import {Cli_Git} from '../../main/cli/git';


const commando = Commando.create(Cli_Basic, Cli_Git);
commando.setShell('/bin/bash');
commando.debug();
commando.ls();
commando.mkdir('pah');
commando.cd('pah', (commando) => {
	commando.echo('\n just one zevel: \n', {escape: true});
	commando.echo('Ze Zevel1', {toFile: {name: 'ashpa.txt', append: false}});
	commando.cat('ashpa.txt');
	commando.echo('\n double zevel: \n', {escape: true});
	commando.echo('Ze Zevel2', {toFile: {name: 'ashpa.txt', append: true}});
	commando.cat('ashpa.txt');
	commando.pwd();
	commando.echo('ls');
	commando.ls();
	commando.git.clone('git@github.com:nu-art-js/thunderstorm.git', {outputFolder: 'zevel'});
	commando.cd('zevel', (commando) => {
		commando.checkout('staging');
	});
});

commando.execute()
	.then((output) => {
		console.log(output);
		console.log('completed');
	})
	.catch(err => console.log(err));