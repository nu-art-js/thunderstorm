import {ModuleBE_Permissions} from '@nu-art/permissions-backend';
import type {DocumentAccessFields} from '@nu-art/permissions-shared';
import {SamlReadGroupId, SamlWriteGroupId, SamlDeleteGroupId} from '@nu-art/saml-shared';
import {ModuleBE_SamlProviderDB} from './_entity/saml-provider/ModuleBE_SamlProviderDB.js';

const SamlScope = 'saml';

const samlProviderAccessFields: DocumentAccessFields = {
	__access: {
		readers: [SamlReadGroupId],
		writers: [SamlWriteGroupId],
		deleters: [SamlDeleteGroupId],
		owners: [],
	}
};

export function wireSamlDocumentAccess() {
	ModuleBE_Permissions.setAccessContextResolver(
		ModuleBE_SamlProviderDB,
		() => samlProviderAccessFields,
		[SamlScope]
	);
}
