import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {BaseUnit, Phase, PhaseManager, ScheduledStep} from '../../_common';


type Input = {
	units: BaseUnit<any>[][];
	phases: Phase<any>[];
	scheduledSteps: ScheduledStep[];
};

type Output = void;

export const TestSuite_MapStep: TestSuite<Input, Output> = {
	label: 'PhaseManager - execute() Error Handling',
	testcases: [
		{
			description: 'Error - Phase not found during mapStep()',
			input: {
				units: [[]],
				phases: [],
				scheduledSteps: [{phases: ['build'], units: []}],
			},
			error: {
				expected: 'Phase \'build\' not found in PhaseManager.phases',
			},
		},
		{
			description: 'Error - Unit not found during mapStep()',
			input: {
				units: [[]],
				phases: [mockPhase('build')],
				scheduledSteps: [{phases: ['build'], units: ['missing-unit']}],
			},
			error: {
				expected: 'Unit \'missing-unit\' not found in PhaseManager.units',
			},
		}
	],
	processor: async (testCase) => {
		const {units, phases, scheduledSteps} = testCase.input;
		const manager = new PhaseManager('output-folder', phases, units);

		if ('error' in testCase) {
			expect(() => manager['mapStep'](scheduledSteps[0])).to.throw(testCase.error.expected, testCase.error.message);
			return;
		}

		manager['mapStep'](scheduledSteps[0]);
	}
};


function mockPhase(key: string, filter?: () => Promise<boolean>, unitFilter?: (unit: BaseUnit<any>) => Promise<boolean>): Phase<any> {
	return {
		key,
		method: key,
		filter,
		unitFilter,
	} as Phase<any>;
}

