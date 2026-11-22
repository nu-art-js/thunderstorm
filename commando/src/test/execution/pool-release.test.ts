import {expect} from 'chai';
import {afterEach, describe, it} from 'mocha';
import {sleep} from '@nu-art/ts-common';
import {CommandoPool} from '../_common.js';

const isAlive = (pid: number): boolean => {
	try {
		process.kill(pid, 0); // signal 0 checks existence and does not kill
		return true;
	} catch {
		return false;
	}
};

/** First integer line from `echo $$`. That line is this commando's bash pid. */
const bashPid = (stdout: string): number => {
	const line = stdout.split('\n').map(item => item.trim()).find(item => /^\d+$/.test(item));
	if (line === undefined)
		throw new Error(`no bash pid in stdout:\n${stdout}`);

	return Number(line);
};

describe('CommandoPool - release after one-shot execute', () => {
	afterEach(async () => {
		await CommandoPool.killAll();
	});

	it('one-shot bash does not stay idle after execute', async () => {
		const pids: number[] = [];
		for (let i = 0; i < 5; i++) {
			const commando = CommandoPool.allocateCommando(`reap-${i}`);
			// main has no getPid(). echo $$ prints the interactive bash pid.
			const stdout = await commando.append('echo $$').execute(out => out);
			pids.push(bashPid(stdout));
			// compileImpl stops here. main has no releaseCommando().
			await commando.append('true').execute();
		}

		await sleep(200);
		const stillAlive = pids.filter(isAlive);
		expect(stillAlive, 'one-shot shells must not stay idle').to.deep.equal([]);
	});
});
