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

import {FilterKeys, ModuleBE_Firebase, FirestoreCollection} from '../../_main';
import {TS_Object} from '@nu-art/ts-common';


export class FirestoreCollection_Tester<DBType extends TS_Object> {
	readonly collectionName: string;
	readonly externalUniqueFilter?: FilterKeys<DBType>;

	constructor(collectionName: string, externalUniqueFilter?: FilterKeys<DBType>) {
		this.collectionName = collectionName;
		this.externalUniqueFilter = externalUniqueFilter;
	}

	processDirty(label: string, processor: (collection: FirestoreCollection<DBType>) => Promise<void>) {
		return this.process(label, processor, false);
	}

	processClean(label: string, processor: (collection: FirestoreCollection<DBType>) => Promise<void>) {
		return this.process(label, processor, true);
	}

	private async process(label: string, processor: (collection: FirestoreCollection<DBType>) => Promise<void>, clean: boolean) {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestore();
		const collection = firestore.getCollection<DBType>(this.collectionName, this.externalUniqueFilter);
		clean && await collection.deleteAll();
		return processor(collection);
	}
}