import {TestSuit_ts_compare} from "../../compare/testCases";
import {expect} from "chai";
import {TestSuit_ts_groupArrayBy} from "./testCases";

//describe(TestSuit_ts_groupArrayBy.label, () => {
//     TestSuit_ts_groupArrayBy.testcases.forEach(testCase => {
//         it(testCase.description, () => {
//             expect(TestSuit_ts_groupArrayBy.processor(testCase.input)).to.eql(testCase.result);
//         });
//     });
// });


describe(TestSuit_ts_groupArrayBy.label, () => {
    TestSuit_ts_groupArrayBy.testcases.forEach(testCase => {
        it(testCase.description, () => {
            const result = TestSuit_ts_groupArrayBy.processor(testCase.input);
            const expected = testCase.result;
            expect(result).to.eql(expected);
        });
    });
});