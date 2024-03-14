import {expect} from 'chai';
import {TestSuite} from '../../main/testing/types';
import {keysToStringify, TestData, testData, TestData_Parsed} from './test-data';
import * as fs from 'fs';
import {CSVModuleV3} from '../../main/modules/CSVModuleV3';
import {JSONCSVModule_Class} from '../../main/modules/JSONCSVModule';


const TestCase_replacerV2: TestSuite<string, TestData[]> ['testcases'] = [
	{
		description: 'CSV - Read 1',
		result: testData,
		input: 'test',
	},
];

export const TestSuite_CSVRead: TestSuite<string, TestData[]> = {
	label: 'CSV - Read',
	testcases: TestCase_replacerV2,
	processor: async (testCase) => {
		const filePath = `${__dirname}/test-files/${testCase.input}.csv`;
		const readable = fs.createReadStream(filePath);
		const items: TestData[] = [];
		const JSONCSV = new JSONCSVModule_Class(keysToStringify);
		await JSONCSV.readFromStream(readable, (item: TestData) => {
			if (!item.optional)
				delete item.optional;
			items.push(item);
		});
		expect(items).to.eql(testCase.result);
	}
};

