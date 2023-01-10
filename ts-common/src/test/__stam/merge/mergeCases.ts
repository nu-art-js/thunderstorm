import {TestModel_merge, TestSuitV3} from '../types';


const TestCase_ts_merge: TestModel_merge[] = [
    {
        description: 'merge two objects',
        answer: {a: 1,b: 2},
        input: {
            one: {a:1},
            two: {b:2}
        },
    }
];

export const TestSuit_ts_merge: TestSuitV3 = {
    label: 'Merge Test',
    testcases: TestCase_ts_merge
};