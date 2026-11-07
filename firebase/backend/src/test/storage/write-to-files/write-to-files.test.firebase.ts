import {TestSuite_Storage_Write, writeToFilesTests} from './write-to-files.js';

const titleOf = (description: string | undefined | ((...args: never[]) => string), fallback: string) =>
	typeof description === 'function' ? description() : (description || fallback);

describe('Firebase Storage - Write', () => {
	writeToFilesTests.forEach(testCase => {
		it(titleOf(testCase.description, 'write test'), () => TestSuite_Storage_Write.processor!(testCase));
	});
});
