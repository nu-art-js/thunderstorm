import {DB_Object} from '@nu-art/ts-common';
import {FirestoreType_DocumentReference} from '../firestore/types';
import {Transaction} from 'firebase-admin/firestore';
import {firestore} from 'firebase-admin';
import UpdateData = firestore.UpdateData;

export class DocWrapperV2<T extends DB_Object> {
	ref: FirestoreType_DocumentReference<T>;
	data?: T;

	constructor(ref: FirestoreType_DocumentReference<T>, data?: T) {
		this.ref = ref;
		this.data = data;
	}

	fromCache = () => {
		return this.data;
	};

	cleanCache = () => {
		delete this.data;
	};

	get = async (transaction?: Transaction) => {
		if (transaction)
			return this.data ?? (this.data = ((await transaction.get(this.ref)).data() as T));

		return this.data ?? (this.data = (await this.ref.get()).data() as T);
	};

	create = async (item: T, transaction?: Transaction): Promise<T> => {
		if (transaction) {
			transaction.create(this.ref, item);
			this.data = item;
		}
		else
			await this.ref.create(item);

		return item;
	};

	update = async (updateData: UpdateData<T>, transaction?: Transaction) => {
		if (transaction)
			transaction.update(this.ref, updateData);
		else
			await this.ref.update(updateData);
	};

	set = async (item: T, transaction?: Transaction): Promise<T> => {
		if (transaction) {
			transaction.set(this.ref, item);
			this.data = item;
		}
		else
			await this.ref.set(item);

		return item;
	};

	delete = async (transaction?: Transaction) => {
		if (transaction)
			transaction.delete(this.ref);
		else
			await this.ref.delete();
		this.cleanCache();
	};
}