import {merge} from "@nu-art/ts-common";
import {addData, scenarioSet, scenarioUpdate} from "../../database/test/add-data";
import {ModuleBE_Firebase} from "../../../main/backend";
import {describe} from 'mocha';
import {expect} from "chai";


describe("add-data functions check", () => {
    let db = ModuleBE_Firebase.createAdminSession().getDatabase();
    const cleanDB = () => {
        it("clean db", async () => {
            const config = await db.get('/_config');
            await db.delete('/', '/');
            config && await db.set('/_config', config);
        })
    }

    cleanDB();

    it("test 1 addData", async () => {
        const ModelDb = {
            path: "/Desktop/red.txt",
            value: {name: "Alon"},
            label: "simple name object"
        };
        addData(ModelDb);
        const data = await db.get(ModelDb.path);
        expect(data).to.deep.equal(ModelDb.value);

    });

    cleanDB()
    it("test 2 scenarioSet (overwrites)", async () => {
        const ModelDb = {
            path: "/Desktop/green.txt",
            value: {name: "Alon"},
            label: "simple name object"
        };
        scenarioSet.; //??????
        const data = await db.get(ModelDb.path);
        expect(data).to.deep.equal(ModelDb.value);
    });
    it("test 3 scenarioUpdate (Update an object over another just patches)", async () => {
        const obj1 = {
            path: "/Desktop/green.txt",
            value: {name: "Alon", age: 27},
            label: "simple name object"
        };
        const obj2 = {
            path: "/Desktop/green.txt",
            value: {name: "Alon", age: 28},
            label: "simple name object"
        };
        scenarioUpdate(obj1, obj2);
        const data =  db.get(obj2.path);
        expect(data).to.deep.equal(merge(obj1.value, obj2.value));
    });
    it("test 4 scenarioEscape ()", async () => {

    });
});
