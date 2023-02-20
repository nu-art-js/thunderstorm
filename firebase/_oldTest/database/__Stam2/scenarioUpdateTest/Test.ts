import {TestSuit_ts_scenarioUpdate} from "./scenarioUpdateCases";
import {expect} from "chai";
import {cleanDB} from "../testAdd";

describe(TestSuit_ts_scenarioUpdate.label, () => {
    TestSuit_ts_scenarioUpdate.testcases.forEach(testCase => {
        it(testCase.description, () => {
            cleanDB();
            const result = TestSuit_ts_scenarioUpdate.processor(testCase.input);
            const expected = testCase.result;
            expect(result).to.deep.equal(expected);
        });
    });
});