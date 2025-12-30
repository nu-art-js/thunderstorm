import {asArray, exists, filterDuplicates, StaticLogger} from '@nu-art/ts-common';
import {BaseCliParam, CliParam, CliParams} from './types.js';
import {DefaultProcessorsMapper} from './consts.js';


/**
 * Type-safe CLI parameter resolver and parser.
 * 
 * Parses command-line arguments (`process.argv`) into a typed object based on
 * parameter definitions. Supports:
 * - Multiple keys/aliases per parameter
 * - Type validation and conversion
 * - Default values and initial values
 * - Option validation (restrict to specific values)
 * - Array parameters (collect multiple values)
 * - Dependencies (set other params based on current param)
 * - Quoted string handling
 * 
 * **Usage**:
 * ```typescript
 * const resolver = CLIParamsResolver.create(
 *   { keys: ['--name', '-n'], keyName: 'name', type: 'string', description: 'Name' },
 *   { keys: ['--count'], keyName: 'count', type: 'number', defaultValue: 1 }
 * );
 * const params = resolver.resolveParamValue();
 * // params.name: string, params.count: number
 * ```
 * 
 * @template T - Array of BaseCliParam definitions
 * @template Output - Resolved parameters object type
 */
export class CLIParamsResolver<T extends BaseCliParam<string, any>[], Output extends CliParams<T> = CliParams<T>> {

	/** Processed parameters with all required fields filled */
	private params: CliParam<string, any>[];

	/**
	 * Creates a CLIParamsResolver instance.
	 * 
	 * @template T - Array of BaseCliParam definitions
	 * @param params - Parameter definitions
	 * @returns New CLIParamsResolver instance
	 */
	static create<T extends BaseCliParam<string, any>[]>(...params: T) {
		return new CLIParamsResolver<T>(params);
	}

	/**
	 * Creates a CLIParamsResolver and processes parameters.
	 * 
	 * @param params - Parameter definitions (may be incomplete)
	 */
	constructor(params: BaseCliParam<string, any>[]) {
		this.params = this.translate(params);
	}

	/**
	 * Parses command-line arguments into a typed parameters object.
	 * 
	 * **Parsing Behavior**:
	 * - Splits arguments by `=` (e.g., `--key=value`)
	 * - Strips quotes from values and unescapes quotes
	 * - Processes values using parameter processors
	 * - Validates against options if provided
	 * - Handles dependencies (sets dependent params)
	 * - Accumulates array values (removes duplicates)
	 * - Applies initial values for missing params
	 * - Warns when overriding non-array values
	 * 
	 * **Input Format**: `--key=value` or `--key value` (space-separated not supported)
	 * 
	 * @param inputParams - Command-line arguments (default: `process.argv.slice(2)`)
	 * @returns Typed object with resolved parameter values
	 * @throws Error if value not in options, or if required value missing
	 */
	resolveParamValue(inputParams = process.argv.slice(2, process.argv.length)) {
		type Key = keyof Output
		type Value = Output[Key];

		const runtimeParams = inputParams.reduce((output, inputParam) => {
			let [key, value] = inputParam.split('=');
			const cliParamToResolve = this.findMatchingParamToResolve(key);
			if (!cliParamToResolve)
				return output;

			if (value && value.startsWith('"') && value.endsWith('"')) {
				value = value.slice(1, -1);
				value = value.replace(/\\"/g, '"');
			}
			const finalValue = cliParamToResolve.process(value, cliParamToResolve.defaultValue);

			// validate options if exits
			if (cliParamToResolve.options && !cliParamToResolve.options.includes(finalValue))
				throw new Error(`value not supported for param: ${cliParamToResolve.name}, supported values: ${cliParamToResolve.options.join(', ')}`);

			const keyName = cliParamToResolve.keyName as Key;

			if (exists(cliParamToResolve.dependencies))
				cliParamToResolve.dependencies?.forEach(dependency => {
					// If dependency value is a function, call it with the current param's processed value
					const dependencyValue = typeof dependency.value === 'function' 
						? dependency.value(finalValue) 
						: dependency.value;
					output[dependency.param.keyName as Key] = dependencyValue;
				});

			if (cliParamToResolve.isArray) {
				let currentValues = output[keyName] as Value;
				currentValues = filterDuplicates([...(currentValues ?? []), ...asArray(finalValue)]) as Value;

				output[keyName] = currentValues;
				return output;
			}

			//if already exists and the value ain't an array warn that the value will be overridden
			if (output[keyName])
				StaticLogger.logWarning(`this param does not accept multiple values, overriding prev value: ${output[keyName]}`);

			//Apply a single value to the object
			output[keyName] = finalValue;
			return output;
		}, {} as Output);

		this.params.filter(param => exists(param.initialValue) && !exists(runtimeParams[param.keyName as Key])).forEach(param => {
			runtimeParams[param.keyName as Key] = param.initialValue;
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
		let matchingParam: CliParam<string, any> | undefined;

		this.params.forEach((param) => {
			param.keys.forEach((key) => {
				if (inputParam === key)
					matchingParam = param;

				if (inputParam.startsWith(`${key}=`))
					matchingParam = param;
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