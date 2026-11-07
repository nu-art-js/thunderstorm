import {dataInChunksInput, getSpecificBucketInput, storage, WriteInChunks} from '../_core/consts.js';
import {firestore} from '../../_entity/_core/consts.js';
import {__stringify, tsValidateNumber, tsValidateString} from '@nu-art/ts-common';
import {Database} from '@nu-art/db-api-shared';
import {_EmptyQuery} from '@nu-art/firebase-shared';
import * as Stream from 'stream';
import {END_OF_STREAM} from '../../../main/index.js';

const collectionDef = (name: string): Database<any> => ({
	dbKey: name,
	entityName: name,
	versions: ['1.0.0'],
	modifiablePropsValidator: {collectionName: tsValidateString(), index: tsValidateNumber()},
	generatedPropsValidator: {},
	frontend: {group: 'test', name},
	backend: {name},
});

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
		const collectionArray = ['collection1', 'collection2', 'collection3', 'collection4', 'collection5']
			.map(name => firestore.getCollection(collectionDef(name)));
		await Promise.all(collectionArray.map((collection, index) => collection.create.item({
			collectionName: collection.dbDef.backend.name,
			index
		})));
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