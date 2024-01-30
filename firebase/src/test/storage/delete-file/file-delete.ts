import {deleteFileInput, FileDelete, getSpecificBucketInput, notExistingFileName, storage} from '../_core/consts';
import {expect} from 'chai';


export const fileDeleteTestCases: FileDelete['testcases'] = [
	{
		description: 'deletes one file with the file ref',
		result: true,
		input: deleteFileInput
	},
	{
		description: 'file not found',
		result: false,
		input: notExistingFileName

	}
];


export const TestSuite_FileDelete: FileDelete = {
	label: 'Firebase Storage - Delete File from ref',
	testcases: fileDeleteTestCases,
	processor: async (testCase) => {
		const bucket = await storage.getOrCreateBucket(getSpecificBucketInput);
		let result;
		try {
			const file = await bucket.getFile(testCase.input);
			await file.delete();
			result = true;
		} catch (err) {
			result = false;
		}

		expect(result).to.eql(testCase.result);
	}
};
