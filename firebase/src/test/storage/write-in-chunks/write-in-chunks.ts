import {dataInChunksInput, getSpecificBucketInput, storage, WriteInChunks} from '../_core/consts';
import {firestore} from '../../firestore-v2/_core/consts';
import {__stringify, DB_Object} from '@nu-art/ts-common';
import {_EmptyQuery} from '../../../main/backend/firestore-v2/FirestoreCollectionV2';
import * as Stream from 'stream';
import {END_OF_STREAM} from '../../../main/backend';

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
		const collection1 = firestore.getCollection<DB_Object & { collectionName: string, index: number }>('collection1');
		const collection2 = firestore.getCollection<DB_Object & { collectionName: string, index: number }>('collection2');
		const collection3 = firestore.getCollection<DB_Object & { collectionName: string, index: number }>('collection3');
		const collection4 = firestore.getCollection<DB_Object & { collectionName: string, index: number }>('collection4');
		const collection5 = firestore.getCollection<DB_Object & { collectionName: string, index: number }>('collection5');
		const collectionArray = [collection1, collection2, collection3, collection4, collection5];
		await Promise.all(collectionArray.map((collection, index) => collection.create.item({collectionName: collection.name, index})));
		const bucket = await storage.getOrCreateBucket(getSpecificBucketInput);
		const file = await bucket.getFile('testFolder/write-in-chunks.csv');
		let counter = 0;

		const feeder = async (writable: Stream.Writable) => {
			const data = await collectionArray[counter].query.custom(_EmptyQuery);
			writable.write(__stringify(data) + '\n');
			counter++;

			if (collectionArray[counter])
				return;

			return END_OF_STREAM;
		};

		 await file.writeToStream(feeder);

		console.log((await file.read()).toString());
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