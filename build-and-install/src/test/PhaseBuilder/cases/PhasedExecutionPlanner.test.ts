import {TestModel} from '@nu-art/testalot';
import {BaiParams, BaseUnit, Phase, PhaseManager, ScheduledStep} from '../../_common.js';
import {flatArray, voidFunction} from '@nu-art/ts-common';
import {runSingleTestCase} from '@nu-art/testalot';
import {RunningStatusHandler} from '../../_common.js';

//========================= TestSuite Definition =========================

type Input = {
	units: BaseUnit<any>[][];
	phases: Phase<any>[][];
	activeUnits?: string[]
};

type Output = ScheduledStep[];

type TestCase_CalcExecutionSteps = TestModel<Input, Output>;


async function test(input: Input) {
	const {units, phases} = input;
	const activeUnits = input.activeUnits ?? flatArray(units).map(u => u.config.key);
	const projectUnitKeys = input.activeUnits ?? flatArray(units).map(u => u.config.key); // For tests, use activeUnits as projectUnits
	const manager = new PhaseManager(new RunningStatusHandler('output-folder', {} as BaiParams), phases, units, activeUnits, projectUnitKeys);
	return manager.calculateExecutionSteps();
}

//========================= Helper Functions =========================

function mockUnit(key: string, methods: string[]): BaseUnit<any> {
	return {
		config: {key},
		...methods.reduce((acc, method) => {
			acc[method] = voidFunction;
			return acc;
		}, {} as any)
	} as BaseUnit<any>;
}

function mockPhase(key: string, filter?: () => boolean): Phase<any> {
	return {
		key,
		method: key,
		filter,
	} as Phase<any>;
}

const runTestCase = (testCase: TestCase_CalcExecutionSteps) => runSingleTestCase(test, testCase);

