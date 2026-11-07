import {fileDeleteTestCases, TestSuite_FileDelete} from './file-delete.js';
import {deleteFilesTestCases, TestSuite_DeleteFiles} from './deleteFiles.js';

const titleOf = (description: string | undefined | ((...args: never[]) => string), fallback: string) =>
	typeof description === 'function' ? description() : (description || fallback);

describe('Firebase Storage - Delete File', () => {
	describe('FileDelete', () => {
		fileDeleteTestCases.forEach(testCase => {
			it(titleOf(testCase.description, 'file delete test'), () => TestSuite_FileDelete.processor!(testCase));
		});
	});

	describe('DeleteFiles', () => {
		deleteFilesTestCases.forEach(testCase => {
			it(titleOf(testCase.description, 'delete files test'), () => TestSuite_DeleteFiles.processor!(testCase));
		});
	});
});
