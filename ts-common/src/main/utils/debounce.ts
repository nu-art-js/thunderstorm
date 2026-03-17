import {BadImplementationException} from '../core/exceptions/exceptions.js';
import {Logger} from '../core/logger/index.js';
import {isPromise} from './promise-tools.js';
import {exists} from './tools.js';

/**
 * Debounce implementation with support for async actions and max wait time.
 *
 * Debouncing delays the execution of an action until after a specified wait period
 * has elapsed since the last trigger. If triggers continue to occur, the wait timer
 * resets. Optionally supports a maximum wait time that forces execution even if
 * triggers continue.
 *
 * **Features**:
 * - Standard debounce behavior (resets timer on each trigger)
 * - Optional max wait time (throttle-like behavior)
 * - Handles async actions (waits for completion before processing next trigger)
 * - Queues triggers that occur while action is executing
 * - Can flush immediately or clear scheduled execution
 *
 * **Behavior with async actions**: If the action returns a Promise, the debounce
 * waits for it to complete before processing the next trigger. If triggers occur
 * during execution, they are queued and executed immediately after completion.
 *
 * @template Args - Type of arguments passed to the action
 * @template Response - Return type of the action
 */
export class Debounce<Args extends any[], Response>
	extends Logger {

	/** The function to debounce */
	private action: (...args: Args) => Response;
	/** Wait time in milliseconds before executing action */
	private readonly waitMs: number;
	/** Optional maximum wait time - forces execution even if triggers continue */
	private readonly maxWaitMs?: number;
	/** Incrementing index to track trigger generations and prevent stale executions */
	private triggerIndex: number = 0;

	/** Timer for the wait period */
	private waitTimer?: ReturnType<typeof setTimeout>;
	/** Timer for the max wait period */
	private maxTimer?: ReturnType<typeof setTimeout>;
	/** Latest arguments from the most recent trigger */
	private latestArgs: Args = [] as unknown as Args;
	/** Flag indicating if the action is currently executing (for async actions) */
	private actionInProgress: boolean = false;
	/** Flag indicating if a trigger occurred while action was executing */
	private triggerPending: boolean = false;

	/**
	 * Creates a new Debounce instance.
	 *
	 * @param action - Function to debounce
	 * @param waitMs - Wait time in milliseconds (must be >= 0)
	 * @param maxWaitMs - Optional maximum wait time (must be > 0 and >= waitMs)
	 */
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

	/**
	 * Executes the action if the trigger index matches.
	 *
	 * Uses overloaded signatures to return the result when called with `immediate: true`
	 * (for flush operations), or undefined for scheduled executions.
	 *
	 * **Async handling**: If the action returns a Promise, sets up a chain to handle
	 * queued triggers that occurred during execution.
	 *
	 * @param triggerIndex - Expected trigger index (prevents stale executions)
	 * @param immediate - If true, returns the result. If false/undefined, returns undefined.
	 * @returns Action result if immediate, undefined otherwise
	 */
	private executeAction(triggerIndex: number, immediate: true): Response;
	private executeAction(triggerIndex: number, immediate?: false): undefined;
	private executeAction(triggerIndex: number, immediate?: boolean): Response | undefined {
		if (triggerIndex !== this.triggerIndex)
			return;

		this.triggerIndex++;
		const args = this.latestArgs ?? ([] as unknown as Args);
		this.clearTimers();
		const result = this.action(...args);
		if (immediate)
			return result;

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
	}

	//######################### Public Logic #########################

	/**
	 * Triggers the debounced action.
	 *
	 * Schedules the action to execute after `waitMs` milliseconds. If called again
	 * before execution, the timer resets. If `maxWaitMs` is set and reached, the
	 * action executes regardless of recent triggers.
	 *
	 * **Behavior**:
	 * - If action is currently executing (async), queues a trigger for after completion
	 * - Otherwise, resets the wait timer
	 * - Sets max wait timer on first trigger (if configured)
	 *
	 * @param args - Arguments to pass to the action
	 */
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
	 * Checks if an action is currently scheduled for execution.
	 *
	 * @returns true if either wait timer or max timer is active
	 */
	public isScheduled(): boolean {
		return exists(this.waitTimer ?? this.maxTimer);
	}

	/**
	 * Executes the action immediately if scheduled, returning the result.
	 *
	 * Cancels any pending timers and executes the action with the latest arguments.
	 * If the action is async, the Promise is returned and the caller must handle it.
	 *
	 * **Note**: If nothing is scheduled, logs an info message and returns undefined.
	 *
	 * @returns Action result if scheduled, undefined otherwise
	 * @throws If action throws synchronously, the error propagates to caller
	 */
	public flush(): Response | undefined {
		if (!this.isScheduled())
			return void this.logInfo('Not scheduled');

		return this.executeAction(this.triggerIndex, true);
	}

	/**
	 * Cancels any scheduled execution.
	 *
	 * Clears timers and increments trigger index to invalidate any pending executions.
	 * Does not cancel in-flight async actions - they will complete normally.
	 */
	public clear(): void {
		this.clearTimers();
		this.triggerIndex++;
		this.triggerPending = false;
	}
}