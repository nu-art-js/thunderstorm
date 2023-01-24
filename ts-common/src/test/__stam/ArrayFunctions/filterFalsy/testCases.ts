import {
    TestSuit_TS_ArrayFunctionFilterInstancesOfBoth,
} from "../../types";
import {filterFalsy, filterInstances} from "../../../../main";

const TestCase_ts_FilterInstancesB:TestSuit_TS_ArrayFunctionFilterInstancesOfBoth<any>['testcases'] =[
    {
        description: 'Test 1',
        result: [1,2,3],
        input: {
            array: [1,2,3,0,null],
        }
    },
    {
        description: 'Test 2',
        result: [1,2,3],
        input: {
            array: [1,2,3,'',undefined],
        }
    },
    {
        description: 'Test 3',
        result: [1,2,3,{}],
        input: {
            array: [1,2,3,'',undefined,{}],
        }
    },
    {
        description: 'Test 4',
        result: [1,2,3,{}],
        input: {
            array: [1,2,3,'',undefined,{},false],
        }
    },
];


export const TestSuit_ts_filterInstancesB: TestSuit_TS_ArrayFunctionFilterInstancesOfBoth= {
    label: 'filter array of all falsy items',
    testcases: TestCase_ts_FilterInstancesB,
    processor: (input) => filterFalsy(input.array)
};