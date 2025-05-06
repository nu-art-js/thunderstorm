// file: ./tests/command-resolution.ts

import {expect} from 'chai';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {resolveCommandName} from '../src/command/cli-resolver';

export type Input = { rawInput: string[] };
export type Result = string;

export const Tests_CommandResolution: TestSuite<Input, Result> = {
	label: 'CommandResolution',
	testcases: [
		{
			description: 'Simple root command',
			input: { rawInput: ['help'] },
			result: 'help'
		},
		{
			description: 'Unknown command',
			input: { rawInput: ['does-not-exist'] },
			error: {
				expected: 'Command not found'
			}
		},
		{
			description: 'Nested command resolution',
			input: { rawInput: ['workspace', 'add'] },
			result: 'workspace/add'
		}
	],

	processor: async (testCase) => {
		const input = testCase.input;

		if ('error' in testCase) {
			expect(() => resolveCommandName(input.rawInput)).to.throw(testCase.error.expected);
			return;
		}

		const result = resolveCommandName(input.rawInput);
		expect(result).to.deep.equal(testCase.result);
	}
};

describe('CommandResolution', () => testSuiteTester(Tests_CommandResolution));
