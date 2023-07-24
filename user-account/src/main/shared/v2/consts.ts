import {ImplementationMissingException} from '@nu-art/ts-common';
import {ModuleBE_Account, ModuleBE_Account_Class} from '../../backend';

export async function addAuditorId() {
	const sessionData = await ModuleBE_Account_Class.decodeSessionData(ModuleBE_Account);

	if (!sessionData)
		throw new ImplementationMissingException('Trying to preUpsert a DB_Discussion without session data!');

	return sessionData.userId;
}
