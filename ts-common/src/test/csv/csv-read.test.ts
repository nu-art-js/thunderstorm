import {TestSuite} from '../../main/testing/types.js';
import {keysToStringify, TestData, testData} from './test-data.js';
import * as fs from 'fs';
import {JSONCSVModule_Class} from '../../main/modules/JSONCSVModule.js';
import {runSingleTestCase} from '../_main.js';
import {writeFile} from 'node:fs/promises';
import {FileSystemUtils} from '../../main/utils/FileSystemUtils.js';
import {___dirname} from '../../main/esm.js';
import {resolve} from 'node:path';

export type Input = string;
export type Result = TestData[];
export type TestSuite_CSVRead = TestSuite<Input, Result>;
export type TestCase_CSVRead = TestSuite_CSVRead['testcases'][number];

const dirname = ___dirname(import.meta.url);
const test = async (input: Input): Promise<Result> => {
	const filePath = `${dirname}/test-files/${input}.csv`;
	const readable = fs.createReadStream(filePath);
	const items: TestData[] = [];
	const JSONCSV = new JSONCSVModule_Class(keysToStringify);
	await JSONCSV.readFromStream(readable, (item: TestData) => {
		if (!item.optional)
			delete item.optional;
		items.push(item);
	});
	return items;
};

const runTestCase = (testCase: TestCase_CSVRead) => {
	return () => runSingleTestCase(test, testCase);
};

const CSV_CONTENT = [
	'id,name,optional,innerObject,innerArray,arrayOfObjects',
	'0000,Adam,asd,"{""a"":10,""b"":""Po""}",[],"[{""a"":10},{""a"":20}]"',
	'1111,Matan,,"{""a"":20,""b"":""Ze""}",[1],"[{""a"":20}]"',
	'2222,Itay,,"{""a"":30,""b"":""Zevel""}","[1,2]",[]',
].join('\n');

describe('CSV - Read', () => {
	const csvPath = resolve(dirname, 'test-files/test.csv');
	before(async () => {
		await FileSystemUtils.file.write(csvPath, CSV_CONTENT);
	});

	after(async () => {
		await FileSystemUtils.folder.delete(resolve(dirname, 'test-files'));
	});

	it('Reads and parses "test.csv" into typed TestData[]', async () => {
		await writeFile(csvPath, CSV_CONTENT, 'utf8');
		return runTestCase({
			input: 'test',
			result: testData
		});
	});

});
