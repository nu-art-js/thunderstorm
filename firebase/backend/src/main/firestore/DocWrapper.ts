import {DB_Prototype} from '@nu-art/db-api-shared';
import {_keys, currentTimeMillis, DB_Object, exists, MUSTNeverHappenException, TS_Object, UniqueId} from '@nu-art/ts-common';
import {FirestoreType_DocumentReference} from './types.js';
import {assertUniqueId, CollectionActionType, FirestoreCollection, PostWriteProcessingData} from './FirestoreCollection.js';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {addDeletedToTransaction, getActiveTransaction} from './consts.js';
import admin from 'firebase-admin';
import type {firestore as Fa} from 'firebase-admin';

const {FieldValue} = admin.firestore;

export type UpdateObject<DBType extends TS_Object> = {
	_id: UniqueId;
} & Fa.UpdateData<DBType>;


export class DocWrapper<Proto extends DB_Prototype> {
	readonly ref: FirestoreType_DocumentReference<Proto['dbType']>;
	readonly collection: FirestoreCollection<Proto>;
	data?: Proto['dbType'];

	protected constructor(collection: FirestoreCollection<Proto>, ref: FirestoreType_DocumentReference<Proto['dbType']>, data?: Proto['dbType']) {
		this.collection = collection;
		this.ref = ref;
		this.data = data;
	}

	fromCache = () => {
		return this.data;
	};

	cleanCache = (): DocWrapper<Proto> => {
		delete this.data;
		return this;
	};

	private assertId(item: Proto['uiType']) {
		item._id = assertUniqueId(item, this.collection.uniqueKeys);
		if (item._id !== this.ref.id)
			throw new MUSTNeverHappenException(`Composed _id does not match doc ref id! \n expected: ${this.ref.id} \n actual: ${item._id} \n`);
	}

	get = async () => {
		const transaction = getActiveTransaction();
		if (transaction)
			return this.data ?? (this.data = ((await transaction.get(this.ref)).data() as (Proto['dbType'] | undefined)));

		return this.data ?? (this.data = (await this.ref.get()).data() as (Proto['dbType'] | undefined));
	};

	prepareForCreate = async (preDBItem: Proto['uiType'], upgrade = true): Promise<Proto['dbType']> => {
		const now = currentTimeMillis();

		this.assertId(preDBItem);
		preDBItem.__updated = preDBItem.__created = now;
		if (upgrade) {
			preDBItem._v = this.collection.getVersion();
			await this.collection.hooks?.upgradeInstances([preDBItem]);
		}

		await this.collection.hooks?.preWriteProcessing?.(preDBItem, undefined);
		this.collection.validateItem(preDBItem as Proto['dbType']);
		return preDBItem as Proto['dbType'];
	};

	create = async (preDBItem: Proto['uiType']): Promise<Proto['dbType']> => {
		const dbItem = await this.prepareForCreate(preDBItem as Proto['dbType']);
		const transaction = getActiveTransaction();

		if (transaction) {
			transaction.create(this.ref, dbItem);
			this.data = dbItem;
		} else
			await this.ref.create(dbItem);

		this.postWriteProcessing({updated: dbItem}, 'create');
		return dbItem;
	};

	prepareForSet = async (updatedDBItem: Proto['dbType'], dbItem?: Proto['dbType'], upgrade = true): Promise<Proto['dbType']> => {
		if (!dbItem)
			return this.prepareForCreate(updatedDBItem);

		this.assertId(updatedDBItem);
		updatedDBItem.__created = dbItem.__created;

		this.collection.dbDef.lockKeys?.forEach(lockedKey => {
			if (exists(dbItem[lockedKey]))
				updatedDBItem[lockedKey] = dbItem[lockedKey];
		});

		updatedDBItem.__updated = currentTimeMillis();

		if (this.collection.needsUpgrade(updatedDBItem._v)) {
			await this.collection.hooks?.upgradeInstances([updatedDBItem]);
		}

		updatedDBItem._v = this.collection.getVersion();
		await this.collection.hooks?.preWriteProcessing?.(updatedDBItem, dbItem);
		this.collection.validateItem(updatedDBItem);
		return updatedDBItem;
	};

	set = async (item: Proto['uiType'] | Proto['dbType']): Promise<Proto['dbType']> => {
		const transaction = getActiveTransaction();
		if (!transaction)
			return this.collection.runTransaction(() => this.set(item));

		const currDBItem = await this.get();
		if ((currDBItem?.__updated || 0) > ((item as DB_Object).__updated || currentTimeMillis()))
			throw HttpCodes._4XX.ENTITY_IS_OUTDATED('Item is outdated', `${this.collection.collection.path}/${currDBItem?._id} is outdated`);

		const newDBItem = await this.prepareForSet(item as Proto['dbType'], currDBItem!, false);

		transaction.set(this.ref, newDBItem);
		this.data = currDBItem;
		this.postWriteProcessing({updated: newDBItem, before: currDBItem}, 'set');

		return newDBItem;
	};

	private postWriteProcessing(data: PostWriteProcessingData<Proto>, actionType: CollectionActionType) {
		const transaction = getActiveTransaction();
		const toExecute = () => this.collection.hooks?.postWriteProcessing?.(data, actionType);
		if (transaction)
			// @ts-ignore
			transaction.postTransaction(toExecute);
		else
			toExecute();
	}

	async prepareForUpdate(updateData: UpdateObject<Proto['dbType']>) {
		delete updateData.__created;
		delete updateData._v;
		updateData.__updated = currentTimeMillis();
		this.updateDeletedFields(updateData);
		await this.collection.validateUpdateData(updateData);
		return updateData;
	}

	/**
	 * Recursively replaces any undefined or null fields in DB item with firestore.FieldValue.delete()
	 */
	private updateDeletedFields(updateData: UpdateObject<Proto['dbType'] | Proto['dbType'][keyof Proto['dbType']]>) {
		if (typeof updateData !== 'object' || updateData === null)
			return;

		_keys(updateData).forEach(_key => {
			const _value = updateData[_key];

			if (!exists(_value as any)) {
				(updateData[_key] as Fa.FieldValue) = FieldValue.delete();
			} else {
				this.updateDeletedFields(_value as UpdateObject<Proto['dbType'] | Proto['dbType'][keyof Proto['dbType']]>);
			}
		});
	}

	update = async (updateData: UpdateObject<Proto['dbType']>) => {
		updateData = await this.prepareForUpdate(updateData);
		await this.ref.update(updateData);
		const dbItem = await this.get();
		this.postWriteProcessing({updated: dbItem}, 'update');
		return dbItem;
	};

	delete = async (): Promise<Proto['dbType'] | undefined> => {
		const transaction = getActiveTransaction();
		if (!transaction)
			return this.collection.runTransaction(() => this.delete());

		const dbItem = await this.get();
		if (!dbItem)
			return;

		addDeletedToTransaction({
			dbKey: this.collection.dbDef.entityName,
			ids: [dbItem._id]
		});
		await this.collection.hooks?.canDeleteItems([dbItem]);

		transaction.delete(this.ref);

		this.cleanCache();

		this.postWriteProcessing({deleted: dbItem}, 'delete');
		return dbItem;
	};
}
