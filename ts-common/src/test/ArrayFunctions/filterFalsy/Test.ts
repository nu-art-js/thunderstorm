import {expect} from "chai";
import {TestSuit_ts_filterInstancesB} from "./testCases";

//describe(TestSuit_ts_filterInstancesB.label, () => {
//     TestSuit_ts_filterInstancesB.testcases.forEach(testCase => {
//         it(testCase.description, () => {
//             expect(TestSuit_ts_filterInstancesB.processor(testCase.input)).to.eql(testCase.result);
//         });
//     });
// });

describe(TestSuit_ts_filterInstancesB.label, () => {
    TestSuit_ts_filterInstancesB.testcases.forEach(testCase => {
        it(testCase.description, () => {
            const result = TestSuit_ts_filterInstancesB.processor(testCase.input);
            const expected = testCase.result;
            expect(result).to.deep.equal(expected);
        });
    });
});