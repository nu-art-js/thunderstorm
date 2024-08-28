import {deepClone, TS_Object} from '@thunder-storm/common';
import {Change, CloudFunction, EventContext} from 'firebase-functions';
import {DataSnapshot} from 'firebase/database';
import {DocumentSnapshot} from 'firebase/firestore';
import {FirestoreConfigs} from '../functions/firebase-function';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const functions = require('firebase-functions');

export abstract class ModuleBE_FirestoreListener<DataType extends TS_Object, ConfigType extends FirestoreConfigs = FirestoreConfigs>
	extends ModuleBE_BaseFunction<ConfigType> {

	private readonly collectionName: string;
	private function!: CloudFunction<Change<DataSnapshot>>;

	protected constructor(collectionName: string, name?: string, tag?: string) {
		super(tag);
		name && this.setName(name);
		this.collectionName = collectionName;
	}

	abstract processChanges(params: { [param: string]: any }, before?: DataType, after?: DataType): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;

		return this.function = functions.runWith(this.config?.runTimeOptions || {}).firestore.document(`${this.collectionName}/{docId}`).onWrite(
			(change: Change<DocumentSnapshot<DataType>>, context: EventContext) => {
				const before: DataType | undefined = change.before && change.before.data();
				const after: DataType | undefined = change.after && change.after.data();
				const params = deepClone(context.params);

				return this.handleCallback(() => this.processChanges(params, before, after));
			});
	};
}