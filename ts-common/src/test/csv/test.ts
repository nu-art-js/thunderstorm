import {testSuiteTester} from '../../main/testing/consts';
import {TestSuite_CSVWrite} from './csv-write';
import {TestSuite_CSVRead} from './csv-read';
import * as fs from 'fs';

const TestSuiteTester_CSVWrite = () => testSuiteTester(TestSuite_CSVWrite);
const TestSuiteTester_CSVRead = () => testSuiteTester(TestSuite_CSVRead);

export const runCSVTests = () => {
	const testFilesPath = __dirname + '/test-files';
	// if (fs.existsSync(testFilesPath))
	// 	fs.rmSync(testFilesPath);

	TestSuiteTester_CSVWrite();
	TestSuiteTester_CSVRead();
};