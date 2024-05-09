import {testSuiteTester} from '../../main/testing/consts';
import {testSuite_StreamRead} from './stream-read';
import {testSuite_StreamWrite} from './stream-write';

const tests = [
	() => testSuiteTester(testSuite_StreamWrite),
	() => testSuiteTester(testSuite_StreamRead),
];

export const runStreamTests = () => {
	tests.forEach(test => test());
};