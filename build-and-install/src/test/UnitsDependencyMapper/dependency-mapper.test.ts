import {UnitDependentNode, UnitsDependencyMapper} from '../_common';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts';

type Input = {
	nodes: UnitDependentNode[]
	keys?: string[]
};
type Result = string[][];

type TestSuite_UnitsDependencyMapper = TestSuite<Input, Result>;
type TestCase_UnitsDependencyMapper = TestSuite_UnitsDependencyMapper['testcases'][number];

const test = async (input: Input): Promise<Result> => {
	const unitsDependencyMapper = new UnitsDependencyMapper(input.nodes);
	const buildDependencyTree = await unitsDependencyMapper.buildDependencyTree(input.keys);
	unitsDependencyMapper.printGraph();
	return buildDependencyTree;
};

const runTestCase = (testCase: TestCase_UnitsDependencyMapper, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

describe('Units Dependency Mapper', () => {
	it('should resolve linear chain', runTestCase({
		input: {
			nodes: [
				{key: 'source', dependsOn: []},
				{key: 'processor', dependsOn: ['source']},
				{key: 'consumer', dependsOn: ['processor']},
			]
		},
		result: [['source'], ['processor'], ['consumer']],
	}));

	it('should resolve fan-in graph', runTestCase({
		input: {
			nodes: [
				{key: 'aggregator', dependsOn: ['reader-a', 'reader-b']},
				{key: 'reader-a', dependsOn: []},
				{key: 'reader-b', dependsOn: []},
			]
		},
		result: [['reader-a', 'reader-b'], ['aggregator']],
	}));

	it('should resolve fan-out graph', runTestCase({
		input: {
			nodes: [
				{key: 'config', dependsOn: []},
				{key: 'service-a', dependsOn: ['config']},
				{key: 'service-b', dependsOn: ['config']},
			]
		},
		result: [['config'], ['service-a', 'service-b']],
	}));

	it('should throw on cycle', runTestCase({
		input: {
			nodes: [
				{key: 'loop-a', dependsOn: ['loop-b']},
				{key: 'loop-b', dependsOn: ['loop-a']},
			]
		},
		error: {expected: /Cyclic/},
	}));

	it('should resolve shared child with fan-out', runTestCase({
		input: {
			nodes: [
				{key: 'logger', dependsOn: ['utils']},
				{key: 'utils', dependsOn: []},
				{key: 'controller', dependsOn: ['parser', 'logger']},
				{key: 'parser', dependsOn: ['utils']},
			]
		},
		result: [['utils'], ['logger', 'parser'], ['controller']],
	}));

	it('should handle flat graph', runTestCase({
		input: {
			nodes: [
				{key: 'module-a', dependsOn: []},
				{key: 'module-b', dependsOn: []},
				{key: 'module-c', dependsOn: []},
				{key: 'module-d', dependsOn: []},
			]
		},
		result: [['module-a', 'module-b', 'module-c', 'module-d']],
	}));

	it('should resolve deep linear chain', runTestCase({
		input: {
			nodes: [
				{key: 'step-1', dependsOn: []},
				{key: 'step-2', dependsOn: ['step-1']},
				{key: 'step-3', dependsOn: ['step-2']},
				{key: 'step-4', dependsOn: ['step-3']},
				{key: 'step-5', dependsOn: ['step-4']},
			]
		},
		result: [['step-1'], ['step-2'], ['step-3'], ['step-4'], ['step-5']],
	}));

	it('should handle disconnected subgraphs', runTestCase({
		input: {
			nodes: [
				{key: 'analytics-core', dependsOn: []},
				{key: 'reporting-engine', dependsOn: ['analytics-core']},
				{key: 'image-loader', dependsOn: []},
				{key: 'preview-module', dependsOn: ['image-loader']},
			]
		},
		result: [['analytics-core', 'image-loader'], ['preview-module', 'reporting-engine']],
	}));

	it('should resolve multiple roots and endpoints', runTestCase({
		input: {
			nodes: [
				{key: 'config-a', dependsOn: []},
				{key: 'service-a', dependsOn: ['config-a']},
				{key: 'config-b', dependsOn: []},
				{key: 'service-b', dependsOn: ['config-b']},
				{key: 'gateway', dependsOn: ['service-a', 'service-b']},
				{key: 'frontend', dependsOn: ['gateway']},
			]
		},
		result: [['config-a', 'config-b'], ['service-a', 'service-b'], ['gateway'], ['frontend']],
	}));

	it('should resolve diamond dependency graph', runTestCase({
		input: {
			nodes: [
				{key: 'foundation', dependsOn: []},
				{key: 'lib-a', dependsOn: ['foundation']},
				{key: 'lib-b', dependsOn: ['foundation']},
				{key: 'api-layer', dependsOn: ['lib-a', 'lib-b']},
			]
		},
		result: [['foundation'], ['lib-a', 'lib-b'], ['api-layer']],
	}));

	it('should resolve real partial use case', runTestCase({
		input: {
			nodes: [
				{key: '@nu-art/ts-common', dependsOn: []},
				{key: '@nu-art/firebase', dependsOn: ['@nu-art/ts-common']},
				{key: '@nu-art/permissions', dependsOn: ['@nu-art/firebase', '@nu-art/ts-common']},
				{key: '@nu-art/user-account', dependsOn: ['@nu-art/firebase', '@nu-art/ts-common']},
				{key: '@nu-art/push-pub-sub', dependsOn: ['@nu-art/permissions', '@nu-art/user-account']},
				{key: '@nu-art/file-upload', dependsOn: ['@nu-art/push-pub-sub']},
			]
		},
		result: [
			['@nu-art/ts-common'],
			['@nu-art/firebase'],
			['@nu-art/permissions', '@nu-art/user-account'],
			['@nu-art/push-pub-sub'],
			['@nu-art/file-upload']
		]
	}));

	it('should resolve multiple top levels', runTestCase({
		input: {
			nodes: [
				{key: 'a', dependsOn: []},
				{key: 'b', dependsOn: ['a']},
				{key: 'c', dependsOn: ['b', 'a']},
				{key: 'd', dependsOn: ['b', 'a']},
				{key: 'e', dependsOn: ['c', 'd']},
				{key: 'f', dependsOn: ['e']},
				{key: 'g', dependsOn: ['e']},
				{key: 'h', dependsOn: ['d']},
				{key: 'i', dependsOn: ['b']},
			]
		},
		result: [['a'], ['b'], ['c', 'd'], ['e'], ['f', 'g', 'h', 'i']],
	}));

	it('should resolve multiple low levels', runTestCase({
		input: {
			nodes: [
				{key: 'a', dependsOn: []},
				{key: 'b', dependsOn: []},
				{key: 'c', dependsOn: ['a']},
				{key: 'd', dependsOn: ['b']},
				{key: 'e', dependsOn: ['b']},
				{key: 'f', dependsOn: ['d', 'e']},
			],
			keys: ['a', 'b', 'c', 'd', 'e', 'f']
		},
		result: [['a', 'b'], ['d', 'e'], ['c', 'f']],
	}));

	it('should exclude irrelevant dependency not reachable from given keys', runTestCase({
		input: {
			nodes: [
				{key: 'root', dependsOn: []},
				{key: 'mid', dependsOn: ['root']},
				{key: 'leaf', dependsOn: ['mid']},
				{key: 'unused', dependsOn: []},
			],
			keys: ['leaf']
		},
		result: [['leaf']],
	}));

	it('should throw on unknown internal dependency', runTestCase({
		input: {
			nodes: [
				{key: 'a', dependsOn: ['missing']},
				{key: 'b', dependsOn: ['a']},
			],
			keys: ['a', 'b']
		},
		error: {expected: 'Unknown key: missing'}
	}));

	it('should throw if referenced key is missing from nodes', runTestCase({
		input: {
			nodes: [
				{key: 'a', dependsOn: []},
				{key: 'b', dependsOn: []},
				{key: 'c', dependsOn: ['a']},
				{key: 'd', dependsOn: ['b']},
				{key: 'e', dependsOn: ['b']},
				{key: 'f', dependsOn: ['d', 'e']},
			],
			keys: ['a', 'b', 'c', 'd', 'e', 'f', 'k']
		},
		error: {expected: 'Unknown key: k'},
	}));

	it('should detect self-dependency cycle', runTestCase({
		input: {
			nodes: [
				{key: 'self', dependsOn: ['self']},
			]
		},
		error: {expected: /Cyclic/},
	}));

	it('should resolve reachable nodes only', runTestCase({
		input: {
			nodes: [
				{key: 'root', dependsOn: ['a']},
				{key: 'a', dependsOn: []},
				{key: 'c', dependsOn: ['a']},
			],
			keys: ['c']
		},
		result: [['c']],
	}));
});