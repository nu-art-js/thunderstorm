import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_FileDelete, test_FileDelete} from './file-delete.js';
import {TestCases_DeleteFiles, test_DeleteFiles} from './deleteFiles.js';
import {expect} from 'chai';

const runTestCase_FileDelete = (testCase: typeof TestCases_FileDelete[number]) => () => {
	return runSingleTestCase(test_FileDelete, {
		...testCase,
		result: async (actual) => {
			expect(actual).to.eql(testCase.result);
		}
	});
};

const runTestCase_DeleteFiles = (testCase: typeof TestCases_DeleteFiles[number]) => () => {
	return runSingleTestCase(test_DeleteFiles, {
		...testCase,
		result: async (actual) => {
			expect(actual).to.eql(testCase.result);
		}
	});
};

describe('Firebase Storage - Delete File', () => {
	describe('FileDelete', () => {
		TestCases_FileDelete.forEach(testCase => {
			it(testCase.description || 'file delete test', runTestCase_FileDelete(testCase));
		});
	});

	describe('DeleteFiles', () => {
		TestCases_DeleteFiles.forEach(testCase => {
			it(testCase.description || 'delete files test', runTestCase_DeleteFiles(testCase));
		});
	});
});
