import type {DB_Prototype} from '@nu-art/db-api-shared';
import type {ModuleBE_BaseDB, PreWriteInterceptor, QueryInterceptor, PreDeleteInterceptor} from '@nu-art/db-api-backend';
import type {DocumentAccessFields} from '@nu-art/permissions-shared';
import {ApiException} from '@nu-art/ts-common';
import {AllDocumentAccessFieldKeys} from '@nu-art/permissions-shared';
import {MemKey_UserAccessIds} from './consts.js';


export type AccessContextResolver<Database extends DB_Prototype = DB_Prototype> =
	(item: Database['uiType']) => Promise<DocumentAccessFields> | DocumentAccessFields;

function getCallerAccessIds(): string[] | undefined {
	return MemKey_UserAccessIds.peak();
}

function defaultResolver(callerAccessIds: string[]): DocumentAccessFields {
	const callerId = callerAccessIds[0];
	return {
		_readers: [callerId],
		_writers: [callerId],
		_deleters: [callerId],
		_owners: [callerId],
	};
}

function createQueryInterceptor<Database extends DB_Prototype>(): QueryInterceptor<Database> {
	return (query) => {
		const accessIds = getCallerAccessIds();
		if (!accessIds)
			return query;

		const where = (query.where ?? {}) as any;
		where._readers = {$aca: accessIds};
		return {...query, where};
	};
}

function createPreWriteInterceptor<Database extends DB_Prototype>(
	resolverProvider: () => AccessContextResolver<Database> | undefined
): PreWriteInterceptor<Database> {
	return async (dbItem, original) => {
		const accessIds = getCallerAccessIds();
		if (!accessIds)
			return;

		const item = dbItem as any;

		if (!original) {
			const resolver = resolverProvider();
			const context = resolver
				? await resolver(dbItem)
				: defaultResolver(accessIds);

			for (const key of AllDocumentAccessFieldKeys)
				item[key] = [...context[key]];

			return;
		}

		const existing = original as any as Partial<DocumentAccessFields>;
		if (!existing._writers && !existing._owners)
			return;

		const canWrite = existing._writers?.some((id: string) => accessIds.includes(id))
			|| existing._owners?.some((id: string) => accessIds.includes(id));

		if (!canWrite)
			throw new ApiException(403, 'No write access to this document');
	};
}

function createPreDeleteInterceptor<Database extends DB_Prototype>(): PreDeleteInterceptor<Database> {
	return async (dbItems) => {
		const accessIds = getCallerAccessIds();
		if (!accessIds)
			return;

		for (const item of dbItems) {
			const doc = item as any as Partial<DocumentAccessFields>;

			const canDelete = doc._deleters?.some((id: string) => accessIds.includes(id))
				|| doc._owners?.some((id: string) => accessIds.includes(id));

			if (!canDelete)
				throw new ApiException(403, 'No delete access to this document');
		}
	};
}

export function wireDocumentAccess<Database extends DB_Prototype>(
	dbModule: ModuleBE_BaseDB<Database>,
	resolverProvider: () => AccessContextResolver<Database> | undefined
): void {
	dbModule.registerQueryInterceptor(createQueryInterceptor());
	dbModule.registerPreWriteInterceptor(createPreWriteInterceptor(resolverProvider));
	dbModule.registerPreDeleteInterceptor(createPreDeleteInterceptor());
}
