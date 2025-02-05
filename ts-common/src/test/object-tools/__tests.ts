import {testSuiteTester} from '../_main';
import {TestSuite_compare} from './cases/compare';
import {TestSuite_scrub} from './cases/scrub';

describe('Compare', () => {
	testSuiteTester(TestSuite_compare);
});

describe('Scrub', () => {
	testSuiteTester(TestSuite_scrub);
});
