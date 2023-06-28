import {_keys, currentTimeMillis, DB_Object, exists, PreDB, UniqueId} from '@nu-art/ts-common';
import {FirestoreType_DocumentReference} from '../firestore/types';
import {Transaction} from 'firebase-admin/firestore';
import {firestore} from 'firebase-admin';
import {FirestoreCollectionV2} from './FirestoreCollectionV2';
import BulkWriter = firestore.BulkWriter;
import UpdateData = firestore.UpdateData;
import FieldValue = firestore.FieldValue;

export type UpdateObject<Type> = { _id: UniqueId } & UpdateData<Type>;

export type BulkOperation = 'create' | 'set' | 'update' | 'delete';

export type BulkItem<Op extends BulkOperation, T extends DB_Object> =
	Op extends 'delete' ? undefined :
		Op extends 'update' ? UpdateObject<T> :
			T;

// type BulkItem<T extends DB_Object> = {
// 	create: T,
// 	set: T,
// 	update: UpdateObject<T>,
// 	delete: undefined
// }

export class DocWrapperV2<T extends DB_Object> {
	readonly ref: FirestoreType_DocumentReference<T>;
	readonly collection: FirestoreCollectionV2<T>;
	data?: T;

	protected constructor(collection: FirestoreCollectionV2<T>, ref: FirestoreType_DocumentReference<T>, data?: T) {
		this.collection = collection;
		this.ref = ref;
		this.data = data;
	}

	fromCache = () => {
		return this.data;
	};

	cleanCache = (): DocWrapperV2<T> => {
		delete this.data;
		return this;
	};

	addToBulk = <Op extends BulkOperation>(bulk: BulkWriter, operation: Op, item?: BulkItem<Op, T>) => {
		switch (operation) {
			case 'create':
				bulk.create(this.ref, item as BulkItem<'create', T>);
				break;
			case 'set':
				bulk.set(this.ref, item as BulkItem<'set', T>);
				break;
			case 'update':
				bulk.update(this.ref, item as BulkItem<'update', T>);
				break;
			case 'delete':
				bulk.delete(this.ref);
				break;
		}
		return item;
	};

	get = async (transaction?: Transaction) => {
		if (transaction)
			return this.data ?? (this.data = ((await transaction.get(this.ref)).data() as (T | undefined)));

		return this.data ?? (this.data = (await this.ref.get()).data() as (T | undefined));
	};

	prepareForCreate = async (preDBItem: PreDB<T>, transaction?: Transaction): Promise<T> => {
		const now = currentTimeMillis();
		preDBItem.__updated = preDBItem.__created = now;
		preDBItem._v = this.collection.getVersion();
		await this.collection.hooks?.prepareItemForDB(preDBItem as T, transaction);
		this.collection.validateItem(preDBItem as T);
		return preDBItem as T;
	};

	create = async (preDBItem: PreDB<T>, transaction?: Transaction): Promise<T> => {
		const dbItem = await this.prepareForCreate(preDBItem as T);

		if (transaction) {
			transaction.create(this.ref, dbItem);
			this.data = dbItem;
		} else
			await this.ref.create(dbItem);

		return dbItem;
	};

	prepareForSet = async (updatedDBItem: T, dbItem: T, transaction?: Transaction): Promise<T> => {
		updatedDBItem._id = dbItem._id;
		updatedDBItem._v = dbItem!._v;
		updatedDBItem.__created = dbItem!.__created;
		this.collection.dbDef.lockKeys?.forEach(lockedKey => {
			updatedDBItem[lockedKey] = dbItem![lockedKey];
		});

		updatedDBItem.__updated = currentTimeMillis();
		await this.collection.hooks?.prepareItemForDB(updatedDBItem as T, transaction);
		this.collection.validateItem(updatedDBItem);
		return updatedDBItem;
	};

	set = async (item: PreDB<T> | T, transaction?: Transaction): Promise<T> => {
		const currDBItem = await this.get(transaction);
		if (!exists(currDBItem))
			return this.create(item, transaction);

		const newDBItem = await this.prepareForSet(item as T, currDBItem!, transaction);

		if (transaction) {
			transaction.set(this.ref, newDBItem);
			this.data = currDBItem;
		} else
			await this.ref.set(newDBItem);

		return newDBItem;
	};

	async prepareForUpdate(updateData: UpdateObject<T>, transaction?: Transaction) {
		delete updateData.__created;
		delete updateData._v;
		updateData.__updated = currentTimeMillis();
		this.updateDeletedFields(updateData);
		await this.collection.assertUpdateData(updateData, transaction);
		return updateData;
	}

	/**
	 * Recursively replaces any undefined or null fields in DB item with firestore.FieldValue.delete()
	 * @param updateData: data to update in DB item
	 * @private
	 */
	private updateDeletedFields(updateData: UpdateObject<T | T[keyof T]>) {
		if (typeof updateData !== 'object' || updateData === null)
			return;

		_keys(updateData).forEach(_key => {
			const _value = updateData[_key];

			if (!exists(_value)) {
				(updateData[_key] as FieldValue) = FieldValue.delete();
			} else {
				this.updateDeletedFields(_value as UpdateObject<T | T[keyof T]>);
			}
		});
	}

	update = async (updateData: UpdateObject<T>) => {
		updateData = await this.prepareForUpdate(updateData);
		await this.ref.update(updateData);
		return await this.get();
	};

	delete = async (transaction?: Transaction) => {
		const dbItem = await this.get(transaction);
		if (!dbItem)
			return;

		await this.collection.hooks?.canDeleteItems([dbItem], transaction);

		if (transaction)
			transaction.delete(this.ref);
		else
			await this.ref.delete();

		this.cleanCache();
	};
}