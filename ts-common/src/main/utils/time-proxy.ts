/** Internal time delta (offset from real time) */
let _dt = 0;

/**
 * Time proxy for manipulating time in tests and simulations.
 *
 * Allows setting a virtual time offset that affects `currentTimeMillis()` but not
 * `getRealTime()`. This is useful for:
 * - Testing time-dependent code
 * - Simulating time passage
 * - Fast-forwarding time in tests
 *
 * **Usage**: Set a delta or virtual time, and `currentTimeMillis()` will return
 * the adjusted time. Real time remains unchanged.
 *
 * @example
 * ```typescript
 * TimeProxy.setVirtualTime(1000000); // Set virtual time to 1 million ms
 * TimeProxy.currentTimeMillis(); // Returns 1000000 (or current real time + delta)
 * TimeProxy.getRealTime(); // Returns actual Date.now()
 * ```
 */
export const TimeProxy = Object.freeze({
	/**
	 * Gets the current time delta (offset from real time).
	 *
	 * @returns Time delta in milliseconds
	 */
	getDelta: () => _dt,
	/**
	 * Sets the time delta directly.
	 *
	 * @param dt - Time delta in milliseconds
	 */
	setDelta: (dt: number) => _dt = dt,
	/**
	 * Sets virtual time by calculating the delta from current real time.
	 *
	 * @param timestamp - Desired virtual timestamp in milliseconds
	 */
	setVirtualTime: (timestamp: number) => TimeProxy.setDelta(timestamp - TimeProxy.getRealTime()),
	/**
	 * Gets the current virtual time (real time + delta).
	 *
	 * This is the time that time-dependent code should use. In tests,
	 * this can be manipulated via `setDelta()` or `setVirtualTime()`.
	 *
	 * @returns Virtual timestamp in milliseconds
	 */
	currentTimeMillis: () => TimeProxy.getRealTime() + _dt,
	/**
	 * Gets the actual real time (unaffected by delta).
	 *
	 * @returns Real timestamp in milliseconds (Date.now())
	 */
	getRealTime: () => Date.now(),
	/**
	 * Resets the time delta to zero.
	 */
	reset: () => _dt = 0,
});
