import {TestSuite} from '../../main/testing/types';
import * as fs from 'fs';
import {format} from 'fast-csv';
import {StreamTest_Items, StreamTest_ToTransformed} from './test-files/test';

type TestSuite_Stream = TestSuite<string, any>;

const testcases: TestSuite_Stream['testcases'] = [
	{
		description: 'test 1',
		input: 'test',
		result: undefined,
	}
];

export const testSuite_StreamWrite: TestSuite_Stream = {
	label: 'Stream - Write CSV',
	testcases,
	processor: async (testCase) => {
		const inputFilePath = `${__dirname}/test-files/${testCase.input}.csv`;
		const writeStream = fs.createWriteStream(inputFilePath);
		const CsvStream = format({headers: true})
			.transform(StreamTest_ToTransformed);

		CsvStream.pipe(writeStream);
		StreamTest_Items.forEach(item => CsvStream.write(item));
	}
};