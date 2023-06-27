import {currentTimeMillis, DB_Object, DefaultDBVersion, exists, PreDB} from '@nu-art/ts-common';
import {FirestoreType_DocumentReference} from '../firestore/types';
import {Transaction} from 'firebase-admin/firestore';
import {firestore} from 'firebase-admin';
import UpdateData = firestore.UpdateData;
import {FirestoreCollectionV2} from './FirestoreCollectionV2';


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

	get = async (transaction?: Transaction) => {
		if (transaction)
			return this.data ?? (this.data = ((await transaction.get(this.ref)).data() as (T | undefined)));

		return this.data ?? (this.data = (await this.ref.get()).data() as (T | undefined));
	};

	prepareForCreate = async (preDBItem: PreDB<T>, transaction?: Transaction): Promise<T> => {
		const now = currentTimeMillis();
		preDBItem.__updated = preDBItem.__created = now;
		preDBItem._v = DefaultDBVersion;
		await this.collection.assertDBItem(preDBItem as T, transaction);
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

	update = async (updateData: UpdateData<T>, transaction?: Transaction) => {
		if (transaction)
			transaction.update(this.ref, updateData);
		else
			await this.ref.update(updateData);
	};

	set = async (toWrite: PreDB<T>, transaction?: Transaction): Promise<T> => {
		const now = currentTimeMillis();
		let dbItem = await this.get(transaction);
		if (!exists(dbItem))
			return this.create(toWrite, transaction);

		toWrite._id = dbItem!._id;
		toWrite.__created = dbItem!.__created;
		toWrite._v = dbItem!._v;
		this.collection.dbDef.lockKeys?.forEach(lockedKey => {
			(toWrite as T)[lockedKey] = dbItem![lockedKey];
		});

		toWrite.__updated = now;

		dbItem = toWrite as T;
		await this.collection.assertDBItem(dbItem, transaction);

		if (transaction) {
			transaction.set(this.ref, dbItem);
			this.data = dbItem;
		} else
			await this.ref.set(dbItem);

		return dbItem;
	};

	delete = async (transaction?: Transaction) => {
		const dbItem = await this.get(transaction);
		if (!dbItem)
			return;

		await this.collection.canDeleteDocument([dbItem], transaction);

		if (transaction)
			transaction.delete(this.ref);
		else
			await this.ref.delete();

		this.cleanCache();
	};

	createInBulk = (bulk: firestore.BulkWriter, item: T) => {
		bulk.create(this.ref, item);
		return item;
	};
}