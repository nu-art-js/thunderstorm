import {failedWriteResult, storage, writeTestInput1, writeTestInput2, writeTestInput3, writeTestInput4, writeTestInput5, WriteTests} from '../_core/consts';
import {BadImplementationException} from '@nu-art/ts-common';
import {expect} from 'chai';

export const writeToFilesTests: WriteTests['testcases'] = [
	{
		description: 'write string to file',
		result: writeTestInput1.value,
		input: writeTestInput1
	},
	{
		description: 'write number to file',
		result: writeTestInput2.value,
		input: writeTestInput2
	},
	{
		description: 'write object to file',
		result: writeTestInput3.value,
		input: writeTestInput3
	},
	{
		description: 'write buffer to file',
		result: writeTestInput4.value,
		input: writeTestInput4
	},
	{
		description: 'handle undefined value',
		result: failedWriteResult,
		input: writeTestInput5
	}
];

export const TestSuite_Storage_Write: WriteTests = {
	label: 'Firebase storage write tests',
	testcases: writeToFilesTests,
	processor: async (testCase) => {
		const bucket = await storage.getOrCreateBucket();
		const file = await bucket.getFile(testCase.input!.filePath);
		let result;

		try {
			await file.write(testCase.input.value);
			const buffer = await file.read();
			result = buffer;
		} catch (err) {
			result = new BadImplementationException('');
		}


		expect(result.toString()).to.eql(testCase.input.stringify ? JSON.stringify(testCase.result) : testCase.result.toString());
	}
};