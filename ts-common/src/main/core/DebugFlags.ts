import {_keys} from '../utils/object-tools';
import {LogLevel} from './logger/types';
import {DebugFlag, DebugFlagConfig, DebugFlagPersistentStorage} from './debug-flags';


export class DebugFlags {
	private static readonly instance: DebugFlags = new DebugFlags();
	static readonly flags: { [k: string]: DebugFlag } = {};
	private readonly AllDebugFlags: { [k: string]: DebugFlagConfig } = {};

	static listFlags(): string[] {
		return _keys(this.flags);
	}

	static readonly persistentState: DebugFlagPersistentStorage = {
		get: (debugKey) => this.instance.AllDebugFlags[debugKey],
		set: (debugKey, values = {enabled: true, logLevel: LogLevel.Info}) => {
			this.instance.AllDebugFlags[debugKey] = {...this.instance.AllDebugFlags[debugKey], ...(values)};
		}
	};

	private constructor() {
	}

	static add(flag: DebugFlag) {
		// console.log(`Creating a new flag: ${flag.key}`);
		const existingInstance = this.persistentState.get(flag.key);
		if (existingInstance)
			return;

		// console.log(`flag config before: ${flag.key} <> ${config}`);
		this.persistentState.set(flag.key);
		// console.log(`flag config after: ${flag.key} <> ${config}`);

	}

	static rename(previousKey: string, newKey: string) {
		const flag = this.instance.AllDebugFlags[previousKey];
		if (!flag)
			return;

		delete this.instance.AllDebugFlags[previousKey];
		this.instance.AllDebugFlags[newKey] = flag;
	}
}
