import {BucketWrapper, ModuleBE_Firebase} from '../../../main/backend';
import {TestSuite} from '@thunder-storm/common/testing/types';
import {BadImplementationException} from '@thunder-storm/common';
import '../../firestore-v3/_core/consts';

export const storage = ModuleBE_Firebase.createAdminSession().getStorage();


export type FileContent = { value: any, filePath: string, stringify?: boolean };
export type WriteResult = FileContent | BadImplementationException;
export type ChunkInput = { rowHeader: string, value: string };
export type WriteInChunksProps = { data: ChunkInput[][], format?: 'csv' | string };


export type WriteTests = TestSuite<FileContent, WriteResult>;
export type BucketUtils = TestSuite<string | undefined, undefined | (() => Promise<BucketWrapper>)>;
export type DeleteFiles = TestSuite<string, number>;
export type FileDelete = TestSuite<string, boolean>;
export type WriteInChunks = TestSuite<WriteInChunksProps, boolean>;

const testObject: object = {test: 'object', more: {someMore: 'pah'}};

export const writeTestInput1: FileContent = {value: 'test string', filePath: 'testFolder/string-file.txt'};
export const writeTestInput2: FileContent = {value: 1234576895, filePath: 'testFolder/number-file.txt'};
export const writeTestInput3: FileContent = {value: testObject, filePath: 'testFolder/object-file.txt', stringify: true};
export const writeTestInput4: FileContent = {value: Buffer.from('string, is, like, this', 'utf8'), filePath: 'testFolder/buffer-file.txt'};
export const writeTestInput5: FileContent = {value: undefined, filePath: 'testFolder/undefined-file.txt'};

export const getMainBucketInput = undefined;
export const getSpecificBucketInput = 'gs://testBucket.appspot.com';
export const invalidBucketNameInput = 'testBucket';

export const deleteFileInput = 'testFolder/string-file.txt';
export const notExistingFileName = 'not a real file';

export const dataInChunksInput: ChunkInput[][] = [[{rowHeader: 'test1', value: 'value 1'}, {rowHeader: 'test1', value: 'value 2'}, {
	rowHeader: 'test1',
	value: 'value 3'
}, {rowHeader: 'test1', value: 'value 4'}], [{rowHeader: 'test1', value: 'value 5'}], [{rowHeader: 'test2', value: 'value 1'}, {
	rowHeader: 'test2',
	value: 'value 2'
}, {rowHeader: 'test2', value: 'value 3'}, {rowHeader: 'test2', value: 'value 4'}], [
	{rowHeader: 'test3', value: 'value 1'}, {rowHeader: 'test3', value: 'value 2'}, {rowHeader: 'test3', value: 'value 3'}, {rowHeader: 'test3', value: 'value 4'}
]];

export const getMainBucketResult = () => storage.getMainBucket();
export const getSpecificBucketResult = () => storage.getOrCreateBucket(getSpecificBucketInput);

export const failedWriteResult = new BadImplementationException('');