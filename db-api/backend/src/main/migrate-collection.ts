/*
 * Database API Generator is a utility library for Thunderstorm.
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

import {StaticLogger} from '@nu-art/ts-common';
import {FirestoreWrapperBE, MongoWrapperBE} from '@nu-art/firebase-backend';
import {BaseDBDefBE} from './backend-types.js';


type CollectionWrapper = FirestoreWrapperBE | MongoWrapperBE;

const DefaultChunkSize = 200;

export async function migrateCollection(
	dbDef: BaseDBDefBE,
	source: CollectionWrapper,
	target: CollectionWrapper,
	options?: { chunkSize?: number }
): Promise<void> {
	const chunkSize = options?.chunkSize ?? DefaultChunkSize;
	const sourceCollection = source.getCollection(dbDef as any);
	const targetCollection = target.getCollection(dbDef as any);

	let page = 0;
	let totalMigrated = 0;

	while (true) {
		const items = await sourceCollection.query.unManipulatedQuery({
			limit: {page, itemsCount: chunkSize}
		});

		if (items.length === 0)
			break;

		await targetCollection.set.multi(items);
		totalMigrated += items.length;
		StaticLogger.logInfo(`migrateCollection(${dbDef.dbKey}): migrated page ${page} (${items.length} items, ${totalMigrated} total)`);
		page++;
	}

	StaticLogger.logInfo(`migrateCollection(${dbDef.dbKey}): complete — ${totalMigrated} items migrated`);
}
