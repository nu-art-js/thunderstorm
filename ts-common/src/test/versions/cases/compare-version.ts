import {TestSuite} from '../../../main/testing/types';
import {compareVersions, debounce, timeout} from '../../../main';
import {expect,} from 'chai';

const versions = [
	'0.0.0',
	'0.0.1',
	'0.0.2',
	'0.1.0',
	'0.1.1',
	'0.1.2',
	'0.2.0',
	'0.2.1',
	'0.2.2',
	'1.0.0',
	'1.0.1',
	'1.0.2',
	'1.1.1',
	'1.1.2',
	'1.2.1',
	'1.2.2',
	'2.0.0',
	'2.0.1',
	'2.0.2',
	'2.1.1',
	'2.1.2',
	'2.2.1',
	'2.2.2',
	'2.2.3-suffix',
	'2.3.0-suffix',
	'2.3.1-suffix',
	'2.3.2-suffix',
	'2.3.3-suffix',
	'prefix-2.3.4-suffix',
	'prefix-2.4.0-suffix',
	'prefix-2.4.1',
];

type Input = {
	firstVersion: string,
	secondVersion: string
}

type TestSuit_CompareVersion = TestSuite<Input, -1 | 0 | 1>;
const description = (testCase: TestSuit_CompareVersion ['testcases'][number]) => `Compare: ${testCase.input.firstVersion} <> ${testCase.input.secondVersion}`;
const TestCases_CompareVersion: TestSuit_CompareVersion['testcases'] = [];

for (let i = 0; i < versions.length; i++) {
	for (let j = 0; j < versions.length; j++) {
		let expected: -1 | 0 | 1;
		if (i < j)
			expected = 1;
		else if (i === j)
			expected = 0;
		else
			expected = -1;

		const testCase = {
			description,
			result: expected,
			input: {
				firstVersion: versions[i],
				secondVersion: versions[j],
			},
		};
		TestCases_CompareVersion.push(testCase);
	}
}

export const TestSuite_CompareVersion: TestSuit_CompareVersion = {
	label: 'debounce',
	testcases: TestCases_CompareVersion,
	processor: async (testCase) => {
		const result = compareVersions(testCase.input.firstVersion, testCase.input.secondVersion);
		expect(result).to.eql(testCase.result);
	}
};