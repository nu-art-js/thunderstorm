import {TestSuite_WriteInChunks, writeInChunksTestCases} from './write-in-chunks.js';

const titleOf = (description: string | undefined | ((...args: never[]) => string), fallback: string) =>
	typeof description === 'function' ? description() : (description || fallback);

describe('Firebase Storage - Write In Chunks', () => {
	writeInChunksTestCases.forEach(testCase => {
		it(titleOf(testCase.description, 'write in chunks test'), () => TestSuite_WriteInChunks.processor!(testCase));
	});
});
