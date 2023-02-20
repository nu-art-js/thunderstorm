import {expect} from "chai";
import {TestSuit_ts_filterDuplicates} from "./testCases";

//describe(TestSuit_ts_filterDuplicates.label, () => {
//     TestSuit_ts_filterDuplicates.testcases.forEach(testCase => {
//         it(testCase.description, () => {
//             expect(TestSuit_ts_filterDuplicates.processor(testCase.input)).to.eql(testCase.result);
//         });
//     });
// });

describe(TestSuit_ts_filterDuplicates.label, () => {
    TestSuit_ts_filterDuplicates.testcases.forEach(testCase => {
        it(testCase.description, async () => {
            const result = TestSuit_ts_filterDuplicates.processor(testCase.input);
            const expected = testCase.result;
            expect(result).to.deep.equal(expected);
        });
    });
});