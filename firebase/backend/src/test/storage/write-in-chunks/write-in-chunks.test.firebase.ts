import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_WriteInChunks, test_WriteInChunks} from './write-in-chunks.js';

const runTestCase = (testCase: typeof TestCases_WriteInChunks[number]) => () => runSingleTestCase(test_WriteInChunks, testCase);

describe('Firebase Storage - Write In Chunks', () => {
	TestCases_WriteInChunks.forEach(testCase => {
		it(testCase.description || 'write in chunks test', runTestCase(testCase));
	});
});
