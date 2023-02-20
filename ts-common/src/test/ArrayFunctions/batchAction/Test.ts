import {expect} from "chai";
import {TestSuit_ts_batchAction} from "./testCases";

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Load chai-as-promised support
chai.use(chaiAsPromised);

describe(TestSuit_ts_batchAction.label, () => {
    TestSuit_ts_batchAction.testcases.forEach(testCase => {
        it(testCase.description, async () => {
            const result = await TestSuit_ts_batchAction.processor(testCase.input);
            const expected = await testCase.result;
            expect(result).to.deep.equal(expected);
        });
    });
});

