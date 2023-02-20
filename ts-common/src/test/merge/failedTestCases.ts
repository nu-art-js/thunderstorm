import {TestSuit_TS_Merge} from './types';
import {merge} from '../../main';


const TestCase_ts_mergeFail: TestSuit_TS_Merge['testcases'] = [
    {
        description: 'merge array with obj expected fail',
        result: "Error",
        input: {
            one: [7,8],
            two: {}
        },
    },
    {
        description: 'merge obj with array expected fail',
        result: "Error",
        input: {
            one: {a:2},
            two: [7,8]
        },
    },
    {
        description: 'merge string with array expected fail',
        result: "Error",
        input: {
            one: 'a',
            two: [7,8]
        },
    },
    {
        description: 'merge string with array expected fail',//for some reason return undefined and not error
        result: "Error",
        input: {
            one: '',
            two: [7,8]
        },
    },
    {
        description: 'merge array with object',
        result: "Error",
        input: {
            one: [7,8],
            two: {a:[7,8]}
        },
    },
    {
        description: 'merge int with object',
        result: "Error",
        input: {
            one: 5,
            two: {a:5}
        },
    },
    {
        description: 'merge obj with int',
        result: "Error",
        input: {
            one: {a:1},
            two: 1
        },
    },
    {
        description: 'merge string with int',
        result: "Error",
        input: {
            one: "one",
            two: 1
        },
    },
    {
        description: 'merge int with string',
        result: "Error",
        input: {
            one: 1,
            two: "one"
        },
    },
    {
        description: 'merge int with string',
        result: "Error",
        input: {
            one: 0,
            two: "one"
        },
    },
    {
        description: 'merge two different non overlapping objects',
        result: "Error",
        input: {
            one: false,
            two: {b: ''}
        },
    },
];

export const TestSuit_ts_mergeFail: TestSuit_TS_Merge = {
    label: 'Merge Test fail',
    testcases: TestCase_ts_mergeFail,
    processor: input => merge(input.one, input.two)
};