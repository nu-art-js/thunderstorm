import {expect} from 'chai';
import {describe} from 'mocha';
import {basename} from 'node:path';
import {Commando_Basic, CommandoInteractive} from '../_common.js';

describe('Commando - Cleanup', () => {
	it('SIGINT ends the bash session', async () => {
		const commando = CommandoInteractive.create(Commando_Basic);
		try {
			commando.append('ps -o comm= -p $PPID');
			const parent = await commando.execute((stdout, _stderr, code) => {
				if (code !== 0)
					throw new Error(`ps exited with code: ${code}`);
				return stdout.trim();
			});
			expect(basename(parent)).to.equal('node');
			await commando.kill('SIGINT');
		} finally {
			await commando.kill('SIGKILL');
		}
	});
});
