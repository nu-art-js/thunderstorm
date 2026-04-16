import type {DB_Prototype} from '@nu-art/db-api-shared';
import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {ModuleBE_BaseDB, PreWriteInterceptor, QueryInterceptor, PreDeleteInterceptor} from '@nu-art/db-api-backend';
import type {DatabaseDef_AccessGroup, DocumentAccessFields, ScopedAccessIds} from '@nu-art/permissions-shared';
import {AccessScope_Self, AllDocumentAccessFieldKeys} from '@nu-art/permissions-shared';
import {ApiException, filterDuplicates, tsValidateResult, tsValidator_arrayOfUniqueIds, UniqueId} from '@nu-art/ts-common';
import {MemKey_ServiceAccountId, MemKey_UserAccessIds} from './consts.js';

const documentAccessFieldsValidator: Record<keyof DocumentAccessFields, typeof tsValidator_arrayOfUniqueIds> = {
	_readers: tsValidator_arrayOfUniqueIds,
	_writers: tsValidator_arrayOfUniqueIds,
	_deleters: tsValidator_arrayOfUniqueIds,
	_owners: tsValidator_arrayOfUniqueIds,
};


export type AccessContextResolver<Database extends DB_Prototype = DB_Prototype> =
	(item: Database['uiType']) => Promise<DocumentAccessFields> | DocumentAccessFields;

function isServiceAccountContext(): boolean {
	return MemKey_ServiceAccountId.peak() !== undefined;
}

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

function defaultResolver(callerAccessIds: UniqueId[]): DocumentAccessFields {
	const callerId = callerAccessIds[0];
	return {
		_readers: [callerId],
		_writers: [callerId],
		_deleters: [callerId],
		_owners: [callerId],
	};
}

function createQueryInterceptor<Database extends DB_Prototype>(
	scopeKeysProvider: () => string[] | undefined
): QueryInterceptor<Database> {
	return (query) => {
		if (isServiceAccountContext())
			return query;

		const scopedDict = getCallerScopedAccessIds();
		if (!scopedDict)
			return query;

		const accessIds = resolveAccessIds(scopedDict, scopeKeysProvider());
		const where = (query.where ?? {}) as any;
		where._readers = {$aca: accessIds};
		return {...query, where};
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

		const item = dbItem as any;

		if (!original) {
			const selfIds = scopedDict[AccessScope_Self] ?? [];
			const resolver = resolverProvider();
			const context = resolver
				? await resolver(dbItem)
				: defaultResolver(selfIds);

			for (const key of AllDocumentAccessFieldKeys)
				item[key] = [...context[key]];

			return;
		}

		if (isServiceAccountContext())
			return;

		const accessIds = resolveAccessIds(scopedDict, scopeKeysProvider());
		const existing = original as any as Partial<DocumentAccessFields>;
		if (!existing._writers && !existing._owners)
			return;

		const canWrite = existing._writers?.some((id: string) => accessIds.includes(id))
			|| existing._owners?.some((id: string) => accessIds.includes(id));

		if (!canWrite)
			throw new ApiException(403, 'No write access to this document');
	};
}

function createPreDeleteInterceptor<Database extends DB_Prototype>(
	scopeKeysProvider: () => string[] | undefined
): PreDeleteInterceptor<Database> {
	return async (dbItems) => {
		if (isServiceAccountContext())
			return;

		const scopedDict = getCallerScopedAccessIds();
		if (!scopedDict)
			return;

		const accessIds = resolveAccessIds(scopedDict, scopeKeysProvider());
		for (const item of dbItems) {
			const doc = item as any as Partial<DocumentAccessFields>;

			const canDelete = doc._deleters?.some((id: string) => accessIds.includes(id))
				|| doc._owners?.some((id: string) => accessIds.includes(id));

			if (!canDelete)
				throw new ApiException(403, 'No delete access to this document');
		}
	};
}

export function copyAccessFields(source: Record<string, unknown>): DocumentAccessFields {
	const doc = source as Partial<DocumentAccessFields>;
	return {
		_readers: [...(doc._readers ?? [])],
		_writers: [...(doc._writers ?? [])],
		_deleters: [...(doc._deleters ?? [])],
		_owners: [...(doc._owners ?? [])],
	};
}

export function deriveEntityGroupId(entityId: UniqueId, fieldKey: keyof DocumentAccessFields): DatabaseDef_AccessGroup['id'] {
	return hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>(`${entityId}:${fieldKey}`);
}

export function deriveEntityAccessFields(entityId: UniqueId): DocumentAccessFields {
	return AllDocumentAccessFieldKeys.reduce((fields, key) => {
		fields[key] = [deriveEntityGroupId(entityId, key)];
		return fields;
	}, {} as DocumentAccessFields);
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
			const extracted: Record<string, unknown> = {};
			for (const key of AllDocumentAccessFieldKeys) {
				if (!(key in dbItem))
					continue;

				extracted[key] = dbItem[key];
				delete dbItem[key];
			}

			originalValidate(dbItem);

			if (Object.keys(extracted).length > 0) {
				const results = tsValidateResult(extracted as DocumentAccessFields, documentAccessFieldsValidator);
				if (results)
					throw new ApiException(400, `Invalid document access fields: ${JSON.stringify(results)}`);
			}

			Object.assign(dbItem, extracted);
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
