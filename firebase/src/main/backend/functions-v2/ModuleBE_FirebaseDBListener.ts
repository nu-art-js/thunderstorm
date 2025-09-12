import {deepClone} from '@nu-art/ts-common';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';
import {onValueWritten} from 'firebase-functions/v2/database';

type TypeOf_onValueWritten = typeof onValueWritten;

export abstract class ModuleBE_FirebaseDBListener<DataType = any, ConfigType = any>
	extends ModuleBE_BaseFunction<ConfigType> {

	private readonly listeningPath: string;
	private function!: ReturnType<TypeOf_onValueWritten>;

	protected constructor(listeningPath: string, name?: string) {
		super();
		if (name)
			this.setName(name);
		this.listeningPath = listeningPath;
	}

	abstract processChanges(before: DataType, after: DataType, params: { [param: string]: any }): Promise<any>;

	getFunction = () => {
		if (this.function)
			return this.function;

		const handler: Parameters<TypeOf_onValueWritten>[1] = (event) => {
			const before: DataType = event.data.before && event.data.before.val();
			const after: DataType = event.data.after && event.data.after.val();
			const params = deepClone(event.params);

			return this.handleCallback(() => this.processChanges(before, after, params));
		};

		return this.function = onValueWritten(this.listeningPath, handler);
	};
}
