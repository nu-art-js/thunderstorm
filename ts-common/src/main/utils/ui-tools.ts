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

export const awaitedDebounce = <Args extends any[], ReturnValue = any>(
	func: (...params: Args) => ReturnValue | Promise<ReturnValue>,
	timeout: number = 500,
	defaultCallback: number = 1000
): AwaitedDebounceInstance<Args, ReturnValue> => {
	let timer: NodeJS.Timeout | undefined;
	let defaultTimer: NodeJS.Timeout | undefined;
	let pendingResult: ReturnValue | Promise<ReturnValue> | undefined;

	return (...args: Args) => {
		clearTimeout(timer);
		clearTimeout(defaultTimer);

		if (!pendingResult) {
			return new Promise<ReturnValue | undefined>((resolve) => {
				timer = setTimeout(() => {
					pendingResult = func(...args);
					resolve(pendingResult);
					clearTimeout(defaultTimer);
					defaultTimer = undefined;
				}, timeout);

				if (!defaultTimer) {
					defaultTimer = setTimeout(() => {
						pendingResult = func(...args);
						resolve(pendingResult);
						defaultTimer = undefined;
					}, defaultCallback);
				}
			});
		} else {
			const result = Promise.resolve(pendingResult);
			pendingResult = undefined;
			return result;
		}
	};
};
