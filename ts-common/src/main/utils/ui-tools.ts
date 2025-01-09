/**
 * Creates a debounced function that delays invoking the provided function until after a specified
 * timeout has elapsed since the last time the debounced function was called. It also ensures that
 * the function is called at least once after a maximum timeout, even if the debounced function
 * keeps being called.
 *
 * @param func - The function to debounce. It can be a regular function or an asynchronous function.
 * @param timeout - The number of milliseconds to delay (default 500ms).
 * @param maxTimeout - The maximum time to wait before invoking the function, regardless of
 *                     continuous calls to the debounced function (default 1000ms).
 *
 * @returns A new function that, when called, will delay the invocation of the original function
 *          until the specified timeout has elapsed since the last call. If the returned function
 *          is continually called, it will still invoke the original function after the maxTimeout
 *          has elapsed.
 *
 * @template Args - The type of the arguments that the provided function accepts.
 *
 * @example
 * const debouncedFunc = debounce((arg1, arg2) => {
 *   console.log(arg1, arg2);
 * }, 500, 1000);
 *
 * // Call the function repeatedly
 * debouncedFunc("hello", "world");
 * debouncedFunc("foo", "bar");
 * // The original function will be invoked after 500ms since the last call,
 * // or at least once after 1000ms, regardless of continuous calls.
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

export type AwaitedDebounceInstance<Args extends any[], ReturnValue> = (...args: Args) => Promise<ReturnValue | undefined>

type DebounceParams<Args extends any[], ReturnValue = any> = {
	func: (...params: Args) => Promise<ReturnValue>,
	timeout?: number,
	fallbackTimeout?: number
}

type Timers = {
	timer?: NodeJS.Timeout,
	fallbackTimer?: NodeJS.Timeout
};

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

