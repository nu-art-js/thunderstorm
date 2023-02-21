import {TestSuit_V3} from '@nu-art/ts-common';
import {expect} from 'chai';
import {TestSuit_ts_FB_insert} from './cases';


// export const firestoreInsertTests = () => {
// 	describe(TestSuit_ts_FB_insert.label, () => {
// 		TestSuit_ts_FB_insert.testcases.forEach(testCase => {
// 			it(testCase.description, async () => {
// 				const result = await TestSuit_ts_FB_insert.processor(testCase.input);
// 				expect(result).to.eql(testCase.result);
// 			});
// 		});
// 	});
// };


export const testSuitTester = <Input, ExpectedResult>(testSuit: TestSuit_V3<Input, ExpectedResult>) => {
	describe(testSuit.label, () => {
		testSuit.testcases.forEach(testCase => {
			it(testCase.description, async () => testSuit.processor(testCase));
		});
	});
};