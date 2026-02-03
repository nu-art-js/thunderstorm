import {BucketWrapper, ModuleBE_Firebase} from '../../../main/index.js';
import {TestModel} from '@nu-art/testalot';
import {BadImplementationException} from '@nu-art/ts-common';
import '../../_entity/_core/consts.js';

export const storage = ModuleBE_Firebase.createAdminSession().getStorage();

export type FileContent = { value: any, filePath: string, stringify?: boolean };
export type WriteResult = FileContent | BadImplementationException;
export type ChunkInput = { rowHeader: string, value: string };
export type WriteInChunksProps = { data: ChunkInput[][], format?: 'csv' | string };

type TestSuiteLike<Input, Result> = {
	label: string;
	testcases: TestModel<Input, Result>[];
	processor?: (testCase: TestModel<Input, Result>) => Promise<void>;
};

export type WriteTests = TestSuiteLike<FileContent, WriteResult>;
export type BucketUtils = TestSuiteLike<string | undefined, undefined | (() => Promise<BucketWrapper>)>;
export type DeleteFiles = TestSuiteLike<string, number>;
export type FileDelete = TestSuiteLike<string, boolean>;
export type WriteInChunks = TestSuiteLike<WriteInChunksProps, boolean>;

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