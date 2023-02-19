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

import {Exception} from '../core/exceptions';
import {compare} from '../utils/object-tools';


export type TestCase<Input, Result> = {
    expected?: Result;
    input: Input;
}

export type TestProcessor<T extends TestCase<any, any>> = (input: T['input']) => Promise<T['expected']>;

export type TestSuit<Model extends TestCase<any, any>> = {
    key: string;
    label: string;
    models: Model[];
    processor: TestProcessor<Model>;
}

type TestSuitReport = {
    label: string;
    success: number;
    failed: Exception[];
};
const testResults: { [k: string]: TestSuitReport } = {};

export async function runTestSuits(testSuits: TestSuit<any>[]) {
    for (const testSuit of testSuits) {
        await runTestSuit(testSuit);
    }
}

export async function runTestSuit<Model extends TestCase<any, any>>(testSuit: TestSuit<Model>) {
    const report: TestSuitReport = {
        label: testSuit.label,
        success: 0,
        failed: []
    };

    testResults[testSuit.key] = report;
    console.log(` Running: ${testSuit.label}`);

    for (const model of testSuit.models) {
        let result;
        try {
            result = undefined;
            result = await testSuit.processor(model.input);
            if (model.expected === undefined || compare(model.expected, result)) {
                report.success++;
                continue;
            }

            report.failed.push(
                new Exception(`Error in test #${testSuit.models.indexOf(model)} input: ${JSON.stringify(
                    model.input)}\n         -- Expected: ${model.expected}\n         --   Actual: ${typeof result === 'object' ? JSON.stringify(result) : result}`));

        } catch (e: any) {
            report.failed.push(
                new Exception(`Error in test #${testSuit.models.indexOf(model)} input: ${JSON.stringify(
                    model.input)}`, e));
        }
    }
}

export function assertNoTestErrors() {
    let totalErrors = 0;
    console.log();
    console.log('+-------------------------------+');
    console.log('|            RESULTS            |');
    console.log('+-------------------------------+');
    Object.keys(testResults).forEach((key, index) => {
        const result = testResults[key];
        console.log();
        console.log(` + ${result.label}`);
        console.log(`     Success: ${result.success}`);
        if (result.failed.length === 0)
            return;

        totalErrors += result.failed.length;
        console.log(`     Errors: ${result.failed.length}`);
        result.failed.forEach(error => {
            console.log(`       ${error.message}`);
            if (error.cause)
                console.log(`         ${error.cause.message}`);
        });
    });

    if (totalErrors > 0)
        process.exit(2);
}

export type TestModel_V2<Input, ExpectedResult> = {
    description: string
    result: ExpectedResult,
    input: Input,
}

export type TestSuit_V2<Input, ExpectedResult> = {
    processor: (input: Input) => ExpectedResult
    testcases: TestModel_V2<Input, ExpectedResult>[]
    label: string,
}

export type TestSuitAsync_V2<Input, ExpectedResult> = {
    processor: (input: Input) => Promise<ExpectedResult>
    testcases: TestModel_V2<Input, ExpectedResult>[]
    label: string,
}

