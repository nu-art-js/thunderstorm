import {Commando_Basic, CommandoInteractive} from '../_common.js';
import {Result_Raw, TestCase_CommandoExecution, TestCases_CommandoExecution, TestInput_CommandoBuilder, TestResult_CommandoOutput} from './cases.js';
import {describe} from 'mocha';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';

const test = async (input: TestInput_CommandoBuilder): Promise<TestResult_CommandoOutput> => {
	const commando = CommandoInteractive.create(Commando_Basic);
	input(commando);
	const logs: Result_Raw = {out: [], err: []};
	commando.addLogProcessor((log, std) => {
		logs[std].push(log);
		return true;
	});

	try {
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

				resolve(result);
			});
		});
	} finally {
		await commando.kill();
	}
};
const runTestCase = (testCase: TestCase_CommandoExecution) => () => runSingleTestCase(test, testCase);

describe('Commando - Sync Execution', () => {
	it('echo command output', runTestCase(TestCases_CommandoExecution[0]));
	it('writes to both stdout and stderr', runTestCase(TestCases_CommandoExecution[1]));
	it('no command issued', runTestCase(TestCases_CommandoExecution[2]));
	it('echo environment variable', runTestCase(TestCases_CommandoExecution[3]));
	it('command using subshell output', runTestCase(TestCases_CommandoExecution[4]));
	it('echo multi-line string', runTestCase(TestCases_CommandoExecution[5]));
	it('chained commands', runTestCase(TestCases_CommandoExecution[6]));
	it('command with pipe', runTestCase(TestCases_CommandoExecution[7]));
	it('command with quotes', runTestCase(TestCases_CommandoExecution[8]));
	it('special characters', runTestCase(TestCases_CommandoExecution[9]));
	it('long output - 5 lines', runTestCase(TestCases_CommandoExecution[10]));
	it('unset environment variable', runTestCase(TestCases_CommandoExecution[11]));
	it('exported environment variable', runTestCase(TestCases_CommandoExecution[12]));
	it('invalid command', runTestCase(TestCases_CommandoExecution[13]));
	it('non-zero exit code', runTestCase({
		description: 'non-zero exit code',
		input: (commando) => {
			commando.append('exit 1');
		},
		error: {
			expected: 'Process exited with code: 1'
		}
	}));
	it('fail in middle of chain', runTestCase({
		description: 'fail in middle of chain',
		input: (commando) => {
			commando.append('echo Start && exit 1 && echo NeverRuns');
		},
		error: {
			expected: 'Process exited with code: 1'
		}
	}));
});
