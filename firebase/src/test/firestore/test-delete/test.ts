// import {ModuleBE_Firebase} from "../../../main/backend";
// import {expect} from "chai";
// import {cleanDB} from "../../database/__Stam2/testAdd";
// import {testInstance1} from "../../../../_oldTest/test/firestore/collection/_core/consts";
// import {TestSuit_ts_FB_delete} from "./cases";
//
// const db = ModuleBE_Firebase.createAdminSession().getFirestore();
//
//
// describe(TestSuit_ts_FB_delete.label, () => {
//     cleanDB();
//     TestSuit_ts_FB_delete.testcases.forEach(testCase => {
//         it(testCase.description, async () => {
//             await db.test-add-data(testInstance1);
//             const items = await db.getAll();
//             expect((items as []).length).to.equal(testCase.result);
//             await db.deleteAll();
//             expect((await db.get() as []).length).to.equal(testCase.result - 1);
//         });
//     });
// });