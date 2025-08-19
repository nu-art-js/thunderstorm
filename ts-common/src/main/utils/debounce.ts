import {BadImplementationException} from '../core/exceptions/exceptions';
import {Logger} from '../core/logger/Logger';
import {exists} from './tools';

export class Debounce<Args extends any[]>
	extends Logger {

	private action: (...args: Args) => (unknown | Promise<unknown>);
	private readonly waitMs: number;
	private readonly maxWaitMs?: number;
	private triggerIndex: number = 0;

	private waitTimer?: ReturnType<typeof setTimeout>;
	private maxTimer?: ReturnType<typeof setTimeout>;
	private latestArgs: Args = [] as unknown as Args;

	constructor(action: (...args: Args) => (unknown | Promise<unknown>), waitMs: number, maxWaitMs?: number) {
		super('Debounce');
		this.validate_WaitMs(waitMs);
		this.validate_MaxWaitMs(waitMs, maxWaitMs);
		this.action = action;
		this.waitMs = waitMs;
		this.maxWaitMs = maxWaitMs;
	}

	//######################### Validation #########################

	private validate_WaitMs(waitMs: number) {
		if (waitMs < 0)
			throw new BadImplementationException('waitMs value must be >= 0');
	}

	private validate_MaxWaitMs(waitMs: number, maxWaitMs?: number) {
		if (!exists(maxWaitMs))
			return;

		if (maxWaitMs <= 0)
			throw new BadImplementationException('maxWaitMs value must be > 0');

		if (maxWaitMs < waitMs)
			this.logWarning('maxWaitMs < waitMs; the \'max\' may never matter');
	}

	//######################### Internal Logic #########################

	private clearTimers() {
		if (this.waitTimer) {
			clearTimeout(this.waitTimer);
			this.waitTimer = undefined;
		}
		if (this.maxTimer) {
			clearTimeout(this.maxTimer);
			this.maxTimer = undefined;
		}
	}

	private async executeAction(triggerIndex: number) {
		if (triggerIndex !== this.triggerIndex)
			return;

		this.triggerIndex++;
		const args = this.latestArgs ?? ([] as unknown as Args);
		this.clearTimers();
		try {
			await this.action(...args);
		} catch (err: any) {
			this.logError('Action threw error', err);
		}
	}

	//######################### Public Logic #########################

	/**
	 * Schedules the action to be performed
	 * @param args
	 */
	public trigger(...args: Args): void {
		this.latestArgs = args;
		//Reset waitTimer
		if (this.waitTimer)
			clearTimeout(this.waitTimer);
		const triggerIndex = this.triggerIndex;
		this.waitTimer = setTimeout(() => {
			void this.executeAction(triggerIndex);
		}, this.waitMs);

		//Set maxWaitTimer if configured and does not currently exist
		if (exists(this.maxWaitMs) && !exists(this.maxTimer))
			this.maxTimer = setTimeout(() => {
				void this.executeAction(triggerIndex);
			}, this.maxWaitMs);
	}

	/**
	 * Returns whether an action is currently scheduled
	 */
	public isScheduled(): boolean {
		return Boolean(this.waitTimer || this.maxTimer);
	}

	/**
	 * Immediately performs the action if one was scheduled
	 */
	public flush() {
		if (!this.isScheduled())
			return;

		void this.executeAction(this.triggerIndex);
	}

	/**
	 * Cancels current scheduled action
	 */
	public clear() {
		this.clearTimers();
		this.triggerIndex++;
	}
}