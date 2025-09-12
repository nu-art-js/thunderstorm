import {TestModel} from '@nu-art/ts-common/testing/types';
import {BaiParams, BaseUnit, ExecutionStep, Phase, PhaseManager, ScheduledStep} from '../../_common.js';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';

// test input type
type Input = {
	units: BaseUnit<any>[][];
	phases: Phase<any>[];
	scheduledSteps: ScheduledStep[];
};

// test output type
type Output = ExecutionStep;

const test = async (input: Input) => {
	const {units, phases, scheduledSteps} = input;
	const manager = new PhaseManager('output-folder', phases, units, {} as BaiParams);

	return manager['mapStep'](scheduledSteps[0]);
};

// the tests, notice these can be a resolvable content, in order to keep bind consts between the input and the output
const cases: TestModel<Input, Output>[] = [
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
];

const runTestCase = (testCase: TestModel<Input, Output>) => runSingleTestCase(test, testCase);

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
	it('Error - Phase not found during mapStep()', () => runTestCase(cases[0]));
	it('Error - Unit not found during mapStep()', () => runTestCase(cases[1]));
});
