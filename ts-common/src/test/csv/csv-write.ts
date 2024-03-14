import {TestSuite} from '../../main/testing/types';
import {expect} from 'chai';
import {keysToStringify, testData, TestData, TestData_Parsed} from './test-data';
import {CSVModuleV3} from '../../main/modules/CSVModuleV3';
import * as fs from 'fs';
import {__stringify} from '../../main';
import {JSONCSVModule_Class} from '../../main/modules/JSONCSVModule';

type Input = {
	fileName: string;
	data: TestData[];
}

const TestCases_CSVWrite: TestSuite<Input, undefined> ['testcases'] = [
	{
		description: 'CSV - Write 1',
		result: undefined,
		input: {
			fileName: 'test',
			data: testData
		},
	},
];

const itemTransformer = (item: TestData): TestData_Parsed => {
	return {
		id: item.id,
		name: item.name,
		innerObject: __stringify(item.innerObject),
		innerArray: __stringify(item.innerArray),
		optional: item.optional,
		arrayOfObjects: __stringify(item.arrayOfObjects)
	};
};

const headers: (keyof TestData)[] = ['id', 'name', 'optional', 'innerObject', 'innerArray', 'arrayOfObjects'];

export const TestSuite_CSVWrite: TestSuite<Input, any> = {
	label: 'CSV - Write',
	testcases: TestCases_CSVWrite,
	processor: async (testCase) => {
		const test = async () => {
			const filePath = `${__dirname}/test-files/${testCase.input.fileName}.csv`;
			const writable = fs.createWriteStream(filePath, {});
			const JSONCSV = new JSONCSVModule_Class(keysToStringify);
			await JSONCSV.writeToStream<TestData, TestData_Parsed>(writable, testCase.input.data, {headers, transform: itemTransformer});
		};
		expect(await test()).to.not.throw;
	}
};