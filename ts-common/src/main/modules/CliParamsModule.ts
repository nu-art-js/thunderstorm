import { Module } from "../core/module";
import { TypedMap, ObjectTS } from "../utils/types";
import { BadImplementationException, ImplementationMissingException } from "../core/exceptions";


export type CliParam<K, T extends string | string[] = string> = {
	keys: string[];
	name: string;
	keyName: K;
	mandatory?: boolean;
	options?: string[];
	defaultValue?: string;
	process?: (value: T) => T;
}

type Params = CliParam<string> | CliParam<string, string[]>;
type Config = {
	params: Params[];
}

class CliParamsModule_Class
	extends Module<Config> {

	private paramsValue: TypedMap<string | string[]> = {};

	init() {
		this.extractParams(this.config.params);
	}

	getParam<T extends string | string[]>(param: CliParam<string, T>) {
		if (!this.config.params.find(_param => _param.keyName === param.keyName))
			throw new BadImplementationException("Requested not existing param");

		const value = this.paramsValue[param.keyName] as T;
		return param.process ? param.process(value) : value;
	}

	printHowTo = (argsDetails: Params[], foundArgs: ObjectTS) => {
		const _foundArgs = argsDetails.filter((arg) => {
			return foundArgs[arg.keyName];
		});

		if (_foundArgs.length) {
			this.logInfoBold(`        Found Args:`);
			_foundArgs.forEach((arg) => {
				const foundArg = foundArgs[arg.keyName];
				if (foundArg)
					this.logInfo(`          ${arg.keys[0]}=${foundArg}`);
			});
		}

		const mandatoryArgs = argsDetails.filter((arg) => {
			return arg.mandatory;
		});

		if (_foundArgs.length === mandatoryArgs.length) {
			argsDetails
				.filter((arg) => !arg.mandatory && foundArgs[arg.keyName] === undefined)
				.forEach((arg) => foundArgs[arg.keyName] = undefined);
			return
		}

		this.logErrorBold(`\n        Missing Args:`);
		argsDetails.forEach((arg) => {
			const foundArg = foundArgs[arg.keyName];
			if (!foundArg)
				this.logWarning(`          ${arg.keys.join("/")}=<${arg.name}>`);
		});

		throw new ImplementationMissingException("Missing cli params")

	}

	getParams = () => {
		return this.paramsValue;
	}

	extractParams = (argsDetails: Params[], argv?: string[]) => {
		argsDetails.forEach((argDetails) => {
			console.log("argDetails: " + argDetails.keyName);
			const cliArgv = argv || process.argv.slice(2, process.argv.length);
			cliArgv.forEach((arg) => {
				const value = argDetails.keys.map((key) => {
					const match = arg.match(new RegExp(`${key}=(.*)`));
					return match ? match[1] : null;
				}).find((argValue) => {
					return argValue;
				});

				if (value) {
					const type = typeof this.paramsValue[argDetails.keyName];
					switch (type) {
						case "undefined":
							this.paramsValue[argDetails.keyName] = value;
							break;
						case "string":
							this.paramsValue[argDetails.keyName] = [this.paramsValue[argDetails.keyName] as string, value];
							break;
						default:
							(this.paramsValue[argDetails.keyName] as string[]).push(value);
							break;
					}
				}
			});
		});

		this.printHowTo(argsDetails, this.paramsValue);
		return this.paramsValue;
	}
}

export const CliParamsModule = new CliParamsModule_Class();
