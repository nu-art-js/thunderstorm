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

import {FirestoreCollection_Tester} from "./collection-wrapper";
import {
	FB_ArrayType,
	FB_Type
} from "./types";


export const testString1 = "string-1";
export const testString2 = "string-2";
export const testString3 = "string-3";
export const testString4 = "string-4";
export const testString5 = "string-5";
export const testString6 = "string-6";
export const testString7 = "string-7";
export const testString8 = "string-8";
export const testString9 = "string-9";

export const testNumber1 = 11;
export const testNumber2 = 22;
export const testNumber3 = 33;
export const testNumber4 = 44;
export const testNumber5 = 55;
export const testNumber6 = 66;
export const testNumber7 = 77;
export const testNumber8 = 88;
export const testNumber9 = 99;

export const testCollection = new FirestoreCollection_Tester<FB_Type>("test-collection");
export const testCollectionWithUnique = new FirestoreCollection_Tester<FB_Type>("test-collection-unique", ["numeric"]);
export const simpleTypeCollection = new FirestoreCollection_Tester<{label: string, deleteId: string}>("test-collection-label");

export const testItem1: FB_ArrayType = {key: testString1, value: testNumber1};
export const testItem2: FB_ArrayType = {key: testString2, value: testNumber2};
export const testItem3: FB_ArrayType = {key: testString3, value: testNumber3};
export const testItem4: FB_ArrayType = {key: testString4, value: testNumber4};
export const testItem5: FB_ArrayType = {key: testString5, value: testNumber5};
export const testItem6: FB_ArrayType = {key: testString6, value: testNumber6};
export const testItem7: FB_ArrayType = {key: testString7, value: testNumber7};
export const testItem8: FB_ArrayType = {key: testString8, value: testNumber8};
export const testItem9: FB_ArrayType = {key: testString9, value: testNumber9};


export const testInstance1: FB_Type = {
	stringValue: testString1,
	booleanValue: false,
	numeric: testNumber1,
	stringArray: [testString1, testString5],
	objectArray: [testItem1, testItem2]
};

export const testInstance2: FB_Type = {
	stringValue: testString2,
	booleanValue: false,
	numeric: testNumber2,
	stringArray: [testString1, testString2, testString3],
	objectArray: [testItem1, testItem2, testItem3]
};

export const testInstance3: FB_Type = {
	stringValue: testString3,
	booleanValue: false,
	numeric: testNumber3,
	stringArray: [testString2, testString3, testString4, testString5],
	objectArray: [testItem2, testItem3, testItem4, testItem5]
};

export const testInstance4: FB_Type = {
	stringValue: testString4,
	booleanValue: true,
	numeric: testNumber4,
	stringArray: [testString3, testString4, testString5],
	objectArray: [testItem3, testItem4, testItem5]
};

export const testInstance5: FB_Type = {
	stringValue: testString5,
	booleanValue: false,
	numeric: testNumber5,
	stringArray: [testString1, testString2, testString3, testString4, testString5],
	objectArray: [testItem1, testItem2, testItem3, testItem4, testItem5]
};
