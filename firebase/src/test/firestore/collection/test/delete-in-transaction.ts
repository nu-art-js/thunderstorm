/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {simpleTypeCollection} from '../_core/consts';
import {__scenario} from '@nu-art/testelot';
import {BadImplementationException, generateHex} from '@nu-art/ts-common';

export const scenarioCollectionDeleteInTransaction = __scenario('Delete In Transaction');
const deleteId = generateHex(8);
const n = 600;

scenarioCollectionDeleteInTransaction.add(simpleTypeCollection.processClean(`Addding ${n} Elements`, async (collection) => {

	// console.log(`Inserting ${n} elements....`);
	const instances = new Array(n).fill(0).map(e => ({
		label: generateHex(16),
		deleteId
	}));
	await collection.insertAll(instances);
	// console.log('inserted normally');
	// await collection.runInTransaction(transaction => {
	// 	return transaction.insertAll(collection,instances)
	// })
	// console.log(`Inserted ${n} elements....`);
}));

scenarioCollectionDeleteInTransaction.add(simpleTypeCollection.processDirty('Trying to Delete Elements', async (collection) => {
	// console.log('Deleting a ton of documents');
	await collection.runInTransaction(transaction => {
		return transaction.delete(collection, {where: {deleteId: deleteId}});
	});
	// console.log('Deleted a ton of documents');

	// assert("Expected db to be empty", (await collection.getAll()).length, 0);
}).expectToFail(BadImplementationException, (e: Error) => e.message.toLowerCase().startsWith('trying to delete')));
