import {expect} from 'chai';
import {sleep} from '@nu-art/ts-common';
import {CommandoPool} from '../_common.js';

const isAlive = (pid: number): boolean => {
	try {
		process.kill(pid, 0);
		return true;
	} catch {
		return false;
	}
};

describe('CommandoPool - release after one-shot execute', () => {
	afterEach(async () => {
		await CommandoPool.killAll();
	});

	it('allocate+execute+release reaps every one-shot bash', async () => {
		const pids: number[] = [];
		for (let i = 0; i < 5; i++) {
			const commando = CommandoPool.allocateCommando(`reap-${i}`);
			const pid = commando.getPid();
			expect(pid, 'allocated commando must have a bash pid').to.be.a('number');
			pids.push(pid!);
			await commando.append('true').execute();
			await CommandoPool.releaseCommando(commando);
		}

		await sleep(200);
		const stillAlive = pids.filter(isAlive);
		expect(stillAlive, 'released one-shot shells must not stay idle').to.deep.equal([]);
	});
});
