import {TestSuite} from '../../main/testing/types.js';
import * as fs from 'fs';
import {format} from 'fast-csv';
import {runSingleTestCase} from '../../main/testing/consts.js';
import {StreamTest_Items, StreamTest_ToTransformed} from './test-helper.js';
import {FileSystemUtils} from '../../main/utils/FileSystemUtils.js';
import path, {resolve} from 'node:path';
import {___dirname} from '../../main/esm.js';
import assert from 'node:assert/strict';

export type Input = string;
export type Result = undefined;
export type TestSuite_StreamWrite = TestSuite<Input, Result>;
export type TestCase_StreamWrite = TestSuite_StreamWrite['testcases'][number];

const testFilesDir = path.join(___dirname(import.meta.url), 'test-files');

const test = async (input: Input): Promise<Result> => {
	const outputPath = resolve(testFilesDir, `${input}.csv`);
	const writeStream = fs.createWriteStream(outputPath);
	const csvStream = format({headers: true}).transform(StreamTest_ToTransformed);

	await new Promise<void>((resolve, reject) => {
		csvStream.pipe(writeStream)
			.on('error', reject)
			.on('finish', resolve);

		StreamTest_Items.forEach(item => csvStream.write(item));
		csvStream.end();
	});
};

const runTestCase = (testCase: TestCase_StreamWrite) => {
	return () => runSingleTestCase(test, testCase);
};
const CSV_CONTENT = [
	'id,name1',
	'0000,Adam',
	'1111,Matan',
	'2222,Itay',
	'3333,Yuval',
	'4444,Harel'
].join('\n');

describe('Stream - Write CSV', () => {
	beforeEach(async () => {
		await FileSystemUtils.folder.delete(testFilesDir);
		await FileSystemUtils.folder.create(testFilesDir);
	});

	afterEach(async () => {
		await FileSystemUtils.folder.delete(testFilesDir);
	});

	it('Writes transformed rows to "test.csv"', runTestCase({
		input: 'test',
		result: async () => {
			const actual = (await FileSystemUtils.file.read(resolve(testFilesDir, `test.csv`))).trim();
			assert.strictEqual(actual, CSV_CONTENT, `CSV content mismatch`);
		},
	}));
});
