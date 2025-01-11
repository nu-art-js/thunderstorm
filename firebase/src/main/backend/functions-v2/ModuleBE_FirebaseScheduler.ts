import {addItemToArray, ImplementationMissingException} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {ModuleBE_BaseFunction} from './ModuleBE_BaseFunction';
import {onSchedule, ScheduleFunction, ScheduleOptions} from 'firebase-functions/v2/scheduler';

/**
 An abstract class representing a scheduled Firebase Cloud Function.
 It extends the FirebaseFunction class and adds scheduling capabilities.
 */
export abstract class ModuleBE_FirebaseScheduler<ConfigType = any>
	extends ModuleBE_BaseFunction<ConfigType & ScheduleOptions> {

	private function!: ScheduleFunction;
	private runningCondition: (() => Promise<boolean>)[] = [async () => true];

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
		this.config.schedule = schedule;
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
		if (!this.config.schedule)
			throw new ImplementationMissingException('MUST set schedule !!');

		if (this.function)
			return this.function;

		return this.function = onSchedule(this.config, async () => {
			return this.handleCallback(() => new MemStorage().init(this._onScheduledEvent));
		});
	};
}