// file: ./commando/execution/async.test.ts

import {TestSuite} from '@nu-art/ts-common/testing/types';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {expect} from 'chai';
import {Commando_Basic, CommandoInteractive, ShellLogProcessor, SimpleTestCommando} from '../../../_common';
import {ExpectedResult, Result, Result_Raw} from '../cases';
import {sleep} from '@nu-art/ts-common';

type Input = (commando: SimpleTestCommando, pidListener: (pid: number, signal: NodeJS.Signals) => Promise<void>) => (number | void);

let commando: SimpleTestCommando;
const logs: Result_Raw = {out: [], err: []};
const testAsync = async (input: Input): Promise<Result> => {
	return new Promise<Result>(resolve => {
		let counter = 0;
		let exitCode = -2;
		let maxCounter = 2;
		const logs: Result_Raw = {out: [], err: []};
		const logProcessor: ShellLogProcessor = (log, std) => {
			console.log(`GOT TO logProcessor:${std} - ${log}`);
			logs[std].push(log);
			return true;
		};

		function collectResult() {
			counter++;
			if (counter !== maxCounter)
				return;

			const result: Result = {
				out: logs.out.join('\n'),
				err: logs.err.join('\n'),
				exitCode
			};

			if (!result.out?.trim().length)
				delete result.out;

			if (!result.err?.trim().length)
				delete result.err;

			logs.out.length = 0;
			logs.err.length = 0;
			commando.removeLogProcessor(logProcessor);
			console.log('GOT TO collectResult');
			resolve(result);
		}

		maxCounter = input(commando, async (pid, signal) => {
			await commando.killSubprocess(pid, signal);
			console.log('GOT TO listener');
			collectResult();
		}) ?? 2;

		commando.addLogProcessor(logProcessor);

		return commando.execute((stdout, stderr, code) => {
				console.log('GOT TO execute');
				exitCode = code;
				collectResult();
			}
		);
	});
};

export const TestSuite_AsyncExecution: TestSuite<Input, ExpectedResult> = {
	label: 'Commando - Async Execution',
	testcases: [
		{
			description: 'Run file async',
			input: (commando) => {
				commando.appendAsync(`bash ${__dirname}/sleep-script-2s.sh`);
				return 1;
			},
			result: {
				out: 'Start\nEnd',
			},
		},
		{
			description: 'Run file async, and SIGINT the process',
			input: (commando, pidListener) => {
				commando.appendAsync(`bash ${__dirname}/sleep-script-2s.sh`, async pid => {
						await sleep(1000);
						await pidListener(pid, 'SIGINT');
					}
				);
			},
			result: {
				out: 'Start\nEnd',
			},
		},
		{
			description: 'Run file async, and SIGTERM the process',
			input: (commando, pidListener) => {
				commando.appendAsync(`bash ${__dirname}/sleep-script-2s.sh`, async pid => {
						await sleep(1000);
						await pidListener(pid, 'SIGTERM');
					}
				);
			},
			result: {
				out: 'Start\nCaught SIGTERM (15)',
				exitCode: 15
			},
		},
		{
			description: 'Run file async, and SIGKILL the process',
			input: (commando, pidListener) => {
				commando.appendAsync(`bash ${__dirname}/sleep-script-2s.sh`, async pid => {
						await sleep(1000);
						await pidListener(pid, 'SIGKILL');
					}
				);
			},
			result: {
				err: /\/bin\/bash: line.*Killed: 9/,
				out: 'Start',
				exitCode: 137
			},
		},
		{
			description: 'Run file async with small sleeps, and kill the process',
			input: (commando, pidListener) => {
				commando.appendAsync(`bash ${__dirname}/sleep-script-50x0.2.sh`, async pid => {
						await sleep(1000);
						await pidListener(pid, 'SIGTERM');
					}
				);
			},
			result: {
				out: 'Start\nCaught SIGTERM (15)',
			},
		},
		{
			// this one is a problem, there is no way to tell whether this process even existed or stopped running.. not sure how to test this
			description: 'Run file async with small sleeps, and kill wrong process',
			input: (commando, pidListener) => {
				commando.appendAsync(`bash ${__dirname}/sleep-script-2s.sh`, async pid => {
						await sleep(1000);
						await pidListener(pid + 1, 'SIGTERM');
					}
				);
			},
			result: {
				out: 'Start\nEnd',
				err: 'Terminated: 15'
			},
		}
	],
	before: () => {
		commando = CommandoInteractive.create(Commando_Basic);
		commando.addLogProcessor((log, std) => {
			logs[std].push(log);
			return true;
		});
	},
	processor: async (testCase) => {
		if ('error' in testCase)
			return expect(testAsync(testCase.input)).to.be.rejectedWith(testCase.error.expected);

		const actualResult = await testAsync(testCase.input);
		const expected = testCase.result;

		if (expected.out instanceof RegExp)
			expect(actualResult.out).to.match(expected.out);
		else if (typeof expected.out === 'string')
			expect(actualResult.out).to.equal(expected.out);
		else
			expect(actualResult.out).to.be.undefined;

		if (expected.err instanceof RegExp)
			expect(actualResult.err).to.match(expected.err);
		else if (typeof expected.err === 'string')
			expect(actualResult.err).to.equal(expected.err);
		else
			expect(actualResult.err).to.be.undefined;

		if ('exitCode' in expected)
			expect(actualResult.exitCode).to.equal(expected.exitCode);
	},
	after: async () => {
		await commando.kill('SIGKILL');
	}
};

describe(TestSuite_AsyncExecution.label, () => testSuiteTester(TestSuite_AsyncExecution));
