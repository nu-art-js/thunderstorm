import {deepClone, TS_Object} from '@nu-art/ts-common';
import {FirestoreConfigs} from '../functions/firebase-function.js';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction.js';
import {DocumentOptions, DocumentSnapshot, FirestoreEvent, onDocumentWritten} from 'firebase-functions/v2/firestore';
import {ParamsOf, Change, CloudFunction} from 'firebase-functions/v2';


export abstract class ModuleBE_FirestoreListener<DataType extends TS_Object, ConfigType extends FirestoreConfigs = FirestoreConfigs>
	extends ModuleBE_BaseFunction<ConfigType & DocumentOptions> {

	private function!: CloudFunction<FirestoreEvent<Change<DocumentSnapshot> | undefined, ParamsOf<string>>>;

	protected constructor(collectionName: string, name?: string, tag?: string) {
		super(tag);
		name && this.setName(name);
		this.setDefaultConfig({document: `${collectionName}/{docId}`} as ConfigType & DocumentOptions);
	}

	abstract processChanges(params: { [param: string]: any }, before?: DataType, after?: DataType): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;

		this.function = onDocumentWritten(this.config, event => {
			const before = event.data?.before && event.data?.before.data() as DataType | undefined;
			const after = event.data?.after && event.data?.after.data() as DataType | undefined;
			const params = deepClone(event.params);

			return this.handleCallback(() => this.processChanges(params, before, after));
		});
	};
}