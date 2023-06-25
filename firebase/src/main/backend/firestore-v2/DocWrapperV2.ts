import {DB_Object, PreDB} from '@nu-art/ts-common';
import {FirestoreType_DocumentReference} from '../firestore/types';
import {FirestoreWrapperBEV2} from './FirestoreWrapperBEV2';
import {Transaction} from 'firebase-admin/firestore';
import {firestore} from 'firebase-admin';
import UpdateData = firestore.UpdateData;

export class DocWrapperV2<T extends DB_Object> {
	wrapper: FirestoreWrapperBEV2;
	ref: FirestoreType_DocumentReference<T>;
	data?: T;

	constructor(wrapper: FirestoreWrapperBEV2, ref: FirestoreType_DocumentReference<T>, data?: T) {
		this.wrapper = wrapper;
		this.ref = ref;
		this.data = data;
	}

	async runInTransaction<R>(processor: (transaction: Transaction) => Promise<R>) {
		const firestore = this.wrapper.firestore;
		return firestore.runTransaction(processor);
	}

	cleanCache = () => {
		delete this.data;
	};

	delete = async (transaction?: Transaction) => {
		if (transaction)
			transaction.delete(this.ref);
		else
			await this.ref.delete();
	};

	fromCache = () => {
		return this.data;
	};

	get = async (transaction?: Transaction) => {
		if (transaction)
			this.data = (await transaction.get(this.ref)).data() as T;

		return this.data ?? (this.data = (await this.ref.get()).data() as T);
	};

	create = async (instance: PreDB<T>, transaction?: Transaction): Promise<T> => {
		if (transaction)
			transaction.create(this.ref, instance as T);
		else
			await this.ref.create(instance as T);

		return instance as T;
	};

	set = async (instance: PreDB<T>, transaction?: Transaction): Promise<T> => {
		if (transaction)
			transaction.set(this.ref, instance as T);
		else
			await this.ref.set(instance as T);

		return instance as T;
	};

	update = async (updateData: UpdateData<T>, transaction?: Transaction) => {
		if (transaction)
			transaction.update(this.ref, updateData);
		else
			await this.ref.update(updateData);
	};
}