import type {UniqueId} from '@nu-art/ts-common';
import {filterDuplicates, removeItemFromArray} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/api-types';
import type {DB_Prototype} from '@nu-art/db-api-shared';
import type {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {DocumentAccessCapabilities, DocumentAccessInner} from '@nu-art/permissions-shared';
import {CapabilityToAccessKey} from '@nu-art/permissions-shared';
import {MemKey_UserAccessIds} from './consts.js';


function getAllAccessIds(): UniqueId[] {
	const dict = MemKey_UserAccessIds.get();
	return filterDuplicates(Object.values(dict).flat());
}

function assertOwnership(access: Partial<DocumentAccessInner> | undefined) {
	const accessIds = getAllAccessIds();
	const isOwner = access?.owners?.some(id => accessIds.includes(id));
	if (!isOwner)
		throw HttpCodes._4XX.FORBIDDEN('Only document owners can manage access');
}

/**
 * @deprecated Use {@link ModuleBE_Permissions.share} instead — it bypasses the pre-write interceptor
 * via a privileged raw collection path and supports SA context. This function writes through
 * `dbModule.set.item` which triggers the interceptor that strips `__access`.
 */
export async function shareDocument<Database extends DB_Prototype>(
	dbModule: ModuleBE_BaseDB<Database>,
	documentId: Database['uniqueParam'],
	principalId: UniqueId,
	capabilities: DocumentAccessCapabilities
): Promise<Database['dbType']> {
	const doc = await dbModule.query.unique(documentId);
	if (!doc)
		throw HttpCodes._4XX.NOT_FOUND('Document not found');

	const mutable = doc as any;
	assertOwnership(mutable.__access);

	if (!mutable.__access)
		mutable.__access = {};

	for (const [cap, enabled] of Object.entries(capabilities) as [keyof DocumentAccessCapabilities, boolean | undefined][]) {
		if (!enabled)
			continue;

		const accessKey = CapabilityToAccessKey[cap];
		if (!mutable.__access[accessKey])
			mutable.__access[accessKey] = [];

		mutable.__access[accessKey] = filterDuplicates([...mutable.__access[accessKey], principalId]);
	}

	return dbModule.set.item(mutable);
}

/**
 * @deprecated The counterpart to the deprecated `shareDocument`. Both write through `dbModule.set.item`
 * which triggers the pre-write interceptor that strips `__access`, making the update a no-op.
 */
export async function unshareDocument<Database extends DB_Prototype>(
	dbModule: ModuleBE_BaseDB<Database>,
	documentId: Database['uniqueParam'],
	principalId: UniqueId,
	capabilities: DocumentAccessCapabilities
): Promise<Database['dbType']> {
	const doc = await dbModule.query.unique(documentId);
	if (!doc)
		throw HttpCodes._4XX.NOT_FOUND('Document not found');

	const mutable = doc as any;
	assertOwnership(mutable.__access);

	if (!mutable.__access)
		return dbModule.set.item(mutable);

	for (const [cap, enabled] of Object.entries(capabilities) as [keyof DocumentAccessCapabilities, boolean | undefined][]) {
		if (!enabled)
			continue;

		const accessKey = CapabilityToAccessKey[cap];
		if (!mutable.__access[accessKey])
			continue;

		removeItemFromArray(mutable.__access[accessKey], principalId);
	}

	return dbModule.set.item(mutable);
}
