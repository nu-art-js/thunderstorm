/*
 * ts-common is the basic building blocks of our typescript projects
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

import {TestSuit_V2, TestSuitAsync_V2} from "../../main";

export type TestSuit_TS_ArrayFunctionRemoveByIndex<T extends any = any> = TestSuit_V2<{ array: T[], index: number }, T[]>

export type TestSuit_TS_ArrayFunctionRemoveItem<T extends any = any> = TestSuit_V2<{ array: T[], item: T }, T[]>

export type TestSuit_TS_ArrayFunctionRemoveFromArray<T extends any = any> = TestSuit_V2<{ array: T[], item: (_item: T) => boolean }, T[]>

export type TestSuit_TS_ArrayFunctionFilterAsync<T extends any = any> = TestSuitAsync_V2<{ array: T[], filter: (parameter: T) => Promise<boolean> }, T[]>

export type TestSuit_TS_ArrayFunctionFindDuplicates<T extends any = any> = TestSuit_V2<{ array1: T[], array2: T[] }, T[]>

export type TestSuit_TS_ArrayFunctionFilterDuplicates<T extends any = any> = TestSuit_V2<{ source: T[], mapper?: (item: T) => string | number }, T[]>

export type TestSuit_TS_ArrayFunctionFilterInstancesOfBoth<T extends any = any> = TestSuit_V2<{ array?: (T | undefined | null | void)[] }, T[]>

export type TestSuit_TS_ArrayFunctionReduceToMap<Input, Output = Input> = TestSuit_V2<{ array: Input[] | Readonly<Input[]>, keyResolver: (item: Input, index: number, map: { [k: string]: Output }) => string | number, mapper: (item: Input, index: number, map: { [k: string]: Output }) => Output, map: { [k: string]: Output } }, { [k: string]: Output }>

export type TestSuit_TS_ArrayFunctionArrayToMap<T extends any = any> = TestSuit_V2<{ array: T[] | Readonly<T[]>, getKey: (item: T, index: number, map: { [k: string]: T }) => string | number, map: { [k: string]: T } }, T>

export type TestSuit_TS_ArrayFunctionSortArray<T extends any = any> = TestSuit_V2<{ array: T[], map: keyof T | (keyof T)[] | ((item: T) => any), invert: boolean }, T[]> //correct? map and invert

export type TestSuit_TS_ArrayFunctionBatchAction<T extends any = any, R extends any = any> = TestSuit_V2<{ arr: T[], chunk: number, action: (elements: T[]) => Promise<R | R[]> }, Promise<R[]>> //Promise<R[]>

export type TestSuit_TS_ArrayFunctionFlatArray<T extends any = any> = TestSuit_V2<{ arr: T[][] | T[], result: T[] }, T[]>

export type TestSuit_TS_ArrayFunctionGroupArrayBy<T extends object> = TestSuit_V2<{ arr: T[], mapper: (item: T) => string | number }, T[]> //correct?



