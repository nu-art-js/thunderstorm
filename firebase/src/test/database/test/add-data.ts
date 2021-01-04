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

import {__scenario} from "@ir/testelot";
import {myDb} from "../_core/database-wrapper";
import {
	assert,
	merge
} from "@ir/ts-common";

type ModelDb = {
	path: string
	value: any
	label: string
};

export const scenarioAddData = __scenario("Add data");
const objectPath = 'test/object';
const stringModel = {
	path: 'test/string',
	value: 'hello',
	label: 'Adding a string'
};
const numberModel = {
	path: 'test/number',
	value: 21,
	label: 'Adding a number'
};
const objectModel = {
	path: objectPath,
	value: {a: 1, b: 'cc'},
	label: 'Adding an object'
};
const arrayModel = {
	path: 'test/array',
	value: ['a', 'b', 'c'],
	label: 'Adding an array'
};

const objectModel2 = {
	path: objectPath,
	value: {a: 2},
	label: 'Adding an object'
};

const modelToEscape = {
	path: objectPath,
	value: {
		command: "flash-dsp",
		data: "https://storage.googleapis.com/elliq-env-dev.appspot.com/resources/test/ElliQ_ver2.22_20200629.mbi"
	},
	label: 'Adding an object'
};



const simpleModels: ModelDb[] = [
	stringModel,
	numberModel,
	objectModel,
	arrayModel
];

const addData = (model: ModelDb) => myDb.processDirty(model.label, async db => {
	await db.set<typeof model.value>(model.path, model.value);
	const readVal = await db.get(model.path);
	assert("Values don't match", readVal, model.value);
});

const scenarioSet = myDb.processClean('Set an object over another overwrites', async db => {
	await db.set(objectModel.path, objectModel.value);
	await db.set(objectModel.path, objectModel2.value);
	const readVal = await db.get(objectModel.path);
	assert("Values don't match", readVal, objectModel2.value);
});

const scenarioUpdate = myDb.processClean('Update an object over another just patches', async db => {
	await db.set(objectModel.path, objectModel.value);
	await db.patch(objectModel.path, objectModel2.value);
	const readVal = await db.get(objectModel.path);
	assert("Values don't match", readVal, merge(objectModel.value, objectModel2.value));
});

const scenarioEscape = myDb.processDirty('Do I need to escape my values?', async db => {
	await db.set(modelToEscape.path,modelToEscape.value);
});

simpleModels.forEach(model => scenarioAddData.add(addData(model)))
scenarioAddData.add(scenarioSet);
scenarioAddData.add(scenarioEscape);