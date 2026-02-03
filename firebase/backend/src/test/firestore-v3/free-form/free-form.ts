import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {FreeForm_TestCase1} from './consts.js';
import {TestCase_FreeForm, TestModel_FreeForm} from './types.js';

chai.use(chaiAsPromised);

export const TestCases_FB_FreeForm: TestModel_FreeForm['testcases'] = [
	FreeForm_TestCase1,
];

export const TestCases_FirestoreV3_FreeForm = TestCases_FB_FreeForm;

export const test_FirestoreV3_FreeForm = (input: TestCase_FreeForm): Promise<any> => input.run();

export const TestSuite_FirestoreV3_FreeForm: TestModel_FreeForm = {
	label: 'Firestore transaction - Free Form',
	testcases: TestCases_FB_FreeForm,
	processor: async (testCase: TestModel_FreeForm['testcases'][number]) => {
		await testCase.input.run();
	}
};