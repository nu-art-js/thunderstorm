import {TestSuite} from '@nu-art/testalot';
import {BadImplementationException} from '@nu-art/ts-common';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/testalot';
import {BaseCliParam, CliParams} from '../../main/cli-params/types.js';
import {CLIParamsResolver} from '../../main/cli-params/CLIParamsResolver.js';

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

export const Param_Environment: BaseCliParam<'env', string> = {
	keys: ['--env', '-e'],
	keyName: 'env',
	type: 'string',
	group: 'General',
	description: 'Environment mode',
	options: ['dev', 'staging', 'prod'],
	initialValue: 'dev',
	defaultValue: 'staging',
};

export const Param_Number: BaseCliParam<'count', number> = {
	keys: ['--count', '-c'],
	keyName: 'count',
	type: 'number',
	group: 'General',
	initialValue: 0,
	description: 'Count param'
};

export const Param_StringArray: BaseCliParam<'tags', string[]> = {
	keys: ['--tags', '-t'],
	keyName: 'tags',
	type: 'string[]',
	group: 'General',
	description: 'Tags param',
	isArray: true
};

export const Param_Test: BaseCliParam<'test', boolean> = {
	keys: ['--test'],
	keyName: 'test',
	type: 'boolean',
	description: 'Enable test mode',
	initialValue: false
};

export const Param_TestFile: BaseCliParam<'testFile', string> = {
	keys: ['--test-file'],
	keyName: 'testFile',
	type: 'string',
	description: 'Test file to run',
	dependencies: [{param: Param_Test, value: true}]
};

export const Param_Include: BaseCliParam<'include', string[]> = {
	keys: ['--include'],
	keyName: 'include',
	type: 'string[]',
	description: 'Test include to run',
};

export const Param_DependInclude: BaseCliParam<'depend-include', boolean> = {
	keys: ['--depend-include'],
	keyName: 'depend-include',
	type: 'boolean',
	description: '',
};


export const Param_IncludePackage: BaseCliParam<'includePackage', string[]> = {
	keys: ['--include-package'],
	keyName: 'includePackage',
	type: 'string[]',
	group: 'Build',
	description: 'Package to include in the run',
};

export const Param_SetupAlias: BaseCliParam<'setup', boolean> = {
	keys: ['--setup'],
	keyName: 'setup',
	type: 'boolean',
	group: 'Build',
	description: 'Setup local project for developer',
	// This mirrors BaiParam_Setup → BaiParam_includePackage = "project-setup"
	dependencies: [{param: Param_IncludePackage, value: ['project-setup']}],
};

type Input = {
	params: BaseCliParam<any, any>[]
	input: string | string[]
}
type Result = Partial<CliParams<any>>
type TestSuite_RuntimeParams2 = TestSuite<Input, Result>;
type TestCase_RuntimeParams = TestSuite_RuntimeParams2['testcases'][number];


const test = async (input: Input): Promise<Result> => {
	const paramsDef = input.params;

	let inputParams: string[];
	if (typeof input.input === 'string')
		inputParams = input.input.split(' ');
	else
		inputParams = input.input;

	const cliParams = CLIParamsResolver.create(...paramsDef).resolveParamValue(inputParams);
	return cliParams;
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
	it('distinct -hlp from -h', runTestCase({
			input: {
				params: [Param_Help],
				input: '-hlp'
			},
			result: {},
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
	it('distinct -ip and -i - 5', runTestCase({
			input: {
				params: [Param_I],
				input: '-isdfsdf'
			},
			result: {},
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
	it('"value with spaces"', runTestCase({
			input: {
				params: [Param_String],
				input: ['-s=Value with spaces']
			},
			result: {string: 'Value with spaces'},
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
			result: {string: Param_String.defaultValue},
		}
	));
	it('test string param with default value but the argument was not specified', runTestCase({
			input: {
				params: [Param_String],
				input: ''
			},
			result: {},
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


describe('Runtime Params - Param_Number', () => {
	it('GPT - Parse number from short flag', runTestCase({
		input: {
			params: [Param_Number],
			input: '-c=42',
		},
		result: {count: 42},
	}));

	it('GPT - Parse number from long flag', runTestCase({
		input: {
			params: [Param_Number],
			input: '--count=17',
		},
		result: {count: 17},
	}));

	it('GPT - Use default number value when flag missing', runTestCase({
		input: {
			params: [Param_Number],
			input: '',
		},
		result: {count: 0},
	}));
});


describe('Runtime Params - Param_StringArray', () => {
	it('GPT - Parse array with repeated long flag', runTestCase({
		input: {
			params: [Param_StringArray],
			input: '--tags=dev --tags=qa --tags=prod',
		},
		result: {tags: ['dev', 'qa', 'prod']},
	}));

	it('GPT - Parse array with repeated short flag', runTestCase({
		input: {
			params: [Param_StringArray],
			input: '-t=staging -t=integration',
		},
		result: {tags: ['staging', 'integration']},
	}));

	it('GPT - Empty input results in undefined', runTestCase({
		input: {
			params: [Param_StringArray],
			input: '',
		},
		result: {},
	}));
});


describe('Runtime Params - Param_Environment (enum)', () => {
	it('GPT - Parse allowed enum value', runTestCase({
		input: {
			params: [Param_Environment],
			input: '--env=prod',
		},
		result: {env: 'prod'},
	}));

	it('GPT - Use default enum when not specified', runTestCase({
		input: {
			params: [Param_Environment],
			input: '',
		},
		result: {env: 'dev'},
	}));

	it('GPT - Use default enum when not specified', runTestCase({
		input: {
			params: [Param_Environment],
			input: '--env',
		},
		result: {env: 'staging'},
	}));

	it('GPT - Parse short flag for enum', runTestCase({
		input: {
			params: [Param_Environment],
			input: '-e=staging',
		},
		result: {env: 'staging'},
	}));

	it('GPT - Invalid enum value falls back to default', runTestCase({
		input: {
			params: [Param_Environment],
			input: '--env=invalid',
		},
		error: {expected: 'value not supported'}
	}));
});


describe('Runtime Params - Failures and Edge Cases', () => {
	it('GPT - Unknown flag is ignored', runTestCase({
		input: {
			params: [Param_Number],
			input: '--unknown=value',
		},
		result: {count: 0},
	}));

	it('GPT - Repeated conflicting values take last (string)', runTestCase({
		input: {
			params: [Param_String],
			input: '--string=a --string=b --string=c',
		},
		result: {string: 'c'},
	}));

	it('GPT - Repeated conflicting values take last (number)', runTestCase({
		input: {
			params: [Param_Number],
			input: '--count=3 --count=8 --count=22',
		},
		result: {count: 22},
	}));

	it('GPT - Missing value for number param uses default', runTestCase({
		input: {
			params: [Param_Number],
			input: '--count',
		},
		error: {expected: 'expected number value'}
	}));

	it('GPT - Missing value for number param uses default', runTestCase({
		input: {
			params: [{...Param_Number, defaultValue: 0}],
			input: '--count',
		},
		result: {count: 0},
	}));

	it('GPT - Malformed input for number param is ignored', runTestCase({
		input: {
			params: [Param_Number],
			input: '--count=not-a-number',
		},
		error: {expected: 'expected number value'}
	}));
});

describe('Runtime Params - Derived Dependency Resolution', () => {

	it('GPT - testFile sets test=true implicitly via dependency', runTestCase({
		input: {
			params: [Param_Test, Param_TestFile],
			input: '--test-file=index.ts'
		},
		result: {
			test: true,
			testFile: 'index.ts'
		}
	}));

	it('GPT - testFile and test explicitly provided', runTestCase({
		input: {
			params: [Param_Test, Param_TestFile],
			input: '--test --test-file=index.ts'
		},
		result: {
			test: true,
			testFile: 'index.ts'
		}
	}));

	it('GPT - test not set when testFile not used', runTestCase({
		input: {
			params: [Param_Test, Param_TestFile],
			input: ''
		},
		result: {
			test: false,
		}
	}));

	it('GPT - setup implicitly sets includePackage=project-setup', runTestCase({
		input: {
			params: [Param_SetupAlias, Param_IncludePackage],
			input: '--setup',
		},
		result: {
			setup: true,
			includePackage: ['project-setup'],
		},
	}));

	it('GPT - includePackage alone is parsed without setup', runTestCase({
		input: {
			params: [Param_SetupAlias, Param_IncludePackage],
			input: '--include-package=custom-package',
		},
		result: {
			includePackage: ['custom-package'],
		},
	}));

});

describe('Runtime Params - Dynamic Dependencies', () => {
	const Param_UsePackage: BaseCliParam<'usePackage', string[]> = {
		keys: ['-up', '--use-packages'],
		keyName: 'usePackage',
		type: 'string[]',
		group: 'Build',
		description: 'Will specify units to process',
		process: (value) => {
			if (!value)
				return [];

			return value!.split(',').map(str => str.trim());
		},
		isArray: true,
	};

	const Param_BuildTree: BaseCliParam<'buildTree', boolean> = {
		keys: ['--build-tree', '-bt'],
		keyName: 'buildTree',
		type: 'boolean',
		group: 'Build',
		description: 'When used with -up, makes all transitive dependencies active',
	};

	const Param_Apps: BaseCliParam<'includeApps', string[]> = {
		keys: ['-app', '--application'],
		keyName: 'includeApps',
		type: 'string[]',
		group: 'Build',
		description: 'Will include the applications and all their dependency units to the build process',
		process: (value) => {
			if (!value)
				return [];

			return value!.split(',').map(str => str.trim());
		},
		isArray: true,
		dependencies: [
			{param: Param_UsePackage, value: (currentValue: string[]) => currentValue},
			{param: Param_BuildTree, value: true}
		]
	};

	it('GPT - app sets usePackage to same value and buildTree to true', runTestCase({
		input: {
			params: [Param_Apps, Param_UsePackage, Param_BuildTree],
			input: '-app=my-app',
		},
		result: {
			includeApps: ['my-app'],
			usePackage: ['my-app'],
			buildTree: true,
		},
	}));

	it('GPT - app with multiple values sets usePackage to same values and buildTree to true', runTestCase({
		input: {
			params: [Param_Apps, Param_UsePackage, Param_BuildTree],
			input: '-app=app1,app2,app3',
		},
		result: {
			includeApps: ['app1', 'app2', 'app3'],
			usePackage: ['app1', 'app2', 'app3'],
			buildTree: true,
		},
	}));

	it('GPT - app with long flag sets usePackage and buildTree', runTestCase({
		input: {
			params: [Param_Apps, Param_UsePackage, Param_BuildTree],
			input: '--application=my-application',
		},
		result: {
			includeApps: ['my-application'],
			usePackage: ['my-application'],
			buildTree: true,
		},
	}));

	it('GPT - app dependency works even when usePackage is explicitly set', runTestCase({
		input: {
			params: [Param_Apps, Param_UsePackage, Param_BuildTree],
			input: '-app=my-app -up=other-package',
		},
		result: {
			includeApps: ['my-app'],
			usePackage: ['my-app', 'other-package'],
			buildTree: true,
		},
	}));

});
