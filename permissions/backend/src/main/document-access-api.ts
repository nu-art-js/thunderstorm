import type {UniqueId} from '@nu-art/ts-common';
import {ApiException, filterDuplicates, removeItemFromArray} from '@nu-art/ts-common';
import type {DB_Prototype} from '@nu-art/db-api-shared';
import type {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {DocumentAccessCapabilities, DocumentAccessFields} from '@nu-art/permissions-shared';
import {CapabilityToFieldKey} from '@nu-art/permissions-shared';
import {MemKey_UserAccessIds} from './consts.js';


function getAllAccessIds(): UniqueId[] {
	const dict = MemKey_UserAccessIds.get();
	return filterDuplicates(Object.values(dict).flat());
}

function assertOwnership(doc: Partial<DocumentAccessFields>) {
	const accessIds = getAllAccessIds();
	const isOwner = doc._owners?.some(id => accessIds.includes(id));
	if (!isOwner)
		throw new ApiException(403, 'Only document owners can manage access');
}

export async function shareDocument<Database extends DB_Prototype>(
	dbModule: ModuleBE_BaseDB<Database>,
	documentId: Database['uniqueParam'],
	principalId: UniqueId,
	capabilities: DocumentAccessCapabilities
): Promise<Database['dbType']> {
	const doc = await dbModule.query.unique(documentId);
	if (!doc)
		throw new ApiException(404, 'Document not found');

	assertOwnership(doc as any);

	const mutable = doc as any;
	for (const [cap, enabled] of Object.entries(capabilities) as [keyof DocumentAccessCapabilities, boolean | undefined][]) {
		if (!enabled)
			continue;

		const fieldKey = CapabilityToFieldKey[cap];
		if (!mutable[fieldKey])
			mutable[fieldKey] = [];

		mutable[fieldKey] = filterDuplicates([...mutable[fieldKey], principalId]);
	}

	return dbModule.set.item(mutable);
}

export async function unshareDocument<Database extends DB_Prototype>(
	dbModule: ModuleBE_BaseDB<Database>,
	documentId: Database['uniqueParam'],
	principalId: UniqueId,
	capabilities: DocumentAccessCapabilities
): Promise<Database['dbType']> {
	const doc = await dbModule.query.unique(documentId);
	if (!doc)
		throw new ApiException(404, 'Document not found');

	assertOwnership(doc as any);

	const mutable = doc as any;
	for (const [cap, enabled] of Object.entries(capabilities) as [keyof DocumentAccessCapabilities, boolean | undefined][]) {
		if (!enabled)
			continue;

		const fieldKey = CapabilityToFieldKey[cap];
		if (!mutable[fieldKey])
			continue;

		removeItemFromArray(mutable[fieldKey], principalId);
	}

	return dbModule.set.item(mutable);
}
