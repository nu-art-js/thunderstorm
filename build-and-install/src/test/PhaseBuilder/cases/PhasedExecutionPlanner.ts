import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {BaseUnit, Phase, PhaseManager, ScheduledStep} from '../../_common';
import {voidFunction} from '@nu-art/ts-common';

//========================= TestSuite Definition =========================

type Input = {
	units: BaseUnit<any>[][];
	phases: Phase<any>[];
};

type Output = ScheduledStep[];

export const TestSuite_CalculateExecutionSteps: TestSuite<Input, Output> = {
	label: 'PhaseManager - calculateExecutionSteps',
	testcases: [
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
	],
	processor: async (testCase) => {
		const {units, phases} = testCase.input;
		const manager = new PhaseManager('output-folder', phases, units);

		if ('error' in testCase) {
			await expect(manager.calculateExecutionSteps()).to.be.rejectedWith(testCase.error.expected, testCase.error.message);
			return;
		}

		const steps = await manager.calculateExecutionSteps();
		expect(steps).to.deep.equal(testCase.result);
	}
};

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
