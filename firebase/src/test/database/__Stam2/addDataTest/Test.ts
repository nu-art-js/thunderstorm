import {expect} from "chai";
import {TestSuit_ts_AddData} from "./addCases";
import {cleanDB} from "../testAdd";

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Load chai-as-promised support
chai.use(chaiAsPromised);

describe(TestSuit_ts_AddData.label, () => {
    TestSuit_ts_AddData.testcases.forEach(testCase => {
        it(testCase.description, () => {
            cleanDB();
            const result = TestSuit_ts_AddData.processor(testCase.input);
            const expected = testCase.result;
            expect(result).to.deep.equal(expected);
        });
    });
});

