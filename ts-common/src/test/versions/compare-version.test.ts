import {TestSuite} from '../../main/testing/types';
import {compareVersions} from '../../main';
import {runSingleTestCase} from '../_main';

export type Input = {
	firstVersion: string;
	secondVersion: string;
};

export type Result = -1 | 0 | 1;
export type TestSuite_CompareVersion = TestSuite<Input, Result>;
export type TestCase_CompareVersion = TestSuite_CompareVersion['testcases'][number];

const test = async (input: Input): Promise<Result> => {
	return compareVersions(input.firstVersion, input.secondVersion);
};

const runTestCase = (testCase: TestCase_CompareVersion) => {
	return () => runSingleTestCase(test, testCase);
};

const versions = [
	'0.0.0', '0.0.1', '0.0.2', '0.1.0', '0.1.1', '0.1.2',
	'0.2.0', '0.2.1', '0.2.2', '1.0.0', '1.0.1', '1.0.2',
	'1.1.1', '1.1.2', '1.2.1', '1.2.2', '2.0.0', '2.0.1',
	'2.0.2', '2.1.1', '2.1.2', '2.2.1', '2.2.2', '2.2.3-suffix',
	'2.3.0-suffix', '2.3.1-suffix', '2.3.2-suffix', '2.3.3-suffix',
	'prefix-2.3.4-suffix', 'prefix-2.4.0-suffix', 'prefix-2.4.1'
];

describe('compareVersions', () => {
	for (let i = 0; i < versions.length; i++) {
		for (let j = 0; j < versions.length; j++) {
			const firstVersion = versions[i];
			const secondVersion = versions[j];
			const expected: Result = i < j ? 1 : i > j ? -1 : 0;

			it(`Compare: ${firstVersion} <> ${secondVersion}`, runTestCase({
				description: `Compare: ${firstVersion} <> ${secondVersion}`,
				input: {firstVersion, secondVersion},
				result: expected
			}));
		}
	}
});
