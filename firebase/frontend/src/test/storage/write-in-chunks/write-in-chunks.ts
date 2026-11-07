import {dataInChunksInput, getSpecificBucketInput, storage, WriteInChunks} from '../_core/consts.js';
import {__stringify} from '@nu-art/ts-common';
import * as Stream from 'stream';
import {END_OF_STREAM} from '../../../main/backend/index.js';

export const writeInChunksTestCases: WriteInChunks['testcases'] = [
	{
		description: 'write to file via stream that being updates in chunks',
		result: true,
		input: {
			data: dataInChunksInput
		}
	}
];

export const TestSuite_WriteInChunks: WriteInChunks = {
	label: 'Firebase Storage - Write to file in chunks',
	testcases: writeInChunksTestCases,
	processor: async (testCase) => {
		const rows = [0, 1, 2, 3, 4].map(index => [{collectionName: `collection${index + 1}`, index}]);
		const bucket = await storage.getOrCreateBucket(getSpecificBucketInput);
		const file = await bucket.getFile('testFolder/write-in-chunks.csv');
		let counter = 0;

		const feeder = async (writable: Stream.Writable) => {
			writable.write(__stringify(rows[counter]) + '\n');
			counter++;

			if (rows[counter])
				return;

			return END_OF_STREAM;
		};

		await file.writeToStream(feeder);
	}
};

//
// const bucket = await storage.getOrCreateBucket(getSpecificBucketInput);
// const file = await bucket.getFile('testFolder/write-in-chunks.csv');
// const writeable = file.file.createWriteStream();
//
// writeable.on('close', async () => {
// 	const fileContent = (await file.read()).toString('utf8');
// 	expect(fileContent.length).not.eql(0);
// });
// writeable.on('error', (e) => console.log(e));
//
// testCase.input.data.forEach(dataChunk => {
// 	writeable.write(JSON.stringify(dataChunk));
// });
//
// writeable.end();