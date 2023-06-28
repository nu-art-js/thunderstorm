import * as chaiAsPromised from 'chai-as-promised';
import {FreeForm_TestCase1} from './consts';
import {TestModel_FreeForm} from './types';


const chai = require('chai');
chai.use(chaiAsPromised);

export const TestCases_FB_FreeForm: TestModel_FreeForm['testcases'] = [
	FreeForm_TestCase1,
];

export const TestSuite_FirestoreV2_FreeForm: TestModel_FreeForm = {
	label: 'Firestore transaction - Free Form',
	testcases: TestCases_FB_FreeForm,
	processor: async (testCase) => {
		await testCase.input.run();
	}
};