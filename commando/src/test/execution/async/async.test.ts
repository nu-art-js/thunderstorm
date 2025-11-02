import {TestSuite} from '@nu-art/ts-common/testing/types';
import {DefaultTestProcessor, defaultTestProcessor, runSingleTestCase, TestCase_Error} from '@nu-art/ts-common/testing/consts';
import {expect} from 'chai';
import {Commando_Basic, CommandoInteractive, ShellLogProcessor, SimpleTestCommando} from '../../_common.js';
import {ExpectedResult, Result_Raw, TestResult_CommandoOutput} from '../cases.js';
import {BadImplementationException, sleep} from '@nu-art/ts-common';
import {___dirname} from '@nu-art/ts-common/esm';

const dirname = ___dirname(import.meta.url);
type Input = (commando: SimpleTestCommando, pidListener: (pid: number, signal: NodeJS.Signals) => Promise<void>) => (number | void);

let commando: SimpleTestCommando;
const logs: Result_Raw = {out: [], err: []};
const testAsync = async (input: Input): Promise<TestResult_CommandoOutput> => {
	return new Promise<TestResult_CommandoOutput>(resolve => {
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

			const result: TestResult_CommandoOutput = {
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

type TestSuite_CommandoAsync = TestSuite<Input, ExpectedResult>;

const testValidator: DefaultTestProcessor = async (promisedResult: Promise<TestResult_CommandoOutput>, expectedResult?: (ExpectedResult | (() => Promise<any>)), error?: TestCase_Error) => {
	if (error)
		return expect(promisedResult).to.be.rejectedWith(error.expected);
	else if (!expectedResult)
		throw new BadImplementationException('MUST provide expectedResult or error');

	if (typeof expectedResult === 'function')
		return await (expectedResult as () => Promise<any>)();

	const actualResult = await promisedResult;
	if (!expectedResult)
		return;

	if (expectedResult.out instanceof RegExp)
		expect(actualResult.out).to.match(expectedResult.out);
	else if (typeof expectedResult.out === 'string')
		expect(actualResult.out).to.equal(expectedResult.out);
	else
		expect(actualResult.out).to.be.undefined;

	if (expectedResult.err instanceof RegExp)
		expect(actualResult.err).to.match(expectedResult.err);
	else if (typeof expectedResult.err === 'string')
		expect(actualResult.err).to.equal(expectedResult.err);
	else
		expect(actualResult.err).to.be.undefined;

	if ('exitCode' in expectedResult)
		expect(actualResult.exitCode).to.equal(expectedResult.exitCode);

};
const runTestCase = (testCase: TestSuite_CommandoAsync['testcases'][number], processor?: typeof defaultTestProcessor) => () => runSingleTestCase(testAsync, testCase, processor);

describe('Commando - Async Execution', () => {
	before(() => {
		commando = CommandoInteractive.create(Commando_Basic);
		commando.addLogProcessor((log, std) => {
			logs[std].push(log);
			return true;
		});
	});
	it('Run file async', runTestCase({
		description: 'Run file async',
		input: (commando) => {
			commando.appendAsync(`bash ${dirname}/sleep-script-2s.sh`);
			return 1;
		},
		result: {
			out: 'Start\nEnd',
			exitCode: 0
		},
	})).timeout(5000);

	it('Run file async, and SIGINT the process', runTestCase({
		description: 'Run file async, and SIGINT the process',
		input: (commando, pidListener) => {
			commando.appendAsync(`bash ${dirname}/sleep-script-2s.sh`, async pid => {
					await sleep(1000);
					await pidListener(pid, 'SIGINT');
				}
			);
		},
		result: {
			out: 'Start\nEnd',
			exitCode: 0
		},
	})).timeout(5000);

	it('Run file async, and SIGTERM the process', runTestCase({
		description: 'Run file async, and SIGTERM the process',
		input: (commando, pidListener) => {
			commando.appendAsync(`bash ${dirname}/sleep-script-2s.sh`, async pid => {
					await sleep(1000);
					await pidListener(pid, 'SIGTERM');
				}
			);
		},
		result: {
			out: 'Start\nCaught SIGTERM (15)',
			exitCode: 15
		},
	})).timeout(5000);

	it('Run file async, and SIGKILL the process', runTestCase({
		description: 'Run file async, and SIGKILL the process',
		input: (commando, pidListener) => {
			commando.appendAsync(`bash ${dirname}/sleep-script-2s.sh`, async pid => {
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
	}, testValidator)).timeout(5000);

	it('Run file async with small sleeps, and kill the process', runTestCase({
		description: 'Run file async with small sleeps, and kill the process',
		input: (commando, pidListener) => {
			commando.appendAsync(`bash ${dirname}/sleep-script-50x0.2.sh`, async pid => {
					await sleep(1000);
					await pidListener(pid, 'SIGTERM');
				}
			);
		},
		result: {
			out: 'Start\nCaught SIGTERM (15)',
		},
	}, testValidator)).timeout(5000);

	it('Run file async with small sleeps, and kill wrong process', runTestCase({
		// this one is a problem, there is no way to tell whether this process even existed or stopped running.. not sure how to test this
		description: 'Run file async with small sleeps, and kill wrong process',
		input: (commando, pidListener) => {
			commando.appendAsync(`bash ${dirname}/sleep-script-2s.sh`, async pid => {
					await sleep(1000);
					await pidListener(pid + 1, 'SIGTERM');
				}
			);
		},
		result: {
			out: 'Start\nEnd',
			err: 'Terminated: 15'
		},
	}, testValidator)).timeout(5000);


	after(async () => {
		await commando.kill('SIGKILL');
	});
});
