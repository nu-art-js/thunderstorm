/**
 * Runs at most `parallel` tasks at once.
 * No count means every task starts immediately.
 */
export function createPhaseGate(parallel: number | undefined) {
	if (parallel === undefined)
		return async <T>(task: () => Promise<T>) => task();

	let active = 0;
	const waiters: Array<() => void> = [];

	return async <T>(task: () => Promise<T>): Promise<T> => {
		if (active >= parallel)
			await new Promise<void>(resolve => {
				waiters.push(resolve);
			});

		active++;
		try {
			return await task();
		} finally {
			active--;
			waiters.shift()?.();
		}
	};
}
