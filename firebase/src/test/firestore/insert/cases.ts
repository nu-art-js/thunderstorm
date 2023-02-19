import {TestSuit_TS_FB_insert} from "../types";
import {addData} from "../../database/test/add-data";

export const TestCase_ts_FB_insert: TestSuit_TS_FB_insert ['testcases'] = [
    {
        description: 'Test 1',
        result: 1,
        input:
            {
                path: '/Desktop/red.txt',
                value: 1,
                label: 'test addData'
            }

    }
];

export const TestSuit_ts_FB_insert: TestSuit_TS_FB_insert = {
    label: 'inserts to firebase',
    testcases: TestCase_ts_FB_insert,
    processor: async (input) => await addData(input)
};