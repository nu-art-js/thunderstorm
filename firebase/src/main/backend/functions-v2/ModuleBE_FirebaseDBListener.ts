import {deepClone} from '@nu-art/ts-common';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';
import {ParamsOf} from 'firebase-functions/lib/common/params';
import {onValueWritten, DatabaseEvent, DataSnapshot} from 'firebase-functions/v2/database';
import {CloudFunction, Change} from 'firebase-functions/v2';

export abstract class ModuleBE_FirebaseDBListener<DataType = any, ConfigType = any>
	extends ModuleBE_BaseFunction<ConfigType> {

	private readonly listeningPath: string;
	private function!: CloudFunction<DatabaseEvent<Change<DataSnapshot>, ParamsOf<any>>>;

	protected constructor(listeningPath: string, name?: string) {
		super();
		name && this.setName(name);
		this.listeningPath = listeningPath;
	}

	abstract processChanges(before: DataType, after: DataType, params: { [param: string]: any }): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;

		const handler = (event: DatabaseEvent<Change<DataSnapshot>, ParamsOf<string>>) => {
			const before: DataType = event.data.before && event.data.before.val();
			const after: DataType = event.data.after && event.data.after.val();
			const params = deepClone(event.params);

			return this.handleCallback(() => this.processChanges(before, after, params));
		};

		return this.function = onValueWritten(this.listeningPath, handler);
	};
}
