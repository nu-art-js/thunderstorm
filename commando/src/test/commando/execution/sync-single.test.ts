import {TestSuite} from '@nu-art/ts-common/testing/types';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {expect} from 'chai';
import {Commando_Basic, CommandoInteractive, SimpleTestCommando} from '../../_common';
import {TestCases_CommandoExecution, Input, Result, Result_Raw} from './cases';

let commando: SimpleTestCommando;
const logs: Result_Raw = {out: [], err: []};


const test = async (input: Input): Promise<Result> => {
	input(commando);

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

			logs.out.length = 0;
			logs.err.length = 0;

			resolve(result);
		});
	});
};

export const TestSuite_SingleCommandoExecution: TestSuite<Input, Result> = {
	label: 'Commando - Single Shared Commando Execution',
	testcases: TestCases_CommandoExecution,
	before: () => {
		commando = CommandoInteractive.create(Commando_Basic);
		commando.addLogProcessor((log, std) => {
			logs[std].push(log);
			return true;
		});
	},
	processor: async (testCase) => {
		if ('error' in testCase)
			return expect(test(testCase.input)).to.be.rejectedWith(testCase.error.expected);

		expect(await test(testCase.input)).to.deep.equal(testCase.result);
	},
	after: async () => {
		await commando.kill();
	}
};

describe(TestSuite_SingleCommandoExecution.label, () => testSuiteTester(TestSuite_SingleCommandoExecution));


