import {TestSuite} from '@nu-art/ts-common/testing/types';
import {BaiParams, BaseUnit, Phase, PhaseManager, ScheduledStep} from '../../_common';
import {voidFunction} from '@nu-art/ts-common';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';

//========================= TestSuite Definition =========================

type Input = {
	units: BaseUnit<any>[][];
	phases: Phase<any>[];
};

type Output = ScheduledStep[];

type TestSuite_CalcExecutionSteps = TestSuite<Input, Output>;
type TestCase_CalcExecutionSteps = TestSuite_CalcExecutionSteps['testcases'][number];
const cases: TestCase_CalcExecutionSteps[] = [
	{
		description: 'Single Phase, Single Unit',
		input: {
			units: [[mockUnit('unit-1', ['build'])]],
			phases: [mockPhase('build')],
		},
		result: [
			{phases: ['build'], units: ['unit-1']},
		],
	},
	{
		description: 'Single Phase, No Eligible Units',
		input: {
			units: [[mockUnit('unit-1', ['compile'])]],
			phases: [mockPhase('build')],
		},
		result: [],
	},
	{
		description: 'Two Units, One Phase Matches Both',
		input: {
			units: [[mockUnit('unit-1', ['build']), mockUnit('unit-2', ['build'])]],
			phases: [mockPhase('build')],
		},
		result: [
			{phases: ['build'], units: ['unit-1', 'unit-2']},
		],
	},
	{
		description: 'Multiple Layers and Phases',
		input: {
			units: [
				[mockUnit('unit-1', ['prepare'])],
				[mockUnit('unit-2', ['build'])],
			],
			phases: [mockPhase('prepare'), mockPhase('build')],
		},
		result: [
			{phases: ['prepare'], units: ['unit-1']},
			{phases: ['build'], units: ['unit-2']},
		],
	},
	{
		description: 'Phase with filter blocking execution',
		input: {
			units: [[mockUnit('unit-1', ['build'])]],
			phases: [mockPhase('build', async () => false)],
		},
		result: [],
	},
	{
		description: 'Unit filter removing all units',
		input: {
			units: [[mockUnit('unit-1', ['build'])]],
			phases: [mockPhase('build', undefined, async () => false)],
		},
		result: [],
	},
];


function test(input: Input) {
	const {units, phases} = input;
	const manager = new PhaseManager('output-folder', phases, units, {} as BaiParams);
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

function mockPhase(key: string, filter?: () => Promise<boolean>, unitFilter?: (unit: BaseUnit<any>) => Promise<boolean>): Phase<any> {
	return {
		key,
		method: key,
		filter,
		unitFilter,
	} as Phase<any>;
}

const runTestCase = (testCase: TestCase_CalcExecutionSteps) => runSingleTestCase(test, testCase);

describe('PhaseManager - calculateExecutionSteps', () => {
	it('Single Phase, Single Unit', () => runTestCase(cases[0]));
	it('Single Phase, No Eligible Units', () => runTestCase(cases[1]));
	it('Two Units, One Phase Matches Both', () => runTestCase(cases[2]));
	it('Multiple Layers and Phases', () => runTestCase(cases[3]));
	it('Phase with filter blocking execution', () => runTestCase(cases[4]));
	it('Unit filter removing all units', () => runTestCase(cases[5]));
});

