import {__custom} from '@nu-art/testelot';
import {PreDB} from '@nu-art/ts-common';
import {ModuleTest_DBModule_Test1} from './core/db-module';
import {DBType_Test1} from './core/types';


export function cleanup() {
	return __custom(async () => {
		await ModuleTest_DBModule_Test1.delete({where: {}});
	}).setLabel('Cleaning up examples collection.');
}

export const dbTestItem_test1_item1: PreDB<DBType_Test1> = {
	aNumber: 100,
	aString: 'hello world'
};