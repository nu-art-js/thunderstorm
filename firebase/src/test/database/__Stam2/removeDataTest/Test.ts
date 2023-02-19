import {TestSuit_ts_removeData} from "./removeDataCases";
import {cleanDB} from "../testAdd";
import {expect} from "chai";


describe(TestSuit_ts_removeData.label, () => {
    TestSuit_ts_removeData.testcases.forEach(testCase => {
        it(testCase.description, () => {
            cleanDB();
            const result = TestSuit_ts_removeData.processor(testCase.input);
            const expected = testCase.result;
            expect(result).to.deep.equal(expected);
        });
    });
});