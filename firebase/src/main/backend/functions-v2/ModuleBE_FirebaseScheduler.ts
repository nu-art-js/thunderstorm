import {Change, CloudFunction, RuntimeOptions} from 'firebase-functions';
import {DataSnapshot} from 'firebase/database';
import {addItemToArray, ImplementationMissingException, merge} from '@thunder-storm/common';
import {MemStorage} from '@thunder-storm/common/mem-storage/MemStorage';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const functions = require('firebase-functions');

/**
 An abstract class representing a scheduled Firebase Cloud Function.
 It extends the FirebaseFunction class and adds scheduling capabilities.
 */
export abstract class ModuleBE_FirebaseScheduler<ConfigType = any>
	extends ModuleBE_BaseFunction<ConfigType> {

	private function!: CloudFunction<Change<DataSnapshot>>;
	private schedule?: string;
	private runningCondition: (() => Promise<boolean>)[] = [async () => true];
	private _runtimeOptions: RuntimeOptions = {};

	/**
	 *
	 * @param name
	 * @param tag
	 * @protected
	 */
	protected constructor(name?: string, tag?: string) {
		super(tag);
		name && this.setName(name);
	}

	runtimeOptions = {
		set: (runtimeOptions: RuntimeOptions) => {
			this._runtimeOptions = runtimeOptions;
		},
		append: (runtimeOptions: RuntimeOptions) => {
			this._runtimeOptions = merge(this._runtimeOptions, runtimeOptions);
		}
	};

	/**
	 * Add a running condition to the list of conditions that must pass in order for the backup to execute
	 */
	addRunningCondition(runningCondition: () => Promise<boolean>) {
		addItemToArray(this.runningCondition, runningCondition);
		return this;
	}

	/**
	 * Set the schedule for this scheduled event
	 */
	setSchedule(schedule: string) {
		this.schedule = schedule;
		return this;
	}

	abstract onScheduledEvent(): Promise<any>;

	/**
	 * Check all running conditions,
	 * return early if any fail
	 */
	private _onScheduledEvent = async () => {
		const results: boolean[] = await Promise.all(this.runningCondition.map(condition => condition()));

		if (results.includes(false)) {
			this.logDebug('will not execute backup.. running conditions didn\'t pass: ', results);
			return;
		}
		return this.onScheduledEvent();
	};

	getFunction = () => {
		if (!this.schedule)
			throw new ImplementationMissingException('MUST set schedule !!');

		if (this.function)
			return this.function;

		return this.function = functions.runWith(this._runtimeOptions).pubsub.schedule(this.schedule).onRun(async () => {
			return this.handleCallback(() => new MemStorage().init(this._onScheduledEvent));
		});
	};
}