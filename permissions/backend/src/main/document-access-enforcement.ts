import type {DB_Prototype} from '@nu-art/db-api-shared';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {ModuleBE_BaseDB, PreWriteInterceptor, QueryInterceptor, PreDeleteInterceptor} from '@nu-art/db-api-backend';
import type {DatabaseDef_AccessGroup, DocumentAccessFields, DocumentAccessInner, ScopedAccessIds} from '@nu-art/permissions-shared';
import {AccessScope_Self, AllDocumentAccessKeys} from '@nu-art/permissions-shared';
import {ApiException, filterDuplicates, tsValidateResult, tsValidator_arrayOfUniqueIds, UniqueId} from '@nu-art/ts-common';
import {MemKey_UserAccessIds} from './consts.js';

type AccessCarrier = { __access?: DocumentAccessInner };

const documentAccessInnerValidator: Record<keyof DocumentAccessInner, typeof tsValidator_arrayOfUniqueIds> = {
	readers: tsValidator_arrayOfUniqueIds,
	writers: tsValidator_arrayOfUniqueIds,
	deleters: tsValidator_arrayOfUniqueIds,
	owners: tsValidator_arrayOfUniqueIds,
};


export type AccessContextResolver<Database extends DB_Prototype = DB_Prototype> =
	(item: Database['uiType']) => Promise<DocumentAccessFields> | DocumentAccessFields;

function getCallerScopedAccessIds(): ScopedAccessIds | undefined {
	return MemKey_UserAccessIds.peak();
}

function resolveAccessIds(scopedDict: ScopedAccessIds, scopeKeys?: string[]): UniqueId[] {
	const selfIds = scopedDict[AccessScope_Self] ?? [];
	if (!scopeKeys)
		return filterDuplicates([...selfIds, ...Object.values(scopedDict).flat()]);

	const scopedIds = scopeKeys.flatMap(key => scopedDict[key] ?? []);
	return filterDuplicates([...selfIds, ...scopedIds]);
}

function defaultAccessFields(callerAccessIds: UniqueId[]): DocumentAccessFields {
	const callerId = callerAccessIds[0];
	return {
		__access: {
			readers: [callerId],
			writers: [callerId],
			deleters: [callerId],
			owners: [callerId],
		}
	};
}

function assertCallerAccess(access: Partial<DocumentAccessInner>, callerIds: UniqueId[], ...keys: (keyof DocumentAccessInner)[]): void {
	if (!keys.some(key => access[key]?.length))
		return;

	if (keys.some(key => access[key]?.some(id => callerIds.includes(id))))
		return;

	throw new ApiException(403, 'Insufficient document access');
}

function createQueryInterceptor<Database extends DB_Prototype>(
	scopeKeysProvider: () => string[] | undefined
): QueryInterceptor<Database> {
	return (query) => {
		const scopedDict = getCallerScopedAccessIds();
		if (!scopedDict)
			return query;

		const accessIds = resolveAccessIds(scopedDict, scopeKeysProvider());
		const where = (query.where ?? {}) as Record<string, unknown>;
		where.__access = {readers: {$aca: accessIds}};
		query.where = where as typeof query.where;
		return query;
	};
}

function createPreWriteInterceptor<Database extends DB_Prototype>(
	resolverProvider: () => AccessContextResolver<Database> | undefined,
	scopeKeysProvider: () => string[] | undefined
): PreWriteInterceptor<Database> {
	return async (dbItem, original) => {
		const scopedDict = getCallerScopedAccessIds();
		if (!scopedDict)
			return;

		const item = dbItem as AccessCarrier;
		delete item.__access;

		if (!original) {
			const selfIds = scopedDict[AccessScope_Self] ?? [];
			const resolver = resolverProvider();
			const resolved = resolver ? await resolver(dbItem) : defaultAccessFields(selfIds);
			item.__access = {...resolved.__access};
			return;
		}

		const existingAccess = (original as AccessCarrier).__access;
		if (!existingAccess)
			return;

		item.__access = {...existingAccess};
		assertCallerAccess(existingAccess, resolveAccessIds(scopedDict, scopeKeysProvider()), 'writers', 'owners');
	};
}

function createPreDeleteInterceptor<Database extends DB_Prototype>(
	scopeKeysProvider: () => string[] | undefined
): PreDeleteInterceptor<Database> {
	return async (dbItems) => {
		const scopedDict = getCallerScopedAccessIds();
		if (!scopedDict)
			return;

		const accessIds = resolveAccessIds(scopedDict, scopeKeysProvider());
		for (const dbItem of dbItems) {
			const access = (dbItem as AccessCarrier).__access;
			if (!access)
				throw new ApiException(403, 'No delete access to this document');

			assertCallerAccess(access, accessIds, 'deleters', 'owners');
		}
	};
}

export function copyAccessFields(source: Record<string, unknown>): DocumentAccessFields {
	const access = (source as AccessCarrier).__access;
	return {
		__access: {
			readers: [...(access?.readers ?? [])],
			writers: [...(access?.writers ?? [])],
			deleters: [...(access?.deleters ?? [])],
			owners: [...(access?.owners ?? [])],
		}
	};
}

export function deriveEntityGroupId(entityId: UniqueId, accessKey: keyof DocumentAccessInner): DatabaseDef_AccessGroup['id'] {
	return hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(`${entityId}:${accessKey}`);
}

export function deriveEntityAccessFields(entityId: UniqueId): DocumentAccessFields {
	const inner = AllDocumentAccessKeys.reduce((fields, key) => {
		fields[key] = [deriveEntityGroupId(entityId, key)];
		return fields;
	}, {} as DocumentAccessInner);
	return {__access: inner};
}

function patchCollectionValidator<Database extends DB_Prototype>(dbModule: ModuleBE_BaseDB<Database>) {
	let patched = false;

	dbModule.registerPreWriteInterceptor(async () => {
		if (patched)
			return;

		patched = true;
		const collection = dbModule.collection as any;
		const originalValidate = collection.validateItem.bind(collection);

		collection.validateItem = (dbItem: any) => {
			const extractedAccess = dbItem.__access;
			delete dbItem.__access;

			originalValidate(dbItem);

			if (extractedAccess) {
				const results = tsValidateResult(extractedAccess as DocumentAccessInner, documentAccessInnerValidator);
				if (results)
					throw new ApiException(400, `Invalid document access fields: ${JSON.stringify(results)}`);
			}

			if (extractedAccess)
				dbItem.__access = extractedAccess;
		};
	});
}

export function wireDocumentAccess<Database extends DB_Prototype>(
	dbModule: ModuleBE_BaseDB<Database>,
	resolverProvider: () => AccessContextResolver<Database> | undefined,
	scopeKeysProvider: () => string[] | undefined
): void {
	patchCollectionValidator(dbModule);
	dbModule.registerQueryInterceptor(createQueryInterceptor(scopeKeysProvider));
	dbModule.registerPreWriteInterceptor(createPreWriteInterceptor(resolverProvider, scopeKeysProvider));
	dbModule.registerPreDeleteInterceptor(createPreDeleteInterceptor(scopeKeysProvider));
}
