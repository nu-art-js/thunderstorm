import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {TestSuite_CalculateExecutionSteps} from './cases/PhasedExecutionPlanner';
import {TestSuite_MapStep} from './cases/PhasedStepMapper';


describe('PhaseManager - calculateExecutionSteps', () => {
	testSuiteTester(TestSuite_CalculateExecutionSteps);
});


describe('PhaseManager - mapStep', () => {
	testSuiteTester(TestSuite_MapStep);
});
