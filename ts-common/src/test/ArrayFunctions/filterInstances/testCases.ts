import {
    TestSuit_TS_ArrayFunctionFilterInstancesOfBoth,
} from "../../types";
import {filterInstances, removeItemFromArray} from "../../../main";

const TestCase_ts_FilterInstancesA:TestSuit_TS_ArrayFunctionFilterInstancesOfBoth<any>['testcases'] =[
    {
        description: 'Test 1',
        result: [1,2,3,0],
        input: {
            array: [1,2,3,0,null],
        }
    },
    {
        description: 'Test 2',
        result: [1,2,3,''],
        input: {
            array: [1,2,3,'',undefined],
        }
    },
    {
        description: 'Test 3',
        result: [1,2,3,'',{}],
        input: {
            array: [1,2,3,'',undefined,{}],
        }
    },
    {
        description: 'Test 4',
        result: [1,2,3,'',{},false],
        input: {
            array: [1,2,3,'',undefined,{},false],
        }
    },
];


export const TestSuit_ts_filterInstancesA: TestSuit_TS_ArrayFunctionFilterInstancesOfBoth= {
    label: 'filter array of all undefined and null',
    testcases: TestCase_ts_FilterInstancesA,
    processor: (input) => filterInstances(input.array)
};