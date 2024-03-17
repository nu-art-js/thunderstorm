import {TestSuite} from '../../main/testing/types';
import * as fs from 'fs';
import {parse} from 'fast-csv';
import {expect} from 'chai';
import {StreamTest_FromTransformed, StreamTest_Items, StreamTest_Type1} from './test-files/test';

type TestSuite_Stream = TestSuite<string, any>;

const testcases: TestSuite_Stream['testcases'] = [
	{
		description: 'test 1',
		input: 'test',
		result: undefined,
	}
];

export const testSuite_StreamRead: TestSuite_Stream = {
	label: 'Stream - Read CSV',
	testcases,
	processor: async (testCase) => {
		const inputFilePath = `${__dirname}/test-files/${testCase.input}.csv`;
		const stream = fs.createReadStream(inputFilePath);
		const parser = parse({headers: true})
			.transform(StreamTest_FromTransformed);

		const items: StreamTest_Type1[] = [];

		await new Promise<void>((resolve, reject) => {
			stream
				.pipe(parser)
				.on('data', data => {
					items.push(data);
				})
				.on('finish', () => {
					resolve();
				});
		});

		expect(items).to.eql(StreamTest_Items);
	}
};