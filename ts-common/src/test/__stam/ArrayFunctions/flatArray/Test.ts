import {TestSuit_ts_compare} from "../../compare/testCases";
import {expect} from "chai";
import {TestSuit_ts_flatArray} from "./testCases";

//describe(TestSuit_ts_flatArray.label, () => {
//     TestSuit_ts_flatArray.testcases.forEach(testCase => {
//         it(testCase.description, () => {
//             expect(TestSuit_ts_flatArray.processor(testCase.input)).to.eql(testCase.result);
//         });
//     });
// });

describe(TestSuit_ts_flatArray.label, () => {
    TestSuit_ts_flatArray.testcases.forEach(testCase => {
        it(testCase.description, () => {
            const result = TestSuit_ts_flatArray.processor(testCase.input);
            const expected = testCase.result;
            expect(result).to.eql(expected);
        });
    });
});