import {expect} from 'chai';
import {describe} from 'mocha';
import {Commando_Basic, CommandoInteractive} from '../_common.js';

describe('Commando - Cleanup', () => {
	it('SIGINT ends the bash session', async () => {
		const commando = CommandoInteractive.create(Commando_Basic);
		try {
			commando.append('echo $PPID');
			const parentPid = await commando.execute((stdout, _stderr, code) => {
				if (code !== 0)
					throw new Error(`echo exited with code: ${code}`);
				return Number(stdout.trim());
			});
			expect(parentPid).to.equal(process.pid);
			await commando.kill('SIGINT');
		} finally {
			await commando.kill('SIGKILL');
		}
	});
});
