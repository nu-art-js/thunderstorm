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

import {FilterKeys, ModuleBE_Firebase} from '../../_main';
import {DB_Object} from '@nu-art/ts-common';


export class FirestoreCollectionV2_Tester<DBType extends DB_Object> {
	readonly collectionName: string;
	readonly externalUniqueFilter?: FilterKeys<DBType>;

	constructor(collectionName: string, externalUniqueFilter?: FilterKeys<DBType>) {
		this.collectionName = collectionName;
		this.externalUniqueFilter = externalUniqueFilter;
	}

	getCollection() {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV2();
		return firestore.getCollection<DBType>(this.collectionName, this.externalUniqueFilter);
	}
}