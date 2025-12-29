/** Type for Promise resolve function */
export type ResolvePromiseFunction<T> = (value: T | PromiseLike<T>) => void
/** Type for Promise reject function */
export type RejectPromiseFunction = (reason?: any) => void
/** Type for Promise executor callback function */
export type PromiseCallbackFunction<T> = (resolve: ResolvePromiseFunction<T>, reject: RejectPromiseFunction) => T;

/**
 * Wraps a callback-based function in a Promise.
 * 
 * Useful for converting callback-style APIs to Promise-based APIs.
 * The callback receives resolve and reject functions to control the Promise.
 * 
 * @param callback - Function that receives resolve/reject and performs the action
 * @returns Promise that resolves/rejects based on callback execution
 * 
 * @example
 * ```typescript
 * const promise = promiseWrapper((resolve, reject) => {
 *   setTimeout(() => resolve('done'), 1000);
 * });
 * ```
 */
export const promiseWrapper = <T>(callback: PromiseCallbackFunction<T>) => {
	return new Promise<T>((resolve, reject) => callback(resolve, reject));
};

/**
 * Type guard that checks if a value is a Promise.
 * 
 * Checks for both native Promise instances and thenable objects (duck typing).
 * 
 * @param obj - Value to check
 * @returns true if the value is a Promise or thenable
 */
export const isPromise = <T = any>(obj: any): obj is Promise<T> => {
	return obj instanceof Promise || (!!obj && (typeof obj.then === 'function' && typeof obj.catch === 'function'));
};