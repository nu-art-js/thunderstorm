/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {merge} from '@nu-art/ts-common';
import {addData, scenarioSet, scenarioUpdate} from '../test/add-data';
import {ModuleBE_Firebase} from '../../../main/backend';
import {describe} from 'mocha';
import {expect} from 'chai';


const db = ModuleBE_Firebase.createAdminSession().getDatabase();
export const cleanDB = () => {
	it('clean db', async () => {
		const config = await db.get('/_config');
		await db.delete('/', '/');
		config && await db.set('/_config', config);
	});
};
describe('add-data functions check', () => {
	// let const = ModuleBE_Firebase.createAdminSession().getDatabase();
	// export const cleanDB = () => {
	//     it("clean db", async () => {
	//         const config = await db.get('/_config');
	//         await db.delete('/', '/');
	//         config && await db.set('/_config', config);
	//     })
	// }

	cleanDB();

	it('test 1 addData', async () => {
		const ModelDb = {
			path: '/Desktop/red.txt',
			value: {name: 'Alon'},
			label: 'simple name object'
		};
		addData(ModelDb);
		const data = await db.get(ModelDb.path);
		expect(data).to.deep.equal(ModelDb.value);
//wrote test and test cases for add data
	});

	cleanDB();
	it('test 2 scenarioSet (overwrites)', async () => {
		const objectModel = {
			path: '/Desktop/green.txt',
			value: {name: 'Alon', age: 27},
			label: 'simple name object'
		};
		const objectModel2 = {
			path: '/Desktop/green.txt',
			value: {name: 'Alon', age: 28},
			label: 'simple name object'
		};
		await scenarioSet; //??????;
		const data = await db.get(objectModel.path);
		expect(data).to.deep.equal(objectModel2.value);
	});
	it('test 3 scenarioUpdate (Update an object over another just patches)', async () => {
		const obj1 = {
			path: '/Desktop/green.txt',
			value: {name: 'Alon', age: 27},
			label: 'simple name object'
		};
		const obj2 = {
			path: '/Desktop/green.txt',
			value: {name: 'Alon', age: 28},
			label: 'simple name object'
		};
		scenarioUpdate(obj1, obj2);
		const data = db.get(obj2.path);
		expect(data).to.deep.equal(merge(obj1.value, obj2.value));
	});
//wrote test and test cases for scenario update

	it('test 4 scenarioEscape ()', async () => {

	});
});
