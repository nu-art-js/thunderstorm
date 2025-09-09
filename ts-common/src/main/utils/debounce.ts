import {BadImplementationException} from '../core/exceptions/exceptions';
import {Logger} from '../core/logger/Logger';
import {isPromise} from './promise-tools';
import {exists} from './tools';

export class Debounce<Args extends any[], Response>
	extends Logger {

	private action: (...args: Args) => Response;
	private readonly waitMs: number;
	private readonly maxWaitMs?: number;
	private triggerIndex: number = 0;

	private waitTimer?: ReturnType<typeof setTimeout>;
	private maxTimer?: ReturnType<typeof setTimeout>;
	private latestArgs: Args = [] as unknown as Args;
	private actionInProgress: boolean = false;
	private triggerPending: boolean = false;

	constructor(action: (...args: Args) => Response, waitMs: number, maxWaitMs?: number) {
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

	private executeAction(triggerIndex: number): Response | undefined {
		if (triggerIndex !== this.triggerIndex)
			return;

		this.triggerIndex++;
		const args = this.latestArgs ?? ([] as unknown as Args);
		this.clearTimers();
		const result = this.action(...args);
		//Set up chain triggering if the action is asynchronous.
		if (isPromise(result)) {
			this.actionInProgress = true;
			Promise.resolve(result).finally(() => {
				this.actionInProgress = false;

				//Immediately execute the action again if debounce was triggered during the current run
				if (this.triggerPending) {
					this.triggerPending = false;
					void this.executeAction(this.triggerIndex);
				}
			});
		}
		return result;
	}

	//######################### Public Logic #########################

	/** Schedule the action to be performed (fire-and-forget). */
	public trigger(...args: Args): void {
		this.latestArgs = args;

		//If action is in progress, queue up immediate trigger
		if (this.actionInProgress) {
			this.triggerPending = true;
			return;
		}

		// Normal debounce behavior while idle:
		//Reset waitTimer
		if (this.waitTimer) clearTimeout(this.waitTimer);
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
	 * Run immediately if scheduled and return the action's value.
	 * - Returns Response when something was scheduled, else undefined.
	 * - If action throws sync here, it throws to the caller.
	 * - If action returns a rejected Promise, caller handles it.
	 */
	public flush(): Response | undefined {
		if (!this.isScheduled())
			return;

		return this.executeAction(this.triggerIndex);
	}

	/** Cancel any scheduled run. (Does not cancel in-flight.) */
	public clear(): void {
		this.clearTimers();
		this.triggerIndex++;
		this.triggerPending = false;
	}
}