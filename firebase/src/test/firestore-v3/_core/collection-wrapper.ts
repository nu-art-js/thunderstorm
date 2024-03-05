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
import {DBDef_V3, DBProto} from '@nu-art/ts-common';


export class FirestoreCollectionV3_Tester<Proto extends DBProto<any>> {
	readonly dbDef: DBDef_V3<Proto>;
	readonly externalUniqueFilter?: FilterKeys<Proto['dbType']>;

	constructor(dbDef: DBDef_V3<Proto>, externalUniqueFilter?: FilterKeys<Proto['dbType']>) {
		this.dbDef = dbDef;
		this.externalUniqueFilter = externalUniqueFilter;
	}

	getCollection() {
		const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV3();
		return firestore.getCollection<Proto>(this.dbDef);
	}
}