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

import {DB_Type, TestInputValue} from './types';
import {DB_Object, DB_Object_validator, deepClone, generateHex, keepDBObjectKeys, PreDB, tsValidateResult} from '@nu-art/ts-common';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';
import {expect} from 'chai';
import {FIREBASE_DEFAULT_PROJECT_ID, ModuleBE_Firebase} from '@nu-art/firebase/backend';


const config = {
	project_id: generateHex(4),
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
	isEmulator: true
};
ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});
export const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV2();

export const getSingleItem = (item: TestInputValue): PreDB<DB_Type> => {
	return Array.isArray(item) ? item[0] : item;
};

export function validateDBObject(dbItem: DB_Object & any) {
	const dbObject = keepDBObjectKeys(deepClone(dbItem));
	const error = tsValidateResult(dbObject, DB_Object_validator);
	expect(error).to.eql(undefined);
}
