import {StaticLogger, TS_Object} from '@nu-art/ts-common';

function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof window.atob === 'function';
}

export function convertBase64ToObject<T extends TS_Object>(base64: string): T {
	try {
		// Check if running in the browser
		const decoded = isBrowser()
			? window.atob(base64) // Browser: Use `atob`
			: Buffer.from(base64, 'base64').toString('utf-8'); // Node.js: Use `Buffer`
		return JSON.parse(decoded);
	} catch (err: any) {
		StaticLogger.logError(err);
		return {} as T; // Return an empty object of type T on failure
	}
}

export function convertObjectToBase64<T extends TS_Object>(object: T): string {
	try {
		// Check if running in the browser
		const string = JSON.stringify(object);
		return isBrowser()
			? window.btoa(string)
			: Buffer.from(string, 'utf-8').toString('base64');
	} catch (err: any) {
		StaticLogger.logError(err);
		return '';
	}
}