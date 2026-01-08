/**
 * Creates a debounced function with maximum timeout guarantee.
 * 
 * Delays function invocation until `timeout` ms after the last call, but guarantees
 * execution after `maxTimeout` ms even if calls continue. This combines debounce
 * behavior with throttle-like guarantees.
 * 
 * **Behavior**:
 * - Each call resets the `timeout` timer
 * - If `maxTimeout` elapses, function executes regardless of recent calls
 * - After execution, timers reset and the cycle repeats
 * 
 * @template Args - Function argument types
 * @param func - Function to debounce (can be async)
 * @param timeout - Delay in milliseconds (default: 500)
 * @param maxTimeout - Maximum wait time in milliseconds (default: 1000)
 * @returns Debounced function
 * 
 * @example
 * ```typescript
 * const debounced = debounce((msg) => console.log(msg), 500, 1000);
 * debounced('a'); // Resets timer
 * debounced('b'); // Resets timer
 * // Executes after 500ms of no calls, OR after 1000ms total
 * ```
 */
export const debounce = <Args extends any[]>(func: (...params: Args) => any | Promise<any>, timeout: number = 500, maxTimeout: number = 1000) => {
	let timer: NodeJS.Timeout;
	let defaultTimer: NodeJS.Timeout | undefined;
	return (...args: Args) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func(...args);
			clearTimeout(defaultTimer);
			defaultTimer = undefined;
		}, timeout);
		if (!defaultTimer) {
			defaultTimer = setTimeout(() => {
				func(...args);
				defaultTimer = undefined;
			}, maxTimeout);
		}
	};
};

/**
 * Creates a queued debounced function that prevents concurrent execution.
 * 
 * Similar to `debounce()` but ensures the function never runs concurrently.
 * If a call occurs while the function is executing, it queues another execution
 * after the current one completes.
 * 
 * **Behavior**:
 * - Standard debounce behavior (resets timer on each call)
 * - Maximum timeout guarantee (executes after maxTimeout)
 * - If function is running when timeout triggers, queues execution for after completion
 * 
 * @template Args - Function argument types
 * @param func - Async function to debounce
 * @param timeout - Delay in milliseconds (default: 500)
 * @param maxTimeout - Maximum wait time in milliseconds (default: 1000)
 * @returns Queued debounced function
 */
export const queuedDebounce = <Args extends any[]>(func: (...params: Args) => any | Promise<any>, timeout: number = 500, maxTimeout: number = 1000) => {
	let timer: NodeJS.Timeout;
	let defaultTimer: NodeJS.Timeout | undefined;
	let running: boolean = false;

	const debounceFunc = (...args: Args) => {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			clearTimeout(defaultTimer);
			defaultTimer = undefined;
			await execFunc(...args);
		}, timeout);
		if (!defaultTimer) {
			defaultTimer = setTimeout(async () => {
				defaultTimer = undefined;
				await execFunc(...args);
			}, maxTimeout);
		}
	};

	const execFunc = async (...args: Args) => {
		if (running) {
			clearTimeout(defaultTimer);
			defaultTimer = undefined;
			return debounceFunc(...args);
		}

		try {
			running = true;
			await func(...args);
		} finally {
			running = false;
		}
	};

	return debounceFunc;
};

/**
 * Return type for awaited debounce - returns a Promise that resolves with the function result.
 */
export type AwaitedDebounceInstance<Args extends any[], ReturnValue> = (...args: Args) => Promise<ReturnValue | undefined>

/**
 * Parameters for awaited debounce.
 */
type DebounceParams<Args extends any[], ReturnValue = any> = {
	/** Async function to debounce */
	func: (...params: Args) => Promise<ReturnValue>,
	/** Delay in milliseconds (default: 500) */
	timeout?: number,
	/** Maximum wait time in milliseconds (default: 1000) */
	fallbackTimeout?: number
}

/**
 * Internal timer storage for awaited debounce.
 */
type Timers = {
	timer?: NodeJS.Timeout,
	fallbackTimer?: NodeJS.Timeout
};

/**
 * Creates a debounced function that returns a Promise resolving to the function result.
 * 
 * Similar to `debounce()` but returns a Promise that resolves when the function executes.
 * Useful when you need to await the debounced function's result.
 * 
 * **Behavior**:
 * - Standard debounce (resets timer on each call)
 * - Maximum timeout guarantee (executes after fallbackTimeout)
 * - Returns Promise that resolves with function result or rejects with function error
 * 
 * @template Args - Function argument types
 * @template ReturnValue - Function return type
 * @param params - Debounce configuration
 * @returns Debounced function that returns a Promise
 */
export const awaitedDebounce = <Args extends any[], ReturnValue = any>(params: DebounceParams<Args, ReturnValue>): AwaitedDebounceInstance<Args, ReturnValue> => {
	const timers: Timers = {};
	const _clearTimeout = (timer: keyof Timers) => {
		clearTimeout(timers[timer]);
		delete timers[timer];
	};

	const _clearTimeouts = () => {
		_clearTimeout('timer');
		_clearTimeout('fallbackTimer');
	};

	return (...args: Args) => {
		return new Promise<ReturnValue>((resolve, reject) => {
			const timeout = params.timeout ?? 500;
			_clearTimeout('timer');
			timers.timer = setTimeout(async () => {
				try {
					_clearTimeouts();
					const result = await params.func(...args);
					resolve(result);
				} catch (err: any) {
					reject(err);
				}
			}, timeout);

			if (!timers.fallbackTimer) {
				const fallbackTimeout = params.fallbackTimeout ?? 1000;
				timers.fallbackTimer = setTimeout(async () => {
					try {
						_clearTimeouts();
						const result = await params.func(...args);
						resolve(result);
					} catch (err: any) {
						reject(err);
					}
				}, fallbackTimeout);
			}
		});
	};
};

