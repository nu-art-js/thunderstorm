import {Dispatcher} from '@nu-art/ts-common';
import {Transaction} from 'firebase-admin/firestore';
import {DB_Object} from '@nu-art/ts-common';

export interface OnDatabaseChange {
	__onItemsUpdated(collectionName: string, items: DB_Object | DB_Object[], latestUpdated: number, transaction?: Transaction): void | Promise<void>;
	__onItemsDeleted(collectionName: string, items: DB_Object[] | null, uniqueKeys: string[], transaction?: Transaction): void | Promise<void>;
}

export const dispatch_onItemsUpdated = new Dispatcher<OnDatabaseChange, '__onItemsUpdated'>('__onItemsUpdated');
export const dispatch_onItemsDeleted = new Dispatcher<OnDatabaseChange, '__onItemsDeleted'>('__onItemsDeleted');
