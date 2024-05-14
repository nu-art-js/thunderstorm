import {exists, filterDuplicates, Primitive, StaticLogger, TypedMap, TypeOfTypeAsString} from '@nu-art/ts-common';


export const DefaultProcessor_Boolean: CliParam<any, boolean>['process'] = (input?: string, defaultValue?: boolean): boolean => {
	return true;
};

export const DefaultProcessor_String: CliParam<any, string>['process'] = (input?: string, defaultValue?: string): string => {
	if (!input || !input.length) {
		if (!defaultValue)
			throw new Error('expected string value');

		return defaultValue;
	}

	return input;
};

export const DefaultProcessor_Number: CliParam<any, number>['process'] = (input?: string, defaultValue?: number): number => {
	if (!input) {
		if (!defaultValue)
			throw new Error('expected number value');

		return defaultValue;
	}

	if (isNaN(Number(input)))
		throw new Error('expected number value');

	return Number(input);
};

const DefaultProcessorsMapper: TypedMap<CliParam<any, any>['process']> = {
	string: DefaultProcessor_String,
	boolean: DefaultProcessor_Boolean,
	number: DefaultProcessor_Number,
};

export type CliParams<T extends BaseCliParam<string, any>[]> = {
	[K in T[number]['keyName']]: NonNullable<Extract<T[number], { keyName: K }>['defaultValue']>
}

export type DependencyParam<T extends Primitive | Primitive[]> = {
	param: BaseCliParam<string, T>, value: T
}

export type BaseCliParam<K extends string, V extends Primitive | Primitive[]> = {
	keys: string[];
	keyName: K;
	type: TypeOfTypeAsString<V>;
	description: string;
	name?: string;
	options?: string[];
	defaultValue?: V;
	process?: (value?: string, defaultValue?: V) => V;
	isArray?: true;
	group?: string;
	dependencies?: DependencyParam<any>[]
}

export type CliParam<K extends string, V extends Primitive | Primitive[]> = BaseCliParam<K, V> & {
	name: string;
	process: (value?: string, defaultValue?: V) => V;
}

export class CLIParams_Resolver<T extends BaseCliParam<string, any>[], Output extends CliParams<T> = CliParams<T>> {

	private params: CliParam<string, any>[];

	static create<T extends BaseCliParam<string, any>[]>(...params: T) {
		return new CLIParams_Resolver<T>(params);
	}

	constructor(params: BaseCliParam<string, any>[]) {
		this.params = this.translate(params);
	}

	/**
	 * Format current input params and return it structured by the app params type.
	 * @param inputParams current console input arguments
	 * @returns CliParamsObject
	 */
	resolveParamValue(inputParams = process.argv.slice(2, process.argv.length)) {
		type Key = keyof Output
		type Value = Output[Key];

		const runtimeParams = inputParams.reduce((output, inputParam) => {
			const cliParamToResolve = this.findMatchingParamToResolve(inputParam);
			if (!cliParamToResolve)
				return output;

			const value = inputParam.split('=')[1];
			const finalValue = cliParamToResolve.process(value, cliParamToResolve.defaultValue);

			// validate options if exits
			if (cliParamToResolve.options && !cliParamToResolve.options.includes(value))
				throw new Error('value not supported for this param');

			const key = cliParamToResolve.keyName as Key;

			if (exists(cliParamToResolve.dependencies))
				cliParamToResolve.dependencies?.forEach(dependency => {
					output[dependency.param.keyName as Key] = dependency.value;
				});

			if (cliParamToResolve.isArray) {
				let currentValues = output[key] as Value;
				currentValues = filterDuplicates([...currentValues ?? [], finalValue]) as Value;

				output[key] = currentValues;
				return output;
			}

			//if already exists and the value ain't an array warn that the value will be overridden
			if (output[key])
				StaticLogger.logWarning(`this param does not accept multiple values, overriding prev value: ${output[key]}`);

			//Apply single value to the object
			output[key] = finalValue;
			return output;
		}, {} as Output);

		this.params.filter(param => exists(param.defaultValue) && !exists(runtimeParams[param.keyName as Key])).forEach(param => {
			runtimeParams[param.keyName as Key] = param.defaultValue;
		});

		return runtimeParams;
	}

	/**
	 * Find the matching param by finding it's key in the current argument
	 * Go over the app params and find the CLIParam object representing it
	 * @param inputParam The current console argument being parsed
	 * @returns The CliParam or undefined if not found
	 * @private
	 */
	private findMatchingParamToResolve(inputParam: string) {
		let maxKeyLength = 0;
		let matchingParam: CliParam<string, any> | undefined;

		// look for the longest fitting param in order to make sure we find the perfect match
		this.params.forEach((param) => {
			param.keys.forEach((key) => {
				if (inputParam.startsWith(key) && key.length > maxKeyLength) {
					maxKeyLength = key.length;
					matchingParam = param;
				}
			});
		});

		return matchingParam;
	}

	/**
	 * Translate BaseCLIParams passed to the constructor to CLIParams
	 * @param params User input of CLI params being passed to the constructor
	 * @private
	 * @returns CLI Params filled with all mandatory data
	 */
	private translate(params: BaseCliParam<string, any>[]): CliParam<string, any>[] {
		return params.map(param => {

			//If name is not defined apply key name as the param name
			if (!param.name)
				param.name = param.keyName as string;

			//If no processor is passed apply default by type
			if (!param.process) {
				param.process = DefaultProcessorsMapper[param.type.split('[')[0].trim()];
			}

			//Determine if value is array by the param type TODO: improve this chunk of code, this is not strict enough
			if (!exists(param.isArray) && param.type.includes('[]'))
				param.isArray = true;

			return param;
		}) as CliParam<string, any>[];
	}
}