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


import {simpleTypeCollectionUpsert} from "../_core/consts";
import {SimpleType} from "../_core/types";
import {__scenario} from "@ir/testelot";
import {BadImplementationException} from "@ir/ts-common";

export const scenarioUpsert = __scenario('Upsert');

scenarioUpsert.add(simpleTypeCollectionUpsert.processClean("Upsert", async (collection) => {
	const x: SimpleType = {
		label: 'a',
		deleteId: 'b'
	};
	await collection.upsert(x)

}));
scenarioUpsert.add(simpleTypeCollectionUpsert.processClean("Upsert undefined should fail", async (collection) => {
	const x: SimpleType = {
		label: 'a',
		deleteId: 'b',
		optional: undefined
	};
	await collection.upsert(x)

}).expectToFail(BadImplementationException, (e: Error) => e.message.toLowerCase().startsWith("no where properties are allowed to be null or undefined")));