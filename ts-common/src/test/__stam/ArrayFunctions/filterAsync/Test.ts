
import {expect} from "chai";
import {TestSuit_ts_filterAsync} from "./testCases";

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Load chai-as-promised support
chai.use(chaiAsPromised);

describe(TestSuit_ts_filterAsync.label, () => {
    TestSuit_ts_filterAsync.testcases.forEach(testCase => {
        it(testCase.description, () => expect(Promise.resolve(TestSuit_ts_filterAsync.processor(testCase.input))).to.eventually.deep.equal(testCase.result));
    });
});