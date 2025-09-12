import {Commando_Basic, CommandoInteractive, SimpleTestCommando} from '../_common.js';
import {TestInput_CommandoBuilder, TestResult_CommandoOutput, Result_Raw, TestCases_CommandoExecution, TestSuite_CommandoExecution} from './cases.js';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {describe} from 'mocha';

let commando: SimpleTestCommando;
const logs: Result_Raw = {out: [], err: []};


const test = async (input: TestInput_CommandoBuilder): Promise<TestResult_CommandoOutput> => {
	input(commando);

	return await new Promise<TestResult_CommandoOutput>((resolve, reject) => {
		commando.execute((stdout, stderr, code) => {
			if (code !== 0)
				return reject(new Error(`Process exited with code: ${code}`));

			const result: TestResult_CommandoOutput = {
				out: logs.out.join('\n'),
				err: logs.err.join('\n')
			};

			if (!result.out?.trim().length)
				delete result.out;

			if (!result.err?.trim().length)
				delete result.err;

			logs.out.length = 0;
			logs.err.length = 0;

			resolve(result);
		});
	});
};
const runTestCase = (testCase: TestSuite_CommandoExecution['testcases'][number]) => runSingleTestCase(test, testCase);

describe('Commando - Single Shared Commando Execution', () => {
	before(() => {
		commando = CommandoInteractive.create(Commando_Basic);
		commando.addLogProcessor((log, std) => {
			logs[std].push(log);
			return true;
		});
	});

	it('echo command output', () => {
		return runTestCase(TestCases_CommandoExecution[0]);
	});

	it('writes to both stdout and stderr', () => {
		return runTestCase(TestCases_CommandoExecution[1]);
	});

	it('no command issued', () => {
		return runTestCase(TestCases_CommandoExecution[2]);
	});

	it('echo environment variable', () => {
		return runTestCase(TestCases_CommandoExecution[3]);
	});

	it('command using subshell output', () => {
		return runTestCase(TestCases_CommandoExecution[4]);
	});

	it('echo multi-line string', () => {
		return runTestCase(TestCases_CommandoExecution[5]);
	});

	it('chained commands', () => {
		return runTestCase(TestCases_CommandoExecution[6]);
	});

	it('command with pipe', () => {
		return runTestCase(TestCases_CommandoExecution[7]);
	});

	it('command with quotes', () => {
		return runTestCase(TestCases_CommandoExecution[8]);
	});

	it('special characters', () => {
		return runTestCase(TestCases_CommandoExecution[9]);
	});

	it('long output - 5 lines', () => {
		return runTestCase(TestCases_CommandoExecution[10]);
	});

	it('unset environment variable', () => {
		return runTestCase(TestCases_CommandoExecution[11]);
	});

	it('exported environment variable', () => {
		return runTestCase(TestCases_CommandoExecution[12]);
	});

	it('invalid command', () => {
		return runTestCase(TestCases_CommandoExecution[13]);
	});

	after(async () => {
		await commando.kill();
	});
});


