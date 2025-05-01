import {TestSuite} from '@nu-art/ts-common/testing/types';
import {expect} from 'chai';
import {BaseUnit, Phase, PhaseManager, ScheduledStep} from '../../_common';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';

// test input type
type Input = {
	units: BaseUnit<any>[][];
	phases: Phase<any>[];
	scheduledSteps: ScheduledStep[];
};

// test output type
type Output = void;

// the tests, notice these can be a resolvable content, in order to keep bind consts between the input and the output
export const TestSuite_MapStep: TestSuite<Input, Output> = {
	label: 'PhaseManager - execute() Error Handling',
	testcases: [
		() => {
			return {
				description: 'Error - Phase not found during mapStep()',
				input: {
					units: [[]],
					phases: [],
					scheduledSteps: [{phases: ['build'], units: []}],
				},
				error: {
					expected: 'Phase \'build\' not found in PhaseManager.phases',
				},
			};
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
	// the actual test logic that will apply on the testcases above
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

// helper function to mock phases - dedicated for this test suite
function mockPhase(key: string, filter?: () => Promise<boolean>, unitFilter?: (unit: BaseUnit<any>) => Promise<boolean>): Phase<any> {
	return {
		key,
		method: key,
		filter,
		unitFilter,
	} as Phase<any>;
}

// the mocha test launch
describe('PhaseManager - mapStep', () => {
	testSuiteTester(TestSuite_MapStep);
});
