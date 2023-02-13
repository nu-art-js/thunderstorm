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


import {merge} from "../../main/utils/merge-tools";
import {StaticLogger} from "../../main";

const int = 1;
const str = 'a';
const empOb = {};
const ob = {a: 1};
const o1 = {a: 2, b: undefined, c: 5};
const o2 = {b: 1, c: 3, d: null};
const o3 = {c: 3, d: null};
const und = undefined;
const nul = null;
const zero = 0;
const nn = NaN;
const empStr = '';

// StaticLogger.logInfo(merge(int,str));
StaticLogger.logInfo(merge(o1, o2));
StaticLogger.logInfo(merge(o2, o1));
StaticLogger.logInfo(merge(o3, o1));
StaticLogger.logInfo(merge(nul, o1));


const arr = [1, 2];
const arr2 = arr.map(a => a);
arr2.push(3);
StaticLogger.logInfo(JSON.stringify(arr), arr2);