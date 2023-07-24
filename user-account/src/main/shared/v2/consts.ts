import {ImplementationMissingException} from '@nu-art/ts-common';
import {ModuleBE_v2_SessionDB, ModuleBE_v2_SessionDB_Class} from '../../backend';

export async function addAuditorId() {
	const sessionData = await ModuleBE_v2_SessionDB_Class.decodeSessionData(ModuleBE_v2_SessionDB);

	if (!sessionData)
		throw new ImplementationMissingException('Trying to preUpsert a DB_Discussion without session data!');

	return sessionData.userId;
}
