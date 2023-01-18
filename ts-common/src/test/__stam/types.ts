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

export type TestSuit_TS_ArrayFunctionRemoveByIndex<T extends any=any>= TestSuit_V2<{array:T[],index:number},T[]>

export type TestSuit_TS_ArrayFunctionRemoveItem<T extends any=any>= TestSuit_V2<{array:T[],item:T},T[]>

export type TestSuit_TS_ArrayFunctionRemoveFromArray<T extends any=any>= TestSuit_V2<{array:T[],item:(_item: T) => boolean},T[]>

export type TestSuit_TS_ArrayFunctionFilterAsync<T extends any=any>= TestSuitAsync_V2<{array:T[],filter:(parameter: T) => Promise<boolean>},T[]>

export type TestSuit_TS_ArrayFunctionFindDuplicates<T extends any=any>= TestSuit_V2<{array1:T[],array2: T[]},T[]>

export type TestSuit_TS_ArrayFunctionFilterDuplicates<T extends any=any>= TestSuit_V2<{source:T[],mapper: undefined},T[]>

export type TestSuit_TS_ArrayFunctionFilterInstances<T extends any=any>= TestSuit_V2<{array?: (T|undefined|null|void)[] },T[]>



