/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {deepClone} from "../../main/utils/object-tools";
import {__stringify} from "../../main/utils/tools";

const int = 1;
const str = 'a';
const empOb = {};
const ob = {a: 1};
const o1 = {a: 2, b: undefined};
const o2 = {c: 3, d: null};
const o3 = {a: {b: {c: {d: 1}}}};
const und = undefined;
const nul = null;
const zero = 0;
const nn = NaN;
const empStr = '';

const cl = deepClone(o2);
o2.c = 1;
console.log(o2, cl);

const nestedCl = deepClone(o3);
o3.a.b.c.d = 2;
console.log(__stringify(o3),__stringify(nestedCl));