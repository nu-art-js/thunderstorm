/**
 *
 * Creates a debounce function with a debounce and default timers
 *
 * @remarks
 * This method is a part of ui-utils in ts-common
 *
 * @param func The callback function to be called when the debounce fired.
 * @param timeout The debounce timer
 * @param defaultCallback The default timer for the default event to be fired.
 */
export const debounce = <Args extends any[]>(func: (...params: Args) => any | Promise<any>, timeout: number = 500, defaultCallback: number = 1000) => {
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
			}, defaultCallback);
		}
	};
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
		return new Promise<ReturnValue>((resolve) => {
			const timeout = params.timeout ?? 500;
			_clearTimeout('timer');
			timers.timer = setTimeout(async () => {
				_clearTimeouts();
				resolve(await params.func(...args));
			}, timeout);

			if (!timers.fallbackTimer) {
				const fallbackTimeout = params.fallbackTimeout ?? 1000;
				timers.fallbackTimer = setTimeout(async () => {
					_clearTimeouts();
					resolve(await params.func(...args));
				}, fallbackTimeout);
			}
		});
	};
};

