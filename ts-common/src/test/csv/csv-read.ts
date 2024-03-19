import {expect} from 'chai';
import {TestSuite} from '../../main/testing/types';
import {keysToStringify, TestData, testData} from './test-data';
import * as fs from 'fs';
import {JSONCSVModule_Class} from '../../main/modules/JSONCSVModule';

const TestCase_replacerV2: TestSuite<string, TestData[]> ['testcases'] = [
	{
		description: 'CSV - Read 1',
		result: testData,
		input: 'test',
	},
];

// const itemTransformer = (item: TestData_Parsed): TestData => {
// 	const _item: TestData = {
// 		id: item.id,
// 		name: item.name,
// 		innerObject: JSON.parse(item.innerObject),
// 		innerArray: JSON.parse(item.innerArray),
// 		optional: item.optional,
// 		arrayOfObjects: JSON.parse(item.arrayOfObjects),
// 	};
// 	if (!_item.optional)
// 		delete _item.optional;
//
// 	return _item;
// };

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

