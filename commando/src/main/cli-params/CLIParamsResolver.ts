import {
	asArray,
	exists,
	filterDuplicates,
	StaticLogger} from '@thunder-storm/common';
import {BaseCliParam, CliParam, CliParams} from './types';
import {DefaultProcessorsMapper} from './consts';


export class CLIParamsResolver<T extends BaseCliParam<string, any>[], Output extends CliParams<T> = CliParams<T>> {

	private params: CliParam<string, any>[];

	static create<T extends BaseCliParam<string, any>[]>(...params: T) {
		return new CLIParamsResolver<T>(params);
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
				currentValues = filterDuplicates([...(currentValues ?? []), ...asArray(finalValue)]) as Value;

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