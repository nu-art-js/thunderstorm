"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_common_1 = require("@nu-art/ts-common");
const add_data_1 = require("../../database/test/add-data");
const backend_1 = require("../../../main/backend");
const mocha_1 = require("mocha");
const chai_1 = require("chai");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);
(0, mocha_1.describe)('add-data functions check', () => {
    const db = backend_1.ModuleBE_Firebase.createAdminSession().getDatabase();
    const cleanDB = () => {
        it('clean db', () => __awaiter(void 0, void 0, void 0, function* () {
            const config = yield db.get('/_config');
            yield db.delete('/', '/');
            config && (yield db.set('/_config', config));
        }));
    };
    cleanDB();
    it('test 1 addData', () => __awaiter(void 0, void 0, void 0, function* () {
        const ModelDb = {
            path: '/Desktop/red.txt',
            value: { name: 'Alon' },
            label: 'simple name object'
        };
        (0, add_data_1.addData)(ModelDb);
        const data = yield db.get(ModelDb.path);
        (0, chai_1.expect)(data).to.deep.equal(ModelDb.value);
    }));
    cleanDB();
    it('test 2 scenarioSet (overwrites)', () => __awaiter(void 0, void 0, void 0, function* () {
        const ModelDb = {
            path: '/Desktop/green.txt',
            value: { name: 'Alon' },
            label: 'simple name object'
        };
        // scenarioSet.; //??????
        const data = yield db.get(ModelDb.path);
        (0, chai_1.expect)(data).to.deep.equal(ModelDb.value);
    }));
    it('test 3 scenarioUpdate (Update an object over another just patches)', () => __awaiter(void 0, void 0, void 0, function* () {
        const obj1 = {
            path: '/Desktop/green.txt',
            value: { name: 'Alon', age: 27 },
            label: 'simple name object'
        };
        const obj2 = {
            path: '/Desktop/green.txt',
            value: { name: 'Alon', age: 28 },
            label: 'simple name object'
        };
        (0, add_data_1.scenarioUpdate)(obj1, obj2);
        const data = db.get(obj2.path);
        (0, chai_1.expect)(data).to.deep.equal((0, ts_common_1.merge)(obj1.value, obj2.value));
    }));
    it('test 4 scenarioEscape ()', () => __awaiter(void 0, void 0, void 0, function* () {
    }));
});
//# sourceMappingURL=testAdd.js.map