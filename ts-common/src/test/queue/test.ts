import {runSingleTestCase} from '@nu-art/testalot';
import {TestCases_Queue, testQueue, queueProcessor, TestCase_Queue} from './queue.js';

const runTestCase = (testCase: TestCase_Queue) => {
	return () => runSingleTestCase(testQueue, testCase, queueProcessor);
};

describe('queue test', () => {
	TestCases_Queue.forEach(testCase => {
		it(testCase.description || 'queue', runTestCase(testCase)).timeout(100000);
	});
});
