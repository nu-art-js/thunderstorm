import {BucketWrapper, ModuleBE_Firebase} from '../../../main/backend';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {BadImplementationException} from '@nu-art/ts-common';
import '../../firestore-v2/_core/consts';

export const storage = ModuleBE_Firebase.createAdminSession().getStorage();


export type FileContent = { value: any, filePath: string, stringify?: boolean };
export type WriteResult = FileContent | BadImplementationException


export type WriteTests = TestSuite<FileContent, WriteResult>;
export type BucketUtils = TestSuite<string | undefined, undefined | (() => Promise<BucketWrapper>)>;

const testObject: object = {test: 'object', more: {someMore: 'pah'}};

export const writeTestInput1: FileContent = {value: 'test string', filePath: 'testFolder/string-file.txt'};
export const writeTestInput2: FileContent = {value: 1234576895, filePath: 'testFolder/number-file.txt'};
export const writeTestInput3: FileContent = {value: testObject, filePath: 'testFolder/object-file.txt', stringify: true};
export const writeTestInput4: FileContent = {value: Buffer.from('string, is, like, this', 'utf8'), filePath: 'testFolder/buffer-file.txt'};
export const writeTestInput5: FileContent = {value: undefined, filePath: 'testFolder/undefined-file.txt'};

export const getMainBucketInput = undefined;
export const getSpecificBucketInput = 'gs://testBucket.appspot.com';
export const invalidBucketNameInput = 'testBucket';

export const getMainBucketResult = () => storage.getMainBucket();
export const getSpecificBucketResult = () => storage.getOrCreateBucket(getSpecificBucketInput);

export const failedWriteResult = new BadImplementationException('');