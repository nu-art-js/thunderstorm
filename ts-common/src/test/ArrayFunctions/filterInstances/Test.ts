import {expect} from "chai";
import {TestSuit_ts_filterInstancesA} from "./testCases";

//describe(TestSuit_ts_filterInstancesA.label, () => {
//     TestSuit_ts_filterInstancesA.testcases.forEach(testCase => {
//         it(testCase.description, () => {
//             expect(TestSuit_ts_filterInstancesA.processor(testCase.input)).to.eql(testCase.result);
//         });
//     });
// });


describe(TestSuit_ts_filterInstancesA.label, () => {
    TestSuit_ts_filterInstancesA.testcases.forEach(testCase => {
        it(testCase.description, () => {
            const result = TestSuit_ts_filterInstancesA.processor(testCase.input);
            const expected = testCase.result;
            expect(result).to.eql(expected);
        });
    });
});