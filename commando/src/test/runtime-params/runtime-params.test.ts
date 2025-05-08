import {TestSuite} from '@nu-art/ts-common/testing/types';
import {BadImplementationException} from '@nu-art/ts-common';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {BaseCliParam, CliParams} from '../../main/cli-params/types';
import {CLIParamsResolver} from '../../main/cli-params/CLIParamsResolver';

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

type Input = {
	params: BaseCliParam<any, any>[]
	input: string
}
type Result = Partial<CliParams<any>>
type TestSuite_RuntimeParams2 = TestSuite<Input, Result>;
type TestCase_RuntimeParams = TestSuite_RuntimeParams2['testcases'][number];


const test = async (input: Input): Promise<Result> => {
	const paramsDef = input.params;
	const inputParams = input.input.split(' ');
	return CLIParamsResolver.create(...paramsDef).resolveParamValue(inputParams);
};

const runTestCase = (testCase: TestCase_RuntimeParams, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Runtime Params', () => {
	it('Simple help param', runTestCase({
			input: {
				params: [Param_Help],
				input: '-h'
			},
			result: {help: true},
		}
	));

	it('distinct -i and -ip - 1', runTestCase({
			input: {
				params: [Param_I, Param_IP],
				input: '-i'
			},
			result: {i: true},
		}
	));
	it('distinct -i and -ip - 2', runTestCase({
			input: {
				params: [Param_I, Param_IP],
				input: '-ip'
			},
			result: {ip: true},
		}
	));
	it('distinct -i and -ip - 3', runTestCase({
			input: {
				params: [Param_I, Param_IP],
				input: '-i -ip'
			},
			result: {i: true, ip: true},
		}
	));
	it('distinct -i and -ip - 4', runTestCase({
			input: {
				params: [Param_I, Param_IP],
				input: '-ip -i'
			},
			result: {i: true, ip: true},
		}
	));
	it('distinct -ip and -i - 1', runTestCase({
			input: {
				params: [Param_IP, Param_I],
				input: '-i'
			},
			result: {i: true},
		}
	));
	it('distinct -ip and -i - 2', runTestCase({
			input: {
				params: [Param_IP, Param_I],
				input: '-ip'
			},
			result: {ip: true},
		}
	));
	it('distinct -ip and -i - 3', runTestCase({
			input: {
				params: [Param_IP, Param_I],
				input: '-i -ip'
			},
			result: {i: true, ip: true},
		}
	));
	it('distinct -ip and -i - 4', runTestCase({
			input: {
				params: [Param_IP, Param_I],
				input: '-ip -i'
			},
			result: {i: true, ip: true},
		}
	));
	it('take last value of all appearances of string param short flag', runTestCase({
			input: {
				params: [Param_String],
				input: '-s=zevel -s=string -s=final-value'
			},
			result: {string: 'final-value'},
		}
	));
	it('take last value of all appearances of string param full flag', runTestCase({
			input: {
				params: [Param_String],
				input: '--string=zevel -s=string --string=final-value'
			},
			result: {string: 'final-value'},
		}
	));
	it('take last value of all appearances of string param using different string flags', runTestCase({
			input: {
				params: [Param_String],
				input: '-s=zevel --string=string --string=final-value'
			},
			result: {string: 'final-value'},
		}
	));
	it('test string param with default value - 1', runTestCase({
			input: {
				params: [Param_String],
				input: '-s'
			},
			result: {string: Param_StringWithProcess.defaultValue},
		}
	));
	it('test string param with default value - 2', runTestCase({
			input: {
				params: [Param_String],
				input: '--string'
			},
			result: {string: Param_StringWithProcess.defaultValue},
		}
	));
	it('test process - return value', runTestCase({
			input: {
				params: [Param_StringWithProcess],
				input: '-swp=my-value'
			},
			result: {stringWithProcess: 'my-value'},
		}
	));
	it('test process - return default', runTestCase({
			input: {
				params: [Param_StringWithProcess],
				input: '-swp'
			},
			result: {stringWithProcess: Param_StringWithProcess.defaultValue},
		}
	));
});