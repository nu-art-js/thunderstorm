/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
 *
 * Copyright (C) 2020 Intuition Robotics
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
import {
	assert,
	BadImplementationException,
	generateHex,
	merge
} from "@ir/ts-common";
import {Patch_TestCase,} from "../_core/types";
import {FirestoreCollection_Tester} from "../_core/collection-wrapper";

type DBType = {
	id: string,
	a?: string,
	b?: string,
	c?: string
};

export type Patch_Model = Patch_TestCase<any>
const obj = {pah: "zevel", pahey: "ashpa"};

export const testPatchCollection = new FirestoreCollection_Tester<DBType>("test-patch-collection", ["id"]);

function patchTestCase(model: Patch_Model) {
	return testPatchCollection.processClean(model.label, async (collection) => {
		const id = generateHex(16);
		await collection.insert(obj as any);
		await collection.insert({id, ...model.insert});
		await collection.patch({id, ...model.override});
		const patched = await collection.queryUnique({where: {id}});
		assert("Objects do not match", merge({id}, merge(model.insert, model.override)), patched);
	});
}

// Expect Fail
function patchNonExistingDoc() {
	return testPatchCollection.processClean('Patching non existent doc', async (collection) => {
		await collection.patch({id: generateHex(8)});
	}).expectToFail(BadImplementationException, e => e.message.startsWith("Patching a non existent doc"))
}

function patchDoubleDoc() {
	return testPatchCollection.processClean('Patching a doc when there are already two with the same uniqueness', async (collection) => {
		const key = generateHex(8);
		await collection.insertAll(Array(2).fill(0).map(i => ({id: key})))
		await collection.patch({id: key});
	}).expectToFail(BadImplementationException, e => e.message.startsWith("too many results for query"))
}
// End Expect Fail

const obj_simpleA1 = {a: "label a1"};
const obj_simpleB1 = {b: "label b1"};
const obj_simpleB2 = {b: "label b2"};
const obj_simpleB1C1 = {b: "label b2", c: "label c1"};

const patchTests: Patch_Model[] = [
	{
		insert: {obj_simpleA1},
		override: obj_simpleB1,
		query: {where: obj_simpleB1},
		label: "patch two simple objects, one prop merge"
	},
	{
		insert: obj_simpleB1C1,
		override: obj_simpleB2,
		query: {where: obj_simpleB2},
		label: "patch two simple objects, two props"
	}
];


export const scenarioCollectionPatch = __scenario("Patch");
for (const patchTest of patchTests) {
	scenarioCollectionPatch.add(patchTestCase(patchTest));
}
scenarioCollectionPatch.add(patchNonExistingDoc());
scenarioCollectionPatch.add(patchDoubleDoc());