import {_keys, currentTimeMillis, DBProto, exists, MUSTNeverHappenException, UniqueId} from '@nu-art/ts-common';
import {FirestoreType_DocumentReference} from '../firestore/types';
import {Transaction} from 'firebase-admin/firestore';
import {firestore} from 'firebase-admin';
import {assertUniqueId, FirestoreCollectionV3} from './FirestoreCollectionV3';
import UpdateData = firestore.UpdateData;
import FieldValue = firestore.FieldValue;


export type UpdateObject<Proto extends DBProto<any>> =
	{
		_id: UniqueId
	}
	& UpdateData<Proto['dbType']>;

export class DocWrapperV3<Proto extends DBProto<any>> {
	readonly ref: FirestoreType_DocumentReference<Proto['dbType']>;
	readonly collection: FirestoreCollectionV3<Proto>;
	data?: Proto['dbType'];

	protected constructor(collection: FirestoreCollectionV3<Proto>, ref: FirestoreType_DocumentReference<Proto['dbType']>, data?: Proto['dbType']) {
		this.collection = collection;
		this.ref = ref;
		this.data = data;
	}

	fromCache = () => {
		return this.data;
	};

	cleanCache = (): DocWrapperV3<Proto> => {
		delete this.data;
		return this;
	};

	private assertId(item: Proto['uiType']) {
		item._id = assertUniqueId(item, this.collection.uniqueKeys);
		if (item._id !== this.ref.id)
			throw new MUSTNeverHappenException(`Composed _id does not match doc ref id! \n expected: ${this.ref.id} \n actual: ${item._id} \n`);
	}

	get = async (transaction?: Transaction) => {
		if (transaction)
			return this.data ?? (this.data = ((await transaction.get(this.ref)).data() as (Proto['dbType'] | undefined)));

		return this.data ?? (this.data = (await this.ref.get()).data() as (Proto['dbType'] | undefined));
	};

	prepareForCreate = async (preDBItem: Proto['uiType'], transaction?: Transaction): Promise<Proto['dbType']> => {
		const now = currentTimeMillis();

		this.assertId(preDBItem);
		preDBItem.__updated = preDBItem.__created = now;
		preDBItem._v = this.collection.getVersion();
		await this.collection.hooks?.preWriteProcessing?.(preDBItem, transaction);
		this.collection.validateItem(preDBItem as Proto['dbType']);
		return preDBItem as Proto['dbType'];
	};

	create = async (preDBItem: Proto['uiType'], transaction?: Transaction): Promise<Proto['dbType']> => {
		const dbItem = await this.prepareForCreate(preDBItem as Proto['dbType']);

		if (transaction) {
			transaction.create(this.ref, dbItem);
			this.data = dbItem;
		} else
			await this.ref.create(dbItem);

		await this.collection.hooks?.postWriteProcessing?.({updated: dbItem});

		return dbItem;
	};

	prepareForSet = async (updatedDBItem: Proto['dbType'], dbItem?: Proto['dbType'], transaction?: Transaction): Promise<Proto['dbType']> => {
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

	set = async (item: Proto['uiType'] | Proto['dbType'], transaction?: Transaction): Promise<Proto['dbType']> => {
		if (!transaction)
			return this.collection.runTransaction((transaction: Transaction) => this.set(item, transaction));

		const currDBItem = await this.get(transaction);
		const newDBItem = await this.prepareForSet(item as Proto['dbType'], currDBItem!, transaction);

		// Will always get here with a transaction!
		transaction!.set(this.ref, newDBItem);
		this.data = currDBItem;

		await this.collection.hooks?.postWriteProcessing?.({updated: newDBItem});

		return newDBItem;
	};

	async prepareForUpdate(updateData: UpdateObject<Proto['dbType']>, transaction?: Transaction) {
		delete updateData.__created;
		delete updateData._v;
		updateData.__updated = currentTimeMillis();
		// this.collection.dbDef.lockKeys?.forEach(lockedKey => {
		// 	(updateData as Partial<Proto['dbType']>)[lockedKey] = undefined;
		// });
		this.updateDeletedFields(updateData);
		await this.collection.validateUpdateData(updateData, transaction);
		return updateData;
	}

	/**
	 * Recursively replaces any undefined or null fields in DB item with firestore.FieldValue.delete()
	 * @private
	 * @param updateData
	 */
	private updateDeletedFields(updateData: UpdateObject<Proto['dbType'] | Proto['dbType'][keyof Proto['dbType']]>) {
		if (typeof updateData !== 'object' || updateData === null)
			return;

		_keys(updateData).forEach(_key => {
			const _value = updateData[_key];

			if (!exists(_value as any)) {
				(updateData[_key] as FieldValue) = FieldValue.delete();
			} else {
				this.updateDeletedFields(_value as UpdateObject<Proto['dbType'] | Proto['dbType'][keyof Proto['dbType']]>);
			}
		});
	}

	update = async (updateData: UpdateObject<Proto['dbType']>) => {
		updateData = await this.prepareForUpdate(updateData);
		await this.ref.update(updateData);
		const dbItem = await this.get();
		await this.collection.hooks?.postWriteProcessing?.({updated: dbItem});
		return dbItem;
	};

	delete = async (transaction?: Transaction): Promise<Proto['dbType'] | undefined> => {
		if (!transaction)
			return this.collection.runTransaction(transaction => this.delete(transaction));

		const dbItem = await this.get(transaction);
		if (!dbItem)
			return;

		await this.collection.hooks?.canDeleteItems([dbItem], transaction);

		// Will always get here with a transaction!
		transaction!.delete(this.ref);

		this.cleanCache();
		await this.collection.hooks?.postWriteProcessing?.({deleted: dbItem});
		return dbItem;
	};
}