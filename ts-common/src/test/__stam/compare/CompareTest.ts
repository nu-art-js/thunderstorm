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

import {expect} from "chai";
import {compare} from "../../../main";


 function compareTest() {
    describe('compare test', () => {
        for (const testCase of arrayTests) {
            it(testCase.description, () => {
                // @ts-ignore
                expect(compare(testCase.one,testCase.two)).to.eq(testCase.answer)
            });
        }
    });
}
export{
     compareTest
};

const arrayTests=[
    {
        description: "compares same int",
        one: 1,
        two: 1,
        answer: true
    },
    {
        description: "compares same string number",
        one: "1",
        two: "1",
        answer: true
    },
    {
        description: "compares different integers",
        one: 1,
        two: 2,
        answer: false
    },
    {
        description: "compares different integers",
        one: 2,
        two: 1,
        answer: false
    },
    {
        description: "compares same val with different type",
        one: "1",
        two: 1,
        answer: false
    },
    {
        description: "compares same val with different type",
        one: 1,
        two: "1",
        answer: false
    },
    {
        description: "compares same string word",
        one: "test",
        two: "test",
        answer: true
    },
    {
        description: "compares different string",
        one: "test",
        two: "tesT",
        answer: false
    },
    {
        description: "compares different string",
        one: "test",
        two: "test1",
        answer: false
    },
];

