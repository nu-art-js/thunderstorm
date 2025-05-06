import {TestSuite} from '@nu-art/ts-common/testing/types';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {expect} from 'chai';
import {Commando_Basic, CommandoInteractive} from '../../_common';
import {TestCases_CommandoExecution, Input, Result, Result_Raw} from './cases';

const test = async (input: Input): Promise<Result> => {
	const commando = CommandoInteractive.create(Commando_Basic);
	input(commando);
	const logs: Result_Raw = {out: [], err: []};
	commando.addLogProcessor((log, std) => {
		logs[std].push(log);
		return true;
	});

	try {
		return await new Promise<Result>((resolve, reject) => {
			commando.execute((stdout, stderr, code) => {
				if (code !== 0)
					return reject(new Error(`Process exited with code: ${code}`));

				const result: Result = {
					out: logs.out.join('\n'),
					err: logs.err.join('\n')
				};

				if (!result.out?.trim().length)
					delete result.out;

				if (!result.err?.trim().length)
					delete result.err;

				resolve(result);
			});
		});
	} finally {
		await commando.kill();
	}
};

export const TestSuite_SyncExecution: TestSuite<Input, Result> = {
	label: 'Commando - Sync Execution',
	testcases: [
		...TestCases_CommandoExecution,
		{
			description: 'non-zero exit code',
			input: (commando) => {
				commando.append('exit 1');
			},
			error: {
				expected: 'Process exited with code: 1'
			}
		},
		{
			description: 'fail in middle of chain',
			input: (commando) => {
				commando.append('echo Start && exit 1 && echo NeverRuns');
			},
			error: {
				expected: 'Process exited with code: 1'
			}
		},

	],
	processor: async (testCase) => {
		if ('error' in testCase)
			return expect(test(testCase.input)).to.be.rejectedWith(testCase.error.expected);

		expect(await test(testCase.input)).to.deep.equal(testCase.result);
	}
};

describe(TestSuite_SyncExecution.label, () => testSuiteTester(TestSuite_SyncExecution));

