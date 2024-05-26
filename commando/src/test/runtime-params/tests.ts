import {TestSuite} from '@nu-art/ts-common/testing/types';
import {BaseCliParam, CliParams} from '../../main/cli/cli-params';
import {CLIParams_Resolver} from '../../../dist/cli/cli-params';
import {compare} from '@nu-art/ts-common';
import {expect} from 'chai';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';


type TestSuite_RuntimeParams<Params extends BaseCliParam<string, any>[], Output extends CliParams<Params> = CliParams<Params>>
	= TestSuite<Input, Output>

type Input = {
	params: BaseCliParam<any, any>[]
	input: string
}

function createTestCase<Params extends BaseCliParam<string, any>[], Output extends CliParams<Params> = CliParams<Params>>(
	description: string, params: Params, output: Output, paramsAsString: string): TestSuite_RuntimeParams<Params, Output>['testcases'][number] {
	return {
		description,
		result: output,
		input: {
			params,
			input: paramsAsString
		}
	};
}

export const Param_Help: BaseCliParam<'help', boolean> = {
	keys: ['--help', '-h'],
	keyName: 'help',
	type: 'boolean',
	group: 'General',
	description: 'This help menu'
};

const TestCase_merge: TestSuite_RuntimeParams<any, any>['testcases'] = [
	createTestCase('Simple help param', [Param_Help], {help: true}, '-h')
];

export const TestSuite_RuntimeParams: TestSuite<Input, any> = {
	label: 'merge',
	testcases: TestCase_merge,
	processor: async (testCase) => {
		const paramsDef = testCase.input.params;
		const inputParams = testCase.input.input.split(' ');
		const resolvedParams = CLIParams_Resolver.create(...paramsDef).resolveParamValue(inputParams);
		const result = compare(resolvedParams, testCase.result);
		if (!result) {
			console.log('Expected: ', testCase.result);
			console.log('Actual: ', resolvedParams);
		}
		expect(result).to.eql(true);
	}
};

describe('Accounts - Runtime Params', () => {
	testSuiteTester(TestSuite_RuntimeParams);
});