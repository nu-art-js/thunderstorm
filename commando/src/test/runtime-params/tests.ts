import {TestSuite} from '@thunder-storm/common/testing/types';
import {BadImplementationException, compare} from '@thunder-storm/common';
import {expect} from 'chai';
import {testSuiteTester} from '@thunder-storm/common/testing/consts';
import {BaseCliParam, CliParams} from '../../main/cli-params/types';
import {CLIParamsResolver} from '../../main/cli-params/CLIParamsResolver';


type TestSuite_RuntimeParams<Params extends BaseCliParam<string, any>[], Output extends Partial<CliParams<Params>> = Partial<CliParams<Params>>>
	= TestSuite<Input, Output>

type Input = {
	params: BaseCliParam<any, any>[]
	input: string
}

function createTestCase<Params extends BaseCliParam<string, any>[], Output extends Partial<CliParams<Params>> = Partial<CliParams<Params>>>(
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

export const Param_I: BaseCliParam<'i', boolean> = {
	keys: ['-i'],
	keyName: 'i',
	type: 'boolean',
	group: 'General',
	description: ''
};
export const Param_IP: BaseCliParam<'ip', boolean> = {
	keys: ['-ip'],
	keyName: 'ip',
	type: 'boolean',
	group: 'General',
	description: ''
};

export const Param_String: BaseCliParam<'string', string> = {
	keys: ['-s', '--string'],
	keyName: 'string',
	type: 'string',
	group: 'General',
	defaultValue: 'default',
	description: ''
};

export const Param_StringWithProcess: BaseCliParam<'stringWithProcess', string> = {
	keys: ['-swp', '--string-with-process'],
	keyName: 'stringWithProcess',
	type: 'string',
	group: 'General',
	defaultValue: 'default',
	description: '',
	process: (value, defaultValue) => {
		if (!value && !defaultValue)
			throw new BadImplementationException('must have at least default value');

		return value ?? defaultValue!;
	}
};

const TestCase_merge: TestSuite_RuntimeParams<any, any>['testcases'] = [
	createTestCase('Simple help param', [Param_Help], {help: true}, '-h'),
	createTestCase('distinct -i and -ip - 1', [Param_I, Param_IP], {i: true}, '-i'),
	createTestCase('distinct -i and -ip - 2', [Param_I, Param_IP], {ip: true}, '-ip'),
	createTestCase('distinct -i and -ip - 3', [Param_I, Param_IP], {i: true, ip: true}, '-i -ip'),
	createTestCase('distinct -i and -ip - 4', [Param_I, Param_IP], {i: true, ip: true}, '-ip -i'),
	createTestCase('distinct -ip and -i - 1', [Param_IP, Param_I], {i: true}, '-i'),
	createTestCase('distinct -ip and -i - 2', [Param_IP, Param_I], {ip: true}, '-ip'),
	createTestCase('distinct -ip and -i - 3', [Param_IP, Param_I], {i: true, ip: true}, '-i -ip'),
	createTestCase('distinct -ip and -i - 4', [Param_IP, Param_I], {i: true, ip: true}, '-ip -i'),
	createTestCase('take last value of all appearances of string param short flag', [Param_String], {string: 'final-value'}, '-s=zevel -s=string -s=final-value'),
	createTestCase('take last value of all appearances of string param full flag', [Param_String], {string: 'final-value'}, '--string=zevel -s=string --string=final-value'),
	createTestCase('take last value of all appearances of string param using different string flags', [Param_String], {string: 'final-value'}, '-s=zevel --string=string --string=final-value'),
	createTestCase('test string param with default value - 1', [Param_String], {string: Param_StringWithProcess.defaultValue}, '-s'),
	createTestCase('test string param with default value - 2', [Param_String], {string: Param_StringWithProcess.defaultValue}, '--string'),
	createTestCase('test process - return value', [Param_StringWithProcess], {stringWithProcess: 'my-value'}, '-swp=my-value'),
	createTestCase('test process - return default', [Param_StringWithProcess], {stringWithProcess: Param_StringWithProcess.defaultValue}, '-swp'),
];

export const TestSuite_RuntimeParams: TestSuite<Input, any> = {
	label: 'merge',
	testcases: TestCase_merge,
	processor: async (testCase) => {
		const paramsDef = testCase.input.params;
		const inputParams = testCase.input.input.split(' ');
		const resolvedParams = CLIParamsResolver.create(...paramsDef).resolveParamValue(inputParams);
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