import {
	_keys,
	currentTimeMillis,
	DB_Object,
	exists,
	MUSTNeverHappenException,
	PreDB,
	UniqueId
} from '@nu-art/ts-common';
import {FirestoreType_DocumentReference} from '../firestore/types';
import {Transaction} from 'firebase-admin/firestore';
import {firestore} from 'firebase-admin';
import {FirestoreCollectionV2, assertUniqueId} from './FirestoreCollectionV2';
import UpdateData = firestore.UpdateData;
import FieldValue = firestore.FieldValue;
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';


export type UpdateObject<Type> = { _id: UniqueId } & UpdateData<Type>;

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

	private assertId(item: PreDB<T>) {
		item._id = assertUniqueId(item, this.collection.uniqueKeys);
		if (item._id !== this.ref.id)
			throw new MUSTNeverHappenException(`Composed _id does not match doc ref id! \n expected: ${this.ref.id} \n actual: ${item._id} \n`);
	}

	get = async (transaction?: Transaction) => {
		if (transaction)
			return this.data ?? (this.data = ((await transaction.get(this.ref)).data() as (T | undefined)));

		return this.data ?? (this.data = (await this.ref.get()).data() as (T | undefined));
	};

	prepareForCreate = async (preDBItem: PreDB<T>, transaction?: Transaction): Promise<T> => {
		const now = currentTimeMillis();

		this.assertId(preDBItem);
		preDBItem.__updated = preDBItem.__created = now;
		preDBItem._v = this.collection.getVersion();
		await this.collection.hooks?.preWriteProcessing?.(preDBItem, transaction);
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

		if (transaction)
			// @ts-ignore
			transaction.postTransaction(() => this.collection.hooks?.postWriteProcessing?.({updated: dbItem}));
		else
			this.collection.hooks?.postWriteProcessing?.({updated: dbItem});

		return dbItem;
	};

	prepareForSet = async (updatedDBItem: T, dbItem?: T, transaction?: Transaction): Promise<T> => {
		if (!dbItem)
			return this.prepareForCreate(updatedDBItem, transaction);

		this.assertId(updatedDBItem);
		updatedDBItem._v = dbItem._v;
		updatedDBItem.__created = dbItem.__created;
		this.collection.dbDef.lockKeys?.forEach(lockedKey => {
			updatedDBItem[lockedKey] = dbItem[lockedKey];
		});

		updatedDBItem.__updated = currentTimeMillis();
		await this.collection.hooks?.preWriteProcessing?.(updatedDBItem, transaction);
		this.collection.validateItem(updatedDBItem);
		return updatedDBItem;
	};

	set = async (item: PreDB<T> | T, transaction?: Transaction): Promise<T> => {
		if (!transaction)
			return this.collection.runTransaction(transaction => this.set(item, transaction));

		const currDBItem = await this.get(transaction);
		if ((currDBItem?.__updated || 0) > ((item as DB_Object).__updated || currentTimeMillis()))
			throw HttpCodes._4XX.ENTITY_IS_OUTDATED('Item is outdated', `${this.collection.name}/${currDBItem?._id} is outdated`);

		const newDBItem = await this.prepareForSet(item as T, currDBItem!, transaction);
		// Will always get here with a transaction!
		transaction.set(this.ref, newDBItem);
		this.data = newDBItem;

		/**
		 * TODO: PATCH - postWriteProcessing was not called
		 * VDK - 30/10/2023
		 *
		 * Need to find a better solution for this, perhaps our own transaction (import hell fixes)
		 */
		// @ts-ignore
		transaction.postTransaction(() => this.collection.hooks?.postWriteProcessing?.({before: currDBItem, updated: newDBItem}));

		return newDBItem;
	};

	async prepareForUpdate(updateData: UpdateObject<T>, transaction?: Transaction) {
		delete updateData.__created;
		delete updateData._v;
		updateData.__updated = currentTimeMillis();
		// this.collection.dbDef.lockKeys?.forEach(lockedKey => {
		// 	(updateData as Partial<T>)[lockedKey] = undefined;
		// });
		this.updateDeletedFields(updateData);
		await this.collection.validateUpdateData(updateData, transaction);
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

			if (!exists(_value as any)) {
				(updateData[_key] as FieldValue) = FieldValue.delete();
			} else {
				this.updateDeletedFields(_value as UpdateObject<T | T[keyof T]>);
			}
		});
	}

	update = async (updateData: UpdateObject<T>) => {
		updateData = await this.prepareForUpdate(updateData);
		await this.ref.update(updateData);
		const dbItem = await this.get();
		await this.collection.hooks?.postWriteProcessing?.({updated: dbItem});
		return dbItem;
	};

	delete = async (transaction?: Transaction): Promise<T | undefined> => {
		if (!transaction)
			return this.collection.runTransaction(transaction => this.delete(transaction));

		const dbItem = await this.get(transaction);
		if (!dbItem)
			return;

		await this.collection.hooks?.canDeleteItems([dbItem], transaction);

		// Will always get here with a transaction!
		transaction!.delete(this.ref);

		this.cleanCache();
		// @ts-ignore
			transaction?.postTransaction(() => this.collection.hooks?.postWriteProcessing?.({deleted: dbItem}));
		return dbItem;
	};
}