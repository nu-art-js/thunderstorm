import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_SamlProvider, DBDef_SamlProvider} from '@nu-art/saml-shared';
import {BadImplementationException} from '@nu-art/ts-common';
import {validateMetadataHost} from '../../metadata-parser.js';

export class ModuleBE_SamlProviderDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_SamlProvider> {

	constructor() {
		super(DBDef_SamlProvider);
	}

	protected async preWriteProcessing(dbInstance: DatabaseDef_SamlProvider['uiType'], originalDbInstance: DatabaseDef_SamlProvider['dbType']): Promise<void> {
		await super.preWriteProcessing(dbInstance, originalDbInstance);

		dbInstance.domain = dbInstance.domain.toLowerCase().trim();

		if (!dbInstance.domain.includes('.'))
			throw new BadImplementationException(`Invalid domain: '${dbInstance.domain}'`);

		if (originalDbInstance?._id && originalDbInstance.domain && originalDbInstance.domain !== dbInstance.domain)
			throw new BadImplementationException(`Cannot change domain on an existing SAML provider (was '${originalDbInstance.domain}')`);

		validateMetadataHost(dbInstance.metadataUrl);
	}
}

export const ModuleBE_SamlProviderDB = new ModuleBE_SamlProviderDB_Class();
