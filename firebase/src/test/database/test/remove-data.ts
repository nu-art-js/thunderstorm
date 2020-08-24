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

import {__scenario} from "@nu-art/testelot";
import {myDb} from "../_core/database-wrapper";
import {
	assert,
	BadImplementationException
} from "@nu-art/ts-common";

const removeData = () => myDb.processDirty('Removing a node', async db => {
	await db.set(objectModel.path, objectModel.value);
	await db.delete(objectModel.path);
	const nullVal = await db.get(objectModel.path);
	assert("Values don't match", nullVal, undefined);
});

const removeHigherNode = () => myDb.processDirty('Remove a higher node deleted data under it', async db => {
	await db.set(objectModel.path, objectModel.value);
	await db.delete(basePath, basePath);
	const nullVal = await db.get(objectModel.path);
	assert("Values don't match", nullVal, undefined);
});

const removeLowerNode = () => myDb.processDirty('Remove a lower node only deleted the lower part of it', async db => {
	await db.set(objectModel.path, objectModel.value);
	await db.delete(`${objectModel.path}/a`);
	const val = await db.get(objectModel.path);
	const compareVal = objectModel.value;
	delete compareVal.a;
	assert("Values don't match", val, compareVal);
});

const removeFail = (model: ModelFail) => myDb.processDirty(model.label, async db => {
	await db.delete(model.path as string);
}).expectToFail(BadImplementationException, e => e.message.startsWith(model.errorMessage));

type ModelFail = {
	path?: string
	errorMessage: string
	label: string
}

const models: ModelFail[] = [
	{
		path: undefined,
		errorMessage: 'Falsy value, path: ',
		label: 'Pass undefined to remove should fail'
	},
	{
		path: '',
		errorMessage: 'Falsy value, path: ',
		label: 'Pass empty string to remove should fail'
	},
	{
		path: '/',
		errorMessage: `path: '/'  does not match assertion: `,
		label: 'Root removal without check is not allowed'
	},
	{
		path: '/some',
		errorMessage: `path: '/some'  does not match assertion: `,
		label: 'First level removal without check is not allowed'
	}
];

const basePath = '/test';
const path = `${basePath}/object`;
const objectModel: { path: string; label: string; value: { a?: number; b: string } } = {
	path: path,
	value: {a: 1, b: 'cc'},
	label: 'Removing a node'
};

export const scenarioRemoveData = __scenario("Remove data");
scenarioRemoveData.add(removeData());
scenarioRemoveData.add(removeHigherNode());
scenarioRemoveData.add(removeLowerNode());
models.forEach(m => scenarioRemoveData.add(removeFail(m)));