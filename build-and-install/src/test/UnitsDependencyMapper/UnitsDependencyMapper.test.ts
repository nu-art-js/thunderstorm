import {UnitDependentNode, UnitsDependencyMapper} from '../_common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';

type Input = UnitDependentNode[];
type Result = string[][];

type TestSuite_UnitsDependencyMapper = TestSuite<Input, Result>;
type TestCase_UnitsDependencyMapper = TestSuite_UnitsDependencyMapper['testcases'][number];


const test = async (input: Input): Promise<Result> => {
	const unitsDependencyMapper = new UnitsDependencyMapper(input);
	const buildDependencyTree = unitsDependencyMapper.buildDependencyTree();
	unitsDependencyMapper.printGraph();
	return buildDependencyTree;
};

const runTestCase = (testCase: TestCase_UnitsDependencyMapper, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('UnitsDependencyMapper', () => {
	it('linear chain', runTestCase({
		input: [
			{key: 'source', dependsOn: []},
			{key: 'processor', dependsOn: ['source']},
			{key: 'consumer', dependsOn: ['processor']},
		],
		result: [['source'], ['processor'], ['consumer']],
	}));

	it('fan-in', runTestCase({
		input: [
			{key: 'aggregator', dependsOn: ['reader-a', 'reader-b']},
			{key: 'reader-a', dependsOn: []},
			{key: 'reader-b', dependsOn: []},
		],
		result: [['reader-a', 'reader-b'], ['aggregator']],
	}));

	it('fan-out', runTestCase({
		input: [
			{key: 'config', dependsOn: []},
			{key: 'service-a', dependsOn: ['config']},
			{key: 'service-b', dependsOn: ['config']},
		],
		result: [['config'], ['service-a', 'service-b']],
	}));

	it('cyclic should throw', runTestCase({
		input: [
			{key: 'loop-a', dependsOn: ['loop-b']},
			{key: 'loop-b', dependsOn: ['loop-a']},
		],
		error: {expected: /Cyclic/},
	}));

	it('fanout with shared child', runTestCase({
		input: [
			{key: 'logger', dependsOn: ['utils']},
			{key: 'utils', dependsOn: []},
			{key: 'controller', dependsOn: ['parser', 'logger']},
			{key: 'parser', dependsOn: ['utils']},
		],
		result: [['utils'], ['logger', 'parser'], ['controller']],
	}));

	it('completely flat graph', runTestCase({
		input: [
			{key: 'module-a', dependsOn: []},
			{key: 'module-b', dependsOn: []},
			{key: 'module-c', dependsOn: []},
			{key: 'module-d', dependsOn: []},
		],
		result: [['module-a', 'module-b', 'module-c', 'module-d']],
	}));

	it('deep linear chain', runTestCase({
		input: [
			{key: 'step-1', dependsOn: []},
			{key: 'step-2', dependsOn: ['step-1']},
			{key: 'step-3', dependsOn: ['step-2']},
			{key: 'step-4', dependsOn: ['step-3']},
			{key: 'step-5', dependsOn: ['step-4']},
		],
		result: [['step-1'], ['step-2'], ['step-3'], ['step-4'], ['step-5']],
	}));

	it('disconnected subgraphs', runTestCase({
		input: [
			{key: 'analytics-core', dependsOn: []},
			{key: 'reporting-engine', dependsOn: ['analytics-core']},
			{key: 'image-loader', dependsOn: []},
			{key: 'preview-module', dependsOn: ['image-loader']},
		],
		result: [['analytics-core', 'image-loader'], ['preview-module', 'reporting-engine']],
	}));

	it('multiple roots and endpoints', runTestCase({
		input: [
			{key: 'config-a', dependsOn: []},
			{key: 'service-a', dependsOn: ['config-a']},
			{key: 'config-b', dependsOn: []},
			{key: 'service-b', dependsOn: ['config-b']},
			{key: 'gateway', dependsOn: ['service-a', 'service-b']},
			{key: 'frontend', dependsOn: ['gateway']},
		],
		result: [['config-a', 'config-b'], ['service-a', 'service-b'], ['gateway'], ['frontend']],
	}));

	it('diamond dependency graph', runTestCase({
		input: [
			{key: 'foundation', dependsOn: []},
			{key: 'lib-a', dependsOn: ['foundation']},
			{key: 'lib-b', dependsOn: ['foundation']},
			{key: 'api-layer', dependsOn: ['lib-a', 'lib-b']},
		],
		result: [['foundation'], ['lib-a', 'lib-b'], ['api-layer']],
	}));

	it('Complex case with 3 apps and 30+ libs with various dependency shapes', runTestCase({
		input: [
			{key: 'lib-utils', dependsOn: []},
			{key: 'lib-auth', dependsOn: ['lib-utils']},
			{key: 'lib-permissions', dependsOn: ['lib-utils']},
			{key: 'lib-api', dependsOn: ['lib-auth', 'lib-permissions']},
			{key: 'lib-storage', dependsOn: []},
			{key: 'lib-logging', dependsOn: ['lib-storage']},
			{key: 'admin-app', dependsOn: ['lib-api', 'lib-logging']},
			{key: 'user-app', dependsOn: ['lib-auth']},
			{key: 'public-app', dependsOn: ['lib-permissions']},
		],
		result: [
			['lib-storage', 'lib-utils'],
			['lib-auth', 'lib-logging', 'lib-permissions'],
			['lib-api'],
			['admin-app', 'public-app', 'user-app']
		]
	}));
});
