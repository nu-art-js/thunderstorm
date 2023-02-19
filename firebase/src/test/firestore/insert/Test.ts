import {expect} from "chai";
import {TestSuit_ts_FB_insert} from "./cases";
import {ModuleBE_Firebase} from "../../../main/backend";
import {cleanDB} from "../../database/__Stam2/testAdd";

const db = ModuleBE_Firebase.createAdminSession().getFirestore();
describe(TestSuit_ts_FB_insert.label, () => {
    TestSuit_ts_FB_insert.testcases.forEach(testCase => {
        it(testCase.description, async () => {
            cleanDB();
            await TestSuit_ts_FB_insert.processor(testCase.input);
            const collection = db.getCollection(testCase.input.path);
            const items = await collection.getAll();
            expect(items).to.deep.equal(testCase.result);
        });
    });
});
