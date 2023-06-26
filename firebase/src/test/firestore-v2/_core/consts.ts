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

import {DB_Type, DB_Type_Complex, FB_ArrayType, TestInputValue} from './types';
import {
	DBDef,
	deepClone,
	generateHex,
	PreDB,
	tsValidateArray,
	tsValidateMustExist,
	tsValidateString,
	UniqueId
} from '@nu-art/ts-common';
import {FIREBASE_DEFAULT_PROJECT_ID, ModuleBE_Firebase} from '../../../main/backend';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';
import {FirestoreCollectionV2} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import {TestModel, TestSuite} from '@nu-art/ts-common/testing/types';


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

export const testString1 = 'string-1';
export const testString2 = 'string-2';
export const testString3 = 'string-3';
export const testString4 = 'string-4';
export const testString5 = 'string-5';
export const testString6 = 'string-6';
export const testString7 = 'string-7';
export const testString8 = 'string-8';
export const testString9 = 'string-9';

export const testNumber1 = 11;
export const testNumber2 = 22;
export const testNumber3 = 33;
export const testNumber4 = 44;
export const testNumber5 = 55;
export const testNumber6 = 66;
export const testNumber7 = 77;
export const testNumber8 = 88;
export const testNumber9 = 99;

export const testItem1: FB_ArrayType = {key: testString1, value: testNumber1};
export const testItem2: FB_ArrayType = {key: testString2, value: testNumber2};
export const testItem3: FB_ArrayType = {key: testString3, value: testNumber3};
export const testItem4: FB_ArrayType = {key: testString4, value: testNumber4};
export const testItem5: FB_ArrayType = {key: testString5, value: testNumber5};
export const testItem6: FB_ArrayType = {key: testString6, value: testNumber6};
export const testItem7: FB_ArrayType = {key: testString7, value: testNumber7};
export const testItem8: FB_ArrayType = {key: testString8, value: testNumber8};
export const testItem9: FB_ArrayType = {key: testString9, value: testNumber9};

export type testInstance = {
	_uniqueId: UniqueId,
	stringValue: String,
	booleanValue: false,
	numeric: number,
	stringArray: [],
	objectArray: [],
	nestedObject: {}
};

export const testInstance1: PreDB<DB_Type> = Object.freeze({
	_uniqueId: '24ad9549503c17e832bf4bbbdb33768a',
	stringValue: testString1,
	booleanValue: false,
	numeric: testNumber1,
	stringArray: [testString1, testString5],
	objectArray: [testItem1, testItem2],
	nestedObject: {one: testItem1, two: testItem2}
});

export const testInstance2: PreDB<DB_Type> = Object.freeze({
	_uniqueId: 'fc191221b26d275a21e5070487e270b3',
	stringValue: testString2,
	booleanValue: false,
	numeric: testNumber2,
	stringArray: [testString1, testString2, testString3],
	objectArray: [testItem1, testItem2, testItem3],
	nestedObject: {one: testItem2, two: testItem3}
});

export const testInstance3: PreDB<DB_Type> = Object.freeze({
	_uniqueId: '7cec29ff80ec43aa5ab37f1240f5c446',
	stringValue: testString3,
	booleanValue: false,
	numeric: testNumber3,
	stringArray: [testString2, testString3, testString4, testString5],
	objectArray: [testItem2, testItem3, testItem4, testItem5],
	nestedObject: {one: testItem4, two: testItem5}
});

export const testInstance4: PreDB<DB_Type> = Object.freeze({
	_uniqueId: '06dcd6d4df2d8ab9f02bd189c64f2908',
	stringValue: testString4,
	booleanValue: true,
	numeric: testNumber4,
	stringArray: [testString3, testString4, testString5],
	objectArray: [testItem3, testItem4, testItem5],
	nestedObject: {one: testItem3, two: testItem4}
});

export const testInstance5: PreDB<DB_Type> = Object.freeze({
	_uniqueId: 'e2f9cadb1bc881c92faddbde794f721b',
	stringValue: testString5,
	booleanValue: false,
	numeric: testNumber5,
	stringArray: [testString1, testString2, testString3, testString4, testString5],
	objectArray: [testItem1, testItem2, testItem3, testItem4, testItem5],
	nestedObject: {one: testItem2, two: testItem4}
});


export type CollectionTestInput = {
	outerCollection: PreDB<DB_Type_Complex>[];
	innerCollection: PreDB<DB_Type_Complex>[];
	outerId?: string,
	innerId?: string
	check: (collectionOuter: FirestoreCollectionV2<DB_Type_Complex>, collectionInner: FirestoreCollectionV2<DB_Type_Complex>) => Promise<void>
}
export type CollectionTest = TestSuite<CollectionTestInput, TestInputValue>;

export const id_outer1 = 'id_outer1';
export const id_inner1 = 'id_inner1';
export const id_inner2 = 'id_inner2';
export const id_inner3 = 'id_inner3';
export const id_inner4 = 'id_inner4';
export const outerQueryCollection = [
	{_id: id_outer1, name: 'outer1', refs: [id_inner1, id_inner2, id_inner3]}
];
export const innerQueryCollection = [
	{_id: id_inner1, name: 'inner1', refs: [], parentId: id_outer1},
	{_id: id_inner2, name: 'inner2', refs: []},
	{_id: id_inner3, name: 'inner3', refs: [], parentId: id_outer1},
	{_id: id_inner4, name: 'inner4', refs: []},
	{_id: 'id_inner5', name: 'inner5', refs: [], parentId: id_outer1},
	{_id: 'id_inner6', name: 'inner6', refs: []},
	{_id: 'id_inner7', name: 'inner7', refs: [], parentId: id_outer1},
	{_id: 'id_inner8', name: 'inner8', refs: []},
	{_id: 'id_inner9', name: 'inner9', refs: [], parentId: id_outer1},
];

const dbDefOuter: DBDef<DB_Type_Complex> = {
	dbName: 'firestore-tests-outer',
	entityName: 'OuterItem',
	validator: {
		refs: tsValidateArray(tsValidateString()),
		name: tsValidateString(),
		parentId: tsValidateString(-1, false),
	}
};

const dbDefInner: DBDef<DB_Type_Complex> = {
	dbName: 'firestore-tests-inner',
	entityName: 'InnerItem',
	validator: tsValidateMustExist
};

export async function prepareCollectionTest(testCase: TestModel<CollectionTestInput, TestInputValue>) {
	const outerCollection = firestore.getCollection<DB_Type_Complex>(dbDefOuter);
	const innerCollection = firestore.getCollection<DB_Type_Complex>(dbDefInner);
	await Promise.all([outerCollection, innerCollection].map(async (collection) => await collection.deleteCollection()));
	const outerToInsert = deepClone(testCase.input.outerCollection);
	const innerToInsert = deepClone(testCase.input.innerCollection);
	await outerCollection.set.all(outerToInsert);
	await innerCollection.set.all(innerToInsert);
	await testCase.input.check(outerCollection, innerCollection);
}