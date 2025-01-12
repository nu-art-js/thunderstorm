export type ResolvePromiseFunction<T> = (value: T | PromiseLike<T>) => void
export type RejectPromiseFunction = (reason?: any) => void
export type PromiseCallbackFunction<T> = (resolve: ResolvePromiseFunction<T>, reject: RejectPromiseFunction) => T;

/**
 * Promise wrapper for actions
 * use to wrap a action with a promise
 * @param callback The action to run
 */
export const promiseWrapper = <T>(callback: PromiseCallbackFunction<T>) => {
	return new Promise<T>((resolve, reject) => callback(resolve, reject));
};

/**
 * Check if a result of a function call is a promise
 * @param obj The function call to validate
 */
export const isPromise = <T = any>(obj: any): obj is Promise<T> => {
	return !!obj && typeof obj.then === 'function' && typeof obj.catch === 'function';
};