import {TestSuite} from "../../../main/testing/types";
import {debounce, timeout} from "../../../main";
import {expect, } from "chai";

type Input<T = any> = {
    timer?: number,
    repeats: number
}

const TestCases_Debounce: TestSuite<Input, any> ['testcases'] = [
    {
        description: 'debounce with custom timer runs 2 times',
        result: {value: 2},
        input: { timer: 1000, repeats: 5}
    },
    {
        description: 'debounce with default timer runs 2 times',
        result: {value: 2},
        input: {repeats: 5}
    }
]


export const TestSuite_Debounce: TestSuite<Input, any> = {
    label: 'debounce',
    testcases: TestCases_Debounce,
    processor: async (testCase) => {
        let counter = 0;
        const debounceFunction = debounce(()=> counter++, testCase.input.timer);

        for(let i = 0; i< testCase.input.repeats; i++){
            debounceFunction();
            await timeout(200);
        }

        await timeout(2000);
        expect(counter).to.eql(testCase.result.value)

    }
};