describe('PhaseManager - calculateExecutionSteps', () => {
	it('Single Phase, Single Unit', () => runTestCase({
		description: 'Single Phase, Single Unit',
		input: {
			units: [[mockUnit('unit-1', ['build'])]],
			phases: [[mockPhase('build')]],
		},
		result: [
			{phases: ['build'], units: ['unit-1']},
		],
	}));

	it('Single Phase, No Eligible Units', () => runTestCase({
		description: 'Single Phase, No Eligible Units',
		input: {
			units: [[mockUnit('unit-1', ['compile'])]],
			phases: [[mockPhase('build')]],
		},
		result: [],
	}));

	it('Two Units, One Phase Matches Both', () => runTestCase({
		description: 'Two Units, One Phase Matches Both',
		input: {
			units: [[
				mockUnit('unit-1', ['build']),
				mockUnit('unit-2', ['build'])
			]],
			phases: [[mockPhase('build')]],
		},
		result: [
			{phases: ['build'], units: ['unit-1', 'unit-2']},
		],
	}));

	it('Multiple Layers and Phases (One Unit Must Have All Methods)', () => runTestCase({
		description: 'Multiple Layers and Phases (One Unit Must Have All Methods)',
		input: {
			units: [
				[mockUnit('unit-1', ['prepare', 'build'])],
				[mockUnit('unit-2', ['build'])],
			],
			phases: [[mockPhase('prepare'), mockPhase('build')]],
		},
		result: [
			{phases: ['prepare', 'build'], units: ['unit-1']},
			{phases: ['build'], units: ['unit-2']},
		],
	}));

	it('Phase with filter blocking execution', () => runTestCase({
		description: 'Phase with filter blocking execution',
		input: {
			units: [[mockUnit('unit-1', ['build'])]],
			phases: [[mockPhase('build', () => false)]],
		},
		result: [],
	}));

	it('Unit missing one of the required phase methods', () => runTestCase({
		description: 'Unit missing one of the required phase methods',
		input: {
			units: [[mockUnit('unit-1', ['build'])]],
			phases: [[mockPhase('build'), mockPhase('lint')]],
		},
		result: [
			{phases: ['build'], units: ['unit-1']},
		],
	}));

	it('Multiple groups of phases across layers', () => runTestCase({
		description: 'Multiple groups of phases across layers',
		input: {
			units: [
				[mockUnit('lib-a', ['pre', 'compile'])],
				[mockUnit('app-a', ['lint', 'test'])],
			],
			phases: [
				[mockPhase('pre'), mockPhase('compile')],
				[mockPhase('lint'), mockPhase('test')],
			],
		},
		result: [
			{phases: ['pre', 'compile'], units: ['lib-a']},
			{phases: ['lint', 'test'], units: ['app-a']},
		],
	}));

	it('Phases apply only to subset of units in layer', () => runTestCase({
		description: 'Phases apply only to subset of units in layer',
		input: {
			units: [[
				mockUnit('unit-a', ['compile', 'lint']),
				mockUnit('unit-b', ['compile'])
			]],
			phases: [[mockPhase('compile'), mockPhase('lint')]],
		},
		result: [
			{phases: ['compile', 'lint'], units: ['unit-a']},
			{phases: ['compile'], units: ['unit-b']},
		],
	}));

	it('Empty unit layers are skipped', () => runTestCase({
		description: 'Empty unit layers are skipped',
		input: {
			units: [[], [mockUnit('unit-x', ['test'])]],
			phases: [[mockPhase('test')]],
		},
		result: [
			{phases: ['test'], units: ['unit-x']},
		],
	}));

	it('Phase group with no matching units', () => runTestCase({
		description: 'Phase group with no matching units',
		input: {
			units: [[mockUnit('unit-x', ['build'])]],
			phases: [[mockPhase('deploy')]],
		},
		result: [],
	}));

	it('Units supporting different phase subsets from the same group', () => runTestCase({
		description: 'Units supporting different phase subsets from the same group',
		input: {
			units: [[
				mockUnit('unit-a', ['compile']),
				mockUnit('unit-b', ['compile', 'lint']),
				mockUnit('unit-c', ['lint']),
			]],
			phases: [[mockPhase('compile'), mockPhase('lint')]],
		},
		result: [
			{phases: ['compile'], units: ['unit-a']},
			{phases: ['compile', 'lint'], units: ['unit-b']},
			{phases: ['lint'], units: ['unit-c']},
		],
	}));

	it('Multiple units in different layers sharing partial phase coverage', () => runTestCase({
		description: 'Multiple units in different layers sharing partial phase coverage',
		input: {
			units: [
				[mockUnit('unit-a', ['compile'])],
				[mockUnit('unit-b', ['lint']), mockUnit('unit-c', ['compile', 'lint'])]
			],
			phases: [[mockPhase('compile'), mockPhase('lint')]],
		},
		result: [
			{phases: ['compile'], units: ['unit-a']},
			{phases: ['lint'], units: ['unit-b']},
			{phases: ['compile', 'lint'], units: ['unit-c']},
		],
	}));

	it('Units filtered by runtime param (simulate usePackage behavior)', () => runTestCase({
		description: 'Units filtered by runtime param (simulate usePackage behavior)',
		input: {
			units: [[
				mockUnit('pkg-core', ['build']),
				mockUnit('pkg-utils', ['build'])
			]],
			phases: [[mockPhase('build')]],
		},
		result: [
			{phases: ['build'], units: ['pkg-core', 'pkg-utils']},
		],
	}));

	it('Units with shared and distinct methods across different phase groups', () => runTestCase({
		description: 'Units with shared and distinct methods across different phase groups',
		input: {
			units: [[
				mockUnit('unit-1', ['prepare', 'compile']),
				mockUnit('unit-2', ['compile']),
				mockUnit('unit-3', ['lint'])
			]],
			phases: [
				[mockPhase('prepare'), mockPhase('compile')],
				[mockPhase('lint')],
			],
		},
		result: [
			{phases: ['prepare', 'compile'], units: ['unit-1']},
			{phases: ['compile'], units: ['unit-2']},
			{phases: ['lint'], units: ['unit-3']},
		],
	}));

	it('Units supporting identical phase group in different layers', () => runTestCase({
		description: 'Units supporting identical phase group in different layers',
		input: {
			units: [
				[mockUnit('layer1-unit', ['test', 'verify'])],
				[mockUnit('layer2-unit', ['test', 'verify'])],
			],
			phases: [[mockPhase('test'), mockPhase('verify')]],
		},
		result: [
			{phases: ['test', 'verify'], units: ['layer1-unit']},
			{phases: ['test', 'verify'], units: ['layer2-unit']},
		],
	}));

	it('Multiple units with overlapping and distinct phase combinations', () => runTestCase({
		description: 'Multiple units with overlapping and distinct phase combinations',
		input: {
			units: [[
				mockUnit('unit-1', ['compile', 'test']),
				mockUnit('unit-2', ['compile']),
				mockUnit('unit-3', ['test']),
				mockUnit('unit-4', ['compile', 'lint', 'test'])
			]],
			phases: [[mockPhase('compile'), mockPhase('test')]],
		},
		result: [
			{phases: ['compile', 'test'], units: ['unit-1', 'unit-4']},
			{phases: ['compile'], units: ['unit-2']},
			{phases: ['test'], units: ['unit-3']},
		],
	}));

	it('Phases defined but no units implement any', () => runTestCase({
		description: 'Phases defined but no units implement any',
		input: {
			units: [[mockUnit('unit-1', ['init'])]],
			phases: [[mockPhase('deploy'), mockPhase('cleanup')]],
		},
		result: [],
	}));

	it('Units with staggered phase coverage across multiple groups', () => runTestCase({
		description: 'Units with staggered phase coverage across multiple groups',
		input: {
			units: [[
				mockUnit('unit-a', ['prepare']),
				mockUnit('unit-b', ['build']),
				mockUnit('unit-c', ['test'])
			]],
			phases: [
				[mockPhase('prepare')],
				[mockPhase('build')],
				[mockPhase('test')],
			],
		},
		result: [
			{phases: ['prepare'], units: ['unit-a']},
			{phases: ['build'], units: ['unit-b']},
			{phases: ['test'], units: ['unit-c']},
		],
	}));

	it('Structured layers with varied phase coverage across multiple groups', () => runTestCase({
		description: 'Structured layers with varied phase coverage across multiple groups',
		input: {
			units: [
				[
					mockUnit('unit-a', ['prebuild']),
					mockUnit('unit-b', ['prebuild', 'compile']),
					mockUnit('unit-c', ['compile'])
				],
				[
					mockUnit('unit-d', ['test']),
					mockUnit('unit-e', ['test', 'deploy'])
				],
				[
					mockUnit('unit-f', ['review', 'archive', 'notify']),
					mockUnit('unit-g', ['review', 'notify'])
				]
			],
			phases: [
				[mockPhase('prebuild'), mockPhase('compile')],
				[mockPhase('test')],
				[mockPhase('review'), mockPhase('archive'), mockPhase('notify')],
			],
		},
		result: [
			{phases: ['prebuild'], units: ['unit-a']},
			{phases: ['prebuild', 'compile'], units: ['unit-b']},
			{phases: ['compile'], units: ['unit-c']},
			{phases: ['test'], units: ['unit-d', 'unit-e']},
			{phases: ['review', 'archive', 'notify'], units: ['unit-f']},
			{phases: ['review', 'notify'], units: ['unit-g']},
		],
	}));

	it('Layered units with mixed overlap and non-overlap phase combinations', () => runTestCase({
		description: 'Layered units with mixed overlap and non-overlap phase combinations',
		input: {
			units: [
				[
					mockUnit('unit-a', ['setup']),
					mockUnit('unit-b', ['setup', 'compile']),
					mockUnit('unit-b1', ['setup', 'compile']),
					mockUnit('unit-c', ['compile'])
				],
				[
					mockUnit('unit-d', ['test']),
					mockUnit('unit-e', ['test', 'release']),
					mockUnit('unit-d1', ['test']),
				],
				[
					mockUnit('unit-f', ['validate', 'finalize', 'report']),
					mockUnit('unit-g', ['finalize'])
				]
			],
			phases: [
				[mockPhase('setup'), mockPhase('compile')],
				[mockPhase('test'), mockPhase('release')],
				[mockPhase('validate'), mockPhase('finalize'), mockPhase('report')],
			],
		},
		result: [
			{phases: ['setup'], units: ['unit-a']},
			{phases: ['setup', 'compile'], units: ['unit-b', 'unit-b1']},
			{phases: ['compile'], units: ['unit-c']},
			{phases: ['test'], units: ['unit-d', 'unit-d1']},
			{phases: ['test', 'release'], units: ['unit-e']},
			{phases: ['validate', 'finalize', 'report'], units: ['unit-f']},
			{phases: ['finalize'], units: ['unit-g']},
		],
	}));

	it('Fails on duplicate unit keys', () => runTestCase({
		input: {
			units: [[
				mockUnit('unit-dup', ['build']),
				mockUnit('unit-dup', ['build', 'test'])
			]],
			phases: [[mockPhase('build')]]
		},
		error: {expected: 'Found duplicate unit: \'unit-dup\''}
	}));

	it('Unit participates in multiple independent phase groups', () => runTestCase({
		description: 'Unit in multiple phase groups',
		input: {
			units: [[mockUnit('unit-x', ['build', 'test'])]],
			phases: [[mockPhase('build')], [mockPhase('test')]],
		},
		result: [
			{phases: ['build'], units: ['unit-x']},
			{phases: ['test'], units: ['unit-x']},
		],
	}));

	it('Filter inside phase group disables only subset', () => runTestCase({
		description: 'Filter disables subset of phase group',
		input: {
			units: [[mockUnit('unit-a', ['compile', 'deploy'])]],
			phases: [[
				mockPhase('compile'),
				mockPhase('deploy', () => false)
			]],
		},
		result: [
			{phases: ['compile'], units: ['unit-a']},
		],
	}));
});
