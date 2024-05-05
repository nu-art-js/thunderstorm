import {BaseCliParam, CLIParams_Resolver} from '../cli/cli-params';

const testParam1: BaseCliParam<'test1', string> = {
	keys: ['--test1', '-t1'],
	keyName: 'test1',
	type: 'string',
	description: '',
	defaultValue: 'psulet'
};

const testParam2: BaseCliParam<'test2', string[]> = {
	keys: ['--test2'],
	keyName: 'test2',
	type: 'string[]',
	description: ''
};

const testParam3: BaseCliParam<'test3', number> = {
	keys: ['--test3'],
	keyName: 'test3',
	type: 'number',
	description: ''
};

const testParam4: BaseCliParam<'test4', number[]> = {
	keys: ['--test4'],
	keyName: 'test4',
	type: 'number[]',
	description: ''
};

const testParam5: BaseCliParam<'test5', boolean> = {
	keys: ['--test5'],
	keyName: 'test5',
	type: 'boolean',
	description: ''
};

const testParam6: BaseCliParam<'test6', boolean[]> = {
	keys: ['--test6'],
	keyName: 'test6',
	type: 'boolean[]',
	description: ''
};

const params= [testParam1, testParam2, testParam3, testParam4, testParam5, testParam6];
const MyAppParamResolver = new CLIParams_Resolver(params);

console.log(MyAppParamResolver.resolveParamValue());