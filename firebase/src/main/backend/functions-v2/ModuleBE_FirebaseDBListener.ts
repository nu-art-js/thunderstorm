import {Change, CloudFunction, EventContext} from 'firebase-functions';
import {DataSnapshot} from 'firebase/database';
import {deepClone} from '@nu-art/ts-common';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const functions = require('firebase-functions');

export abstract class ModuleBE_FirebaseDBListener<DataType = any, ConfigType = any>
	extends ModuleBE_BaseFunction<ConfigType> {

	private readonly listeningPath: string;
	private function!: CloudFunction<Change<DataSnapshot>>;

	protected constructor(listeningPath: string, name?: string) {
		super();
		name && this.setName(name);
		this.listeningPath = listeningPath;
	}

	abstract processChanges(before: DataType, after: DataType, params: { [param: string]: any }): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;

		return this.function = functions.database.ref(this.listeningPath).onWrite(
			(change: Change<DataSnapshot>, context: EventContext) => {
				const before: DataType = change.before && change.before.val();
				const after: DataType = change.after && change.after.val();
				const params = deepClone(context.params);

				return this.handleCallback(() => this.processChanges(before, after, params));
			});
	};
}
