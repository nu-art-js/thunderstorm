import {__custom, __scenario} from '@nu-art/testelot';
import {assert} from '@nu-art/ts-common';
import {cleanup, dbTestItem_test1_item1} from '../common';
import {ModuleTest_DBModule_Test1} from '../core/db-module';


export function upsertTests() {
	const scenario = __scenario('UpsertAll');
	scenario.add(cleanup());
	scenario.add(__custom(async () => {
		await ModuleTest_DBModule_Test1.upsert(dbTestItem_test1_item1);

		const valuesInDB = await ModuleTest_DBModule_Test1.query({where: {}});
		assert('Expecting 1 doc in the db', valuesInDB.length, 1);

		// const dbItem = valuesInDB[0];
		// assert('Expecting 1 doc in the db', (await ModuleTest_DBModule_Test1.query({where: {}})).length, 1);
	}).setLabel('Upserting 1 doc'));
	scenario.add(cleanup());
	return scenario;
}


