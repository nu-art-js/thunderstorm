import {DeleteFiles, getSpecificBucketInput, storage} from '../_core/consts';
import {expect} from 'chai';

export const deleteFilesTestCases: DeleteFiles['testcases'] = [
	{
		description: 'delete all files',
		result: 0,
		input: getSpecificBucketInput
	}
];

export const TestSuite_DeleteFiles: DeleteFiles = {
	label: 'Firebase Storage - delete all files',
	testcases: deleteFilesTestCases,
	processor: async (testCase) => {
		const bucket = await storage.getOrCreateBucket(testCase.input);

		await bucket.deleteFiles('testFolder');

		expect((await bucket.listFiles()).length).to.eql(testCase.result);
	}
};