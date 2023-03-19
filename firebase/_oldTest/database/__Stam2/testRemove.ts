import {myDb} from "../_core/database-wrapper";
import {describe} from 'mocha';
import {addData} from "../test/add-data";
import {expect} from "chai";
import {ModuleBE_Firebase} from "../../../main/backend";
import {removeData, removeHigherNode, removeLowerNode} from "../test/remove-data";


describe("remove-data functions Check", () => {
    const db = ModuleBE_Firebase.createAdminSession().getDatabase();
    const cleanDB = () => {
        it("clean db", async () => {
            const config = await db.get('/_config');
            await db.delete('/', '/');
            config && await db.set('/_config', config);
        })
    }

    cleanDB();

    it("test 1 RemoveData", async () => {
        const ModelDb = {
            path: "/Desktop/red.txt",
            value: {name: "Alon"},
            label: "simple name object"
        };
        addData(ModelDb);
        removeData();
        expect(db.get(ModelDb.path)).to.deep.equal(undefined);
    });
    it("test 2 removeHigherNode", async () => {
        const ModelDb = {
            path: "/Desktop/red.txt",
            value: {name: "Alon"},
            label: "simple name object"
        };
        const expected = {
            path: "/Desktop/red.txt",
            value: {name: "Alon"},
            label: "simple name object"
        };

        removeHigherNode();
        expect(db.get(ModelDb.path)).to.deep.equal(expected);
    });
    it("test 3 remove lower node", async () => {
        const ModelDb = {
            path: "/Desktop/red.txt",
            value: {name: "Alon"},
            label: "simple name object"
        };
        const expected = {
            path: "/Desktop/red.txt",
            value: {name: "Alon"},
            label: "simple name object"
        };
        removeLowerNode();
        expect(db.get(ModelDb.path)).to.deep.equal(expected);
    });
    it("test 4 remove fail", async () => {

    });


});
