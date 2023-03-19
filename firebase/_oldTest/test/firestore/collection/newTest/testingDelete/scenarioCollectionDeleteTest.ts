import {expect} from 'chai';
import {testInstance1} from "../../_core/consts";
import {ModuleBE_Firebase} from "../../../../../../src/main/backend";
import {cleanDB} from "../../../../../../src/test/database/__Stam2/testAdd";

const db = ModuleBE_Firebase.createAdminSession().getDatabase();

describe('Delete Scenario', () => {
    cleanDB();
    it('Insert and delete - one item', async () => {
        const defaultPath = "shoobyDubi";
        await db.set(defaultPath, testInstance1);

        const items = await db.get(defaultPath);
        expect((items as []).length).to.equal(1);

        await db.delete(defaultPath);
        expect((await db.get(defaultPath) as []).length).to.equal(0);
    });
});